import React, { useState, useEffect } from 'react'
import { ethers,BigNumber } from "ethers";
import gameAbi from '../../abis/Game.json';
import Modal from "react-bootstrap/Modal";

import CreateProposal from './createProposal.js';


import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faSync
} from '@fortawesome/free-solid-svg-icons'

library.add(
    faSync
)




export default function Proposal(props) {
    const [difficulty, setDifficulty] = useState(0);
    const [description, setDescription] = useState(0);

    const [currentBlock, setCurrentBlock] = useState(0);


    const [creatingProposal, setCreatingProposal] = useState(false);
    const [waitingForVote, setWaitingForVote] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [queuingProposal, setQueuingProposal] = useState(false);
    const [executingProposal, setExecutingProposal] = useState(false);

    const [previousProposal, setPreviousProposal] = useState(null);

    const [currentProposal, setCurrentProposal] = useState(null);
    const isProposalInProgress = (statusId) => {
        switch (statusId) {
            case 0:
            case 1:
            case 4:
            case 5:
                return true;
            default:
                return false;
        }
    }
    const getStatusName = (statusId) => {
        if (statusId == 0) {
            return "Pending";
        }
        else if (statusId == 1) {
            return "Active";
        }
        else if (statusId == 2) {
            return "Canceled";
        }
        else if (statusId == 3) {
            return "Defeated";
        }
        else if (statusId == 4) {
            return "Succeeded";
        }
        else if (statusId == 5) {
            return "Queued";
        }
        else if (statusId == 6) {
            return "Expired";
        }
        else if (statusId == 7) {
            return "Executed";
        }
        else {
            throw "Unknown status Id"
        }
    }
    const refreshCurrentBlock = async () =>{
        setCurrentBlock (await props.provider.getBlockNumber());
    }
    useEffect(async function () {
        if (currentProposal === null && previousProposal ===null) {
            await refreshCurrentBlock();
            let proposalInfo = await Promise.all([
                props.governorContract.mostRecentProposalId(),
                props.governorContract.mostRecentProposalDescription(),
                props.governorContract.mostRecentProposalCalldatas(0),
            ]);

            let proposalId = proposalInfo[0];
            let statusId = await getStatus(proposalId);
            let hasVoted = await props.governorContract.hasVoted(proposalId, props.defaultAccount);

            let proposal = {
                proposalId: proposalId,
                description: proposalInfo[1],
                status: getStatusName(statusId),
                hasVoted: hasVoted,
                calldata: proposalInfo[2]
            };

            proposal.voteStart = await getVotingStart(proposalId);
            proposal.voteEnd = await getVotingEnd(proposalId);

            if (isProposalInProgress(statusId)) {
                setCurrentProposal(proposal)
            }
            else{
                setPreviousProposal(proposal)
            }


        }

    })

    const getVotingEnd = async (proposalId) =>
        (await props.governorContract.proposalDeadline(proposalId)).toNumber();
    const getVotingStart = async (proposalId) =>
        (await props.governorContract.proposalSnapshot(proposalId)).toNumber();
    const handleDifficultyChange = (event) => {
        setDifficulty(event.target.value);
    }

    const handleDescriptionChange = (event) => {
        setDescription(event.target.value);
    }
    const createProposal = async () => {
        setCreatingProposal(true);
        try {
            let gameInterface = new ethers.utils.Interface(gameAbi);
            let encodedFunction = gameInterface.encodeFunctionData(
                "setDifficulty", [difficulty]
            );

            let targets = [props.gameAddress];
            let values = [0];
            let calldatas = [encodedFunction];
            let fullDescription = `${description} Upon execution, this proposal will change the game difficulty to ${difficulty}`;

            let proposalId = hashProposal(
                targets, values, calldatas, fullDescription)
            let tx = await props.governorContract.propose(
                targets,
                values,
                calldatas,
                fullDescription
            )
            await tx.wait()
            setCurrentProposal({
                targets: targets,
                values: values,
                calldata: calldatas,
                description: fullDescription,
                status: getStatusName(0),
                voteStart: await getVotingStart(proposalId),
                voteEnd: await getVotingEnd(proposalId),
                proposalId: proposalId
            })
        }
        finally {
            setCreatingProposal(false);
        }
    }

    const hashProposal =  (targets, values, calldatas, description) =>{
        let hashedDescription =ethers.utils.id(description);
        let encoded = ethers.utils.defaultAbiCoder.encode(
            [ "address[]", "uint256[]", "bytes[]","bytes32" ], 
            [ targets, values, calldatas, hashedDescription ])
        let hash = ethers.utils.keccak256(encoded); 
        return BigNumber.from(hash);
    }

    const vote = async (direction) => {
        //TODO implement case where we don't currently have the proposal id, either by doing client side hash or calling hash proposal
        try{
            setWaitingForVote(true);
            let tx = await props.governorContract.castVote(currentProposal.proposalId, direction);
            await tx.wait()

            let tmpProposal = currentProposal;
            tmpProposal.hasVoted = true;
            setCurrentProposal(tmpProposal);
        }
        finally{
            setWaitingForVote(false);
        }

    }

    const getStatus = async (proposalId) =>{
        return await props.governorContract.state(proposalId);
    }
    const refresh = async () =>{
        console.log("refreshing")
        await refreshCurrentBlock();
        //TODO handle case where proposal id is not stored
        setRefreshing(true);
        let statusId = await  getStatus(currentProposal.proposalId);

        let tmpCurrentProposal = currentProposal;
        tmpCurrentProposal.status = getStatusName(statusId) ;
        if (!isProposalInProgress(statusId)){
            setPreviousProposal(tmpCurrentProposal);
            setCurrentProposal(null);
        }
        else{
            setCurrentProposal(tmpCurrentProposal);
        }


        setRefreshing(false);
    }

    const queue = async () =>{
        try{
            setQueuingProposal(true);
            let tx = await props.governorContract.queue(
                [props.gameAddress],
                [0],
                [currentProposal.calldata],
                ethers.utils.id(currentProposal.description)
            )
            await tx.wait();
            let tmpCurrentProposal = currentProposal;
            tmpCurrentProposal.status = "Queued"
            setCurrentProposal(tmpCurrentProposal);
        }
        finally{
            setQueuingProposal(false);
        }
    }

    const execute = async () =>{
        try{
            setExecutingProposal(true);
            let tx = await props.governorContract.execute(
                [props.gameAddress],
                [0],
                [currentProposal.calldata],
                ethers.utils.id(currentProposal.description)
            )
            await tx.wait();
            await props.refreshGameDifficulty();
            let tmpCurrentProposal = currentProposal;
            tmpCurrentProposal.status = "Executed"
            setPreviousProposal(tmpCurrentProposal);
            setCurrentProposal(null);
            
        }
        finally{
            setExecutingProposal(false);
        }
    }

    const blocksLeftForVotingStart = () =>{
        return  currentProposal.voteStart -currentBlock + 1;
    }

    const blocksLeftForVotingEnd = () =>{
        return currentProposal.voteEnd  -currentBlock  + 1;
    }

    return (
        <>
            {previousProposal != null && currentProposal== null ? 
            <>
                <div className="card">
                    <div className="card-header">
                        Previous Proposal
                    </div>
                    <div className="card-body">
                        <h5 className="card-title">Status: {previousProposal.status}</h5>
                        <p className="card-text">{previousProposal.description}</p>
                    </div>
                </div>
                <hr className="mt-3"/>
            </>
            : ""}
            {currentProposal != null ?
                <>
                    <div className="card">
                        <div className="card-header">
                            Current Proposal
                            <FontAwesomeIcon 
                                onClick={refresh} 
                                icon={["fa", "sync"]}
                                style={{"color": "#18bc9c", "cursor": "pointer", "marginLeft": "1rem"}} />
                            
                                { refreshing ?
                                <div 
                                    className="spinner-grow text-success"
                                    style={{"marginLeft": "1rem"}}
                                     role="status"></div>
                                     :""
                                }
                        </div>
                        <div className="card-body">
                            <h5 className="card-title">Status: {currentProposal.status}</h5>
                            {
                                currentProposal.status == "Pending"?
                                <p className="card-text text-danger">{blocksLeftForVotingStart()} blocks until voting starts (approximately {blocksLeftForVotingStart()*15} seconds)</p>
                                : ""
                            }
                            {
                                currentProposal.status == "Active"?
                                <p className="card-text text-danger">{blocksLeftForVotingEnd()} blocks until voting ends (approximately {blocksLeftForVotingEnd()*15} seconds)</p>
                                : ""
                            }
                            <p className="card-text">{currentProposal.description}</p>
                            {
                                currentProposal.hasVoted || currentProposal.status != "Active" ? "" :
                                    <>
                                        <button 
                                            className="btn btn-success"
                                            onClick={()=>vote(1)}>Vote For</button>
                                        <button 
                                            className="btn btn-danger"
                                            onClick={()=>vote(0)}>Vote Against</button>
                                    </>
                            }
                            {
                                currentProposal.hasVoted &&currentProposal.status == "Active"? <p className="text-info">Thank you for voting</p> : ""
                            }

                            {
                                currentProposal.status == "Succeeded"?
                                <button 
                                    className="btn btn-warning"
                                    onClick={queue}>Queue For Execution</button>
                                
                                :""
                            }
                            {
                                currentProposal.status == "Queued"?
                                <button 
                                    className="btn btn-secondary"
                                    onClick={execute}>Execute Proposal</button>
                                
                                :""
                            }
                        </div>
                    </div>
                    <Modal show={waitingForVote}>
                        <Modal.Header>Just a Moment...</Modal.Header>
                        <Modal.Body>
                            We're casting your vote! This could take up to 30 seconds.
                            <div className="spinner-border text-primary" role="status">
                                <span className="sr-only"></span>
                            </div>
                        </Modal.Body>
                    </Modal>
                    <Modal show={queuingProposal}>
                        <Modal.Header>Just a Moment...</Modal.Header>
                        <Modal.Body>
                            Queueing the proposal for execution. This could take up to 30 seconds.
                            <div className="spinner-border text-primary" role="status">
                                <span className="sr-only"></span>
                            </div>
                        </Modal.Body>
                    </Modal>
                    <Modal show={executingProposal}>
                        <Modal.Header>Just a Moment...</Modal.Header>
                        <Modal.Body>
                            Executing the proposal. This could take up to 30 seconds.
                            <div className="spinner-border text-primary" role="status">
                                <span className="sr-only"></span>
                            </div>
                        </Modal.Body>
                    </Modal>
                    <hr/>
                </>
                :
                <CreateProposal
                    currentGameDifficulty={props.currentGameDifficulty}
                    handleDifficultyChange={handleDifficultyChange}
                    handleDescriptionChange={handleDescriptionChange}
                    createProposal={createProposal}
                    creatingProposal={creatingProposal}
                />
            }
        </>


    )
}
