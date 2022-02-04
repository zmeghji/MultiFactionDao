import React, { useState, useEffect } from 'react'
import { ethers } from "ethers";
import gameAbi from '../../abis/Game.json';
import Modal from "react-bootstrap/Modal";

import CreateProposal from './createProposal.js';



export default function Proposal(props) {
    const [difficulty, setDifficulty] = useState(0);
    const [description, setDescription] = useState(0);
    const [creatingProposal, setCreatingProposal] = useState(false);

    const [currentProposal, setCurrentProposal] = useState(null);

    const getStatus = (statusId) =>{
        if (statusId = 0){
            return "Pending";
        }
        else if (statusId = 1){
            return "Active";
        }
        else if (statusId = 2){
            return "Canceled";
        }
        else if (statusId = 3){
            return "Defeated";
        }
        else if (statusId = 4){
            return "Succeeded";
        }
        else if (statusId = 5){
            return "Queued";
        }
        else if (statusId = 6){
            return "Expired";
        }
        else if (statusId = 7){
            return "Executed";
        }
        else{
            throw "Unknown status Id"
        }
    }
    useEffect(async function(){
        if(currentProposal ===null ){
            let proposalInfo = await Promise.all([
                props.governorContract.mostRecentProposalId(),
                props.governorContract.mostRecentProposalDescription()
            ]);
            

            let statusId = props.governorContract.state(proposalInfo[0]);


            let hasVoted = props.governorContract.hasVoted(proposalInfo[0], props.defaultAccount);

            setCurrentProposal({
                proposalId: proposalInfo[0],
                description: proposalInfo[1],
                status: getStatus(statusId),
                hasVoted: hasVoted
            })


        }
    
      })
    
    const getMostRecentProposal = async ()=>{

    }


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
                description: fullDescription
            })
        }
        finally {
            setCreatingProposal(false);
        }
    }

    const vote = async (direction) => {

    }
    return (
        <>
            {currentProposal != null ? 
            
            <div className="card">
                <div className="card-header">
                    Current Proposal
                </div>
                <div className="card-body">
                    <h5 class="card-title">Status: {currentProposal.status}</h5>
                    <p className="card-text">{currentProposal.description}</p>
                    {
                        currentProposal.hasVoted ? "":
                        <>
                            <button className="btn btn-success">Vote For</button>
                            <button className="btn btn-danger">Vote Against</button>
                        </>
                    }
                    {/* <a href="#" class="btn btn-primary">Go somewhere</a> */}
                </div>
            </div> 
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
