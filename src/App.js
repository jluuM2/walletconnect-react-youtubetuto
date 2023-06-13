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

  async function createClient(){

    try{
      const client = await SignClient.init({
        projectId: process.env.REACT_APP_PROJECT_ID
      })
      console.log('çlient', client);
      setSignClient(client);
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
          methods: ["eth_send_Transaction"],
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
      setAccounts(session.namespaces.eip155.accounts[0].slice(9));
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    if (!signClient){
      createClient();
    }
  },[signClient]);
  return (
    <div className="App">
      <h1>Youtube tuto</h1>
      { accounts.length ? 
        (<p>{accounts}</p>) :
          (<button onClick={handleConnect} disabled={!signClient}>
            Connect
          </button>)
      }
    </div>
  );
}

export default App;
