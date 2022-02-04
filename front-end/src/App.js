import logo from './logo.svg';
import './App.css';
import React, {useState, useEffect} from 'react'
import { ethers } from "ethers";
import Header from './components/header'
import LogIn from './components/login'
import SideBar from './components/sideBar'
import { Outlet, Link } from "react-router-dom";

import 'bootswatch/dist/flatly/bootstrap.min.css'

//abis
import tokenAbi from './abis/FactionVotes.json';
import gameAbi from './abis/Game.json';
import governorAbi from './abis/Governor.json';



//components
import Instructions from './components/instructions.js';
import Balance from './components/balance.js';
import Proposal from './components/proposal/proposal.js';


function App() {
  let tokenAddress = '0xC432Caa8251514802B1c42d7307bc722D8fA6d1b';
  let gameAddress = '0x06f493Ec1968Ee91c5E0804fB3C3964B62164960';
  let governorAddress = '0x77512fC0A46ee70651D12D680f53a1095e85A0cE';


  const [provider, setProvider] = useState(null);
	const [signer, setSigner] = useState(null);
  const [defaultAccount, setDefaultAccount] = useState(null);

  const [tokenContract, setTokenContract] = useState(null);
  const [tokenBalance, setTokenBalance] = useState(null);
  const [tokensPending, setTokensPending] = useState(false);

  const [gameContract, setGameContract] = useState(null);
  const [currentGameDifficulty, setCurrentGameDifficulty] = useState(null);

  const [governorContract, setGovernorContract] = useState(null);


  const [page, setPage]= useState("Instructions");

  useEffect(async function(){
    if(tokenBalance ===null && tokenContract !== null){
      await getTokenBalance();
    }
    if(currentGameDifficulty ===null && gameContract !== null){
      await getGameDifficulty();
    }

  })


  const getDefaultAccount = () =>{
    return defaultAccount;
  }
  const connectWalletHandler = () => {
			window.ethereum.request({ method: 'eth_requestAccounts'})
			.then(result => {
				accountChangedHandler(result[0]);
			})
	}

  const getMoreTokens = async (tokenId) =>{
    setTokensPending(true);
    try{
      let tx  = await tokenContract.faucet(tokenId);
      await tx.wait()
      let tokenBalanceCopy = [...tokenBalance];
      tokenBalanceCopy[tokenId]+= 10;
      setTokenBalance(tokenBalanceCopy);
    }
    finally{
      setTokensPending(false);
    }
  }
  const getTokenBalance = async () => {
    let nextTokenId = (await tokenContract.nextTokenId()).toNumber();
    console.log(`next Token Id is ${nextTokenId}`);
    let promises = [...Array(nextTokenId).keys()].map( tokenId => tokenContract.balanceOf(defaultAccount,tokenId))
    let balances = await Promise.all(promises);
    balances = balances.map(b => b.toNumber());
    console.log(balances);
    setTokenBalance(balances)
  }

  const getGameDifficulty = async () =>{
    let difficultyTemp =(await gameContract.difficulty()).toNumber();
    console.log(`difficulty: ${difficultyTemp}`);
    setCurrentGameDifficulty(difficultyTemp);

  }

  const accountChangedHandler = async (newAccount) => {
		setDefaultAccount(newAccount);
		await updateEthers();
	}
  
  const updateEthers = async () => {
		let tempProvider = new ethers.providers.Web3Provider(window.ethereum);
		setProvider(tempProvider);

		let tempSigner = tempProvider.getSigner();
		setSigner(tempSigner);

    let tempTokenContract = new ethers.Contract(tokenAddress, tokenAbi, tempSigner);
		setTokenContract(tempTokenContract);

    let tempGameContract = new ethers.Contract(gameAddress, gameAbi, tempSigner);
    setGameContract(tempGameContract);
    
    let tempGovernorContract = new ethers.Contract(governorAddress, governorAbi, tempSigner);
    setGovernorContract(tempGovernorContract);
	}

  // listen for account changes
	window.ethereum.on('accountsChanged', accountChangedHandler);

  return (
    <div className="App container-fluid">

      <div className="row">
        <Header />
      </div>
      <div className="row">
        <div className='col-md-3' style={{"paddingLeft": 0}}>
          <SideBar 
            setPage={setPage}
            defaultAccount={defaultAccount} />
        </div>
          <div className='col-md-8'>
            <LogIn 
              connectWalletHandler={connectWalletHandler}
              getDefaultAccount={getDefaultAccount}/>

              <div className="row">
                {page == "Instructions"? <Instructions />:""}
                {page == "Balance"? 
                  <Balance 
                    tokenBalance={tokenBalance}
                    getMoreTokens={getMoreTokens}
                    tokensPending={tokensPending} /> : ""}
                {page == "Proposal"? 
                  <Proposal 
                    currentGameDifficulty={currentGameDifficulty}
                    governorContract={governorContract}
                    gameAddress={gameAddress}
                    />:""}
                  


              </div>
          </div>
      </div>

    </div>
  );
}

export default App;
