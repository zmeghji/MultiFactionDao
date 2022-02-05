import React, { useState, useEffect } from 'react'
import { ethers } from "ethers";
import gameAbi from '../../abis/Game.json';
import Modal from "react-bootstrap/Modal";

import CreateProposal from './createProposal.js';

import styled from 'styled-components';

// import '@fortawesome/fontawesome-free/js/all';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'



export default function Proposal(props) {
    const [difficulty, setDifficulty] = useState(0);
    const [description, setDescription] = useState(0);

    const [creatingProposal, setCreatingProposal] = useState(false);
    const [waitingForVote, setWaitingForVote] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

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
    useEffect(async function () {
        if (currentProposal === null && previousProposal ===null) {
            let proposalInfo = await Promise.all([
                props.governorContract.mostRecentProposalId(),
                props.governorContract.mostRecentProposalDescription()
            ]);


            let statusId = await getStatus(proposalInfo[0]);

            let hasVoted = await props.governorContract.hasVoted(proposalInfo[0], props.defaultAccount);
            if (isProposalInProgress(statusId)) {
                setCurrentProposal({
                    proposalId: proposalInfo[0],
                    description: proposalInfo[1],
                    status: getStatusName(statusId),
                    hasVoted: hasVoted
                })
            }
            else{
                setPreviousProposal({
                    proposalId: proposalInfo[0],
                    description: proposalInfo[1],
                    status: getStatusName(statusId),
                    hasVoted: hasVoted
                })
            }


        }

    })

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
            let fullDescription = `${description} Upon execution this proposal will change the game difficulty to ${difficulty}`;
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
                calldatas: calldatas,
                description: fullDescription,
                status: getStatusName(0)
            })
        }
        finally {
            setCreatingProposal(false);
        }
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
                                icon={["fas", "sync"]}
                                style={{"color": "#18bc9c", "cursor": "pointer", "marginLeft": "1rem"}} />
                            
                                { refreshing ?
                                <div 
                                    class="spinner-grow text-success"
                                    style={{"marginLeft": "1rem"}}
                                     role="status"></div>
                                     :""
                                }
                        </div>
                        <div className="card-body">
                            <h5 className="card-title">Status: {currentProposal.status}</h5>
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
                                currentProposal.hasVoted ? <p className="text-info">Thank you for voting</p> : ""
                            }
                        </div>
                    </div>
                    <Modal show={waitingForVote}>
                        <Modal.Header>Just a Moment...</Modal.Header>
                        <Modal.Body>
                            We're casting your vote!
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
