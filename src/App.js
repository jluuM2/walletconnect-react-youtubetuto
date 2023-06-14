import { SignClient } from "@walletconnect/sign-client";
import { useEffect, useState } from "react";
import {Web3Modal } from "@web3modal/standalone"
import './App.css';
import { ErrorDescription } from "ethers";

const web3Modal = new Web3Modal({
  projectId: process.env.REACT_APP_PROJECT_ID,
  standaloneChains: ["eip155:80001"]
})

function App() {
  const [signClient, setSignClient ] = useState();
  const [sessions, setSessions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [txHash, setTxHash] = useState([]);

  async function createClient(){

    try{
      const client = await SignClient.init({
        projectId: process.env.REACT_APP_PROJECT_ID
      })
      console.log('çlient', client);
      setSignClient(client);
      await subscribeToEvents(client);
    } catch(e) {
      console.log(e);
    }
  }

  async function handleConnect() {
    if (!signClient) throw Error("Cannot connect. signClient has not been initialized");
    try {
//proposal namespace
      const proposalNamespace = {
        eip155: {
          chains: ["eip155:80001"],
          methods: ["eth_sendTransaction"],
          events: ["connect", "disconnect"]
        }
      }
      const {uri, approval} = await signClient.connect( {
        requiredNamespaces: proposalNamespace
      })
      console.log('uri', uri)
      if (uri) {
        web3Modal.openModal({uri})
        const sessionNamespace = await approval();
        console.log('sessionnamespace',sessionNamespace )
        onSessionConnect(sessionNamespace)
        web3Modal.closeModal()
      }
    }catch (e) {
      console.log(e);
    }
  }

  async function onSessionConnect(session){
    if (!session) throw Error("session not exist")
    try {
      setSessions(session)
      const eip155AccountComponents = session.namespaces.eip155.accounts[0].split(':')
      setAccounts(eip155AccountComponents[2]);
    } catch (error) {
      console.log(error)
    }
  }

  async function handleDisconnect(){
    try {
      await signClient.disconnect({
        topic: sessions.topic,
        code: 6000,
        message: "User disconnected"
      });
      reset();
    } catch (error) {
      console.log(error)
    }
  }

  async function subscribeToEvents(client){
    if (!client) throw Error("No client to subscribe to")
    try {
      client.on("session_delete",() => {
        console.log("user disconnected the session from the wallet");
        reset()
      })
    } catch (error) {
      console.log(error)
    }
  }

  async function handleSend(){
    try {
      const tx = {
        from: accounts,
        to: "0x50Edb3d07314a4ADf165D62aC04CF0265307FfC6",
        data: "0x",
        gasPrice: "0x06FC23AC00",
        gasLimit: "0xA410",
        value: "0x38D7EA4C68000" // 1 milli ether
      };
      const result = await signClient.request({
        topic: sessions.topic,
        request:{
          method: "eth_sendTransaction",
          params:  [tx]
        },
        chainId: "eip155:80001"
      })
      console.log("send Tx result", result);
      setTxHash(result)
    } catch (error) {
      console.log(error)
    }
  }
  
  const reset = () => {
    setAccounts([]);
    setSessions([]);
  };

  useEffect(() => {
    if (!signClient){
      createClient();
    }
  },[signClient]);
  return (
    <div className="App">
      <h1>Youtube tuto</h1>
      { accounts.length ? 
        (<>
          <p>{accounts}</p>
          <button onClick={handleDisconnect}>Disconnect</button>
          <button onClick={handleSend}>SendTx</button>
          {txHash && <p>View Tx -
            <a href={`https://mumbai.polygonscan.com/tx/${txHash}`} 
            target="_blank" rel="noreferrer">here</a>
            !</p>}
        </>
        )
        : (
            <button onClick={handleConnect} disabled={!signClient}>
            Connect
            </button>
          )
      }
    </div>
  );
}

export default App;
