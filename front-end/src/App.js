import logo from './logo.svg';
import './App.css';
import React, {useState, useEffect} from 'react'
import { ethers } from "ethers";
import Header from './components/header'
import LogIn from './components/login'
import SideBar from './components/sideBar'
import { Outlet, Link } from "react-router-dom";

import 'bootswatch/dist/flatly/bootstrap.min.css'

function App() {
  // const [userAddress, setUserAddress] = useState("");
  const [provider, setProvider] = useState(null);
	const [signer, setSigner] = useState(null);
  const [defaultAccount, setDefaultAccount] = useState(null);

  const getDefaultAccount = () =>{
    return defaultAccount;
  }
  const connectWalletHandler = () => {
			window.ethereum.request({ method: 'eth_requestAccounts'})
			.then(result => {
				accountChangedHandler(result[0]);
			})
	}

  const accountChangedHandler = (newAccount) => {
		setDefaultAccount(newAccount);
		updateEthers();
	}
  
  const updateEthers = () => {
		let tempProvider = new ethers.providers.Web3Provider(window.ethereum);
		setProvider(tempProvider);

		let tempSigner = tempProvider.getSigner();
		setSigner(tempSigner);

	}

  // listen for account changes
	window.ethereum.on('accountsChanged', accountChangedHandler);

  return (
    <div className="App container-fluid">

      <div className="row">
        <Header />
      </div>
      <div className="row">
        <div className='col-md-3' style={{"padding-left": 0}}>
          <SideBar />
        </div>
          <div className='col-md-8'>
            <LogIn 
              connectWalletHandler={connectWalletHandler}
              getDefaultAccount={getDefaultAccount}/>

              <div className="row">
                <Outlet />
              </div>
          </div>
      </div>

    </div>
  );
}

export default App;
