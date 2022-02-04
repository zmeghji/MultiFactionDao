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

    return (
        <>
            {currentProposal != null ? 
            
            <div class="card">
                <div class="card-header">
                    Current Proposal
                </div>
                <div class="card-body">
                    {/* <h5 class="card-title">Status goes here</h5> */}
                    <p class="card-text">{currentProposal.description}</p>
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
