import React, { useState, useEffect, PureComponent } from 'react'
import { ethers, BigNumber } from "ethers";
import gameAbi from '../../abis/Game.json';

import CreateProposal from './createProposal.js';
import PreviousProposal from './previousProposal.js';
import CurrentProposal from './currentProposal.js';

import {getFaction, getStatusName} from "../../modules/helpers";

export default function Proposal(props) {
    const [difficulty, setDifficulty] = useState(0);
    const [description, setDescription] = useState("");

    const [currentBlock, setCurrentBlock] = useState(0);

    const [creatingProposal, setCreatingProposal] = useState(false);
    const [waitingForVote, setWaitingForVote] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [queuingProposal, setQueuingProposal] = useState(false);
    const [executingProposal, setExecutingProposal] = useState(false);

    const [previousProposal, setPreviousProposal] = useState(null);

    const [currentProposal, setCurrentProposal] = useState(null);

    const [pageLoading, setPageLoading] = useState(true);

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

    const refreshCurrentBlock = async () => {
        setCurrentBlock(await props.provider.getBlockNumber());
    }

    const getVotes = async (proposalId) => {
        return mapVotes(await props.governorContract.proposalVotes(proposalId));
    }
    const createEmptyVoteSet = () =>{
        //todo change hard-coded 3 to nextTokenId
        return [...Array(3).keys()].map( tokenId => {
            return {
                for: 0,
                against:0,
                name :getFaction(tokenId)
            }
        })
    }
    useEffect(async function () {
        if (currentProposal === null && previousProposal === null) {
            await refreshCurrentBlock();
            let proposalInfo = await Promise.all([
                props.governorContract.mostRecentProposalId(),
                props.governorContract.mostRecentProposalDescription(),
                props.governorContract.mostRecentProposalCalldatas(0),
            ]);

            let proposalId = proposalInfo[0];
            let statusId = await getStatus(proposalId);
            let hasVoted = await props.governorContract.hasVoted(proposalId, props.defaultAccount);

            // let votes = await getVotes(proposalId);

            let proposal = {
                proposalId: proposalId,
                description: proposalInfo[1],
                status: getStatusName(statusId),
                hasVoted: hasVoted,
                calldata: proposalInfo[2]
            };

            proposal.voteStart = await getVotingStart(proposalId);
            proposal.voteEnd = await getVotingEnd(proposalId);
            proposal.votes = await getVotes(proposalId)
            if (isProposalInProgress(statusId)) {
                setCurrentProposal(proposal)
            }
            else {
                setPreviousProposal(proposal)
            }
        }
        if (pageLoading){
            setPageLoading(false);
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
            await refreshCurrentBlock();
            setCurrentProposal({
                targets: targets,
                values: values,
                calldata: calldatas,
                description: fullDescription,
                status: getStatusName(0),
                voteStart: await getVotingStart(proposalId),
                voteEnd: await getVotingEnd(proposalId),
                proposalId: proposalId,
                votes: createEmptyVoteSet()
            })
        }
        finally {
            setCreatingProposal(false);
        }
    }

    const hashProposal = (targets, values, calldatas, description) => {
        let hashedDescription = ethers.utils.id(description);
        let encoded = ethers.utils.defaultAbiCoder.encode(
            ["address[]", "uint256[]", "bytes[]", "bytes32"],
            [targets, values, calldatas, hashedDescription])
        let hash = ethers.utils.keccak256(encoded);
        return BigNumber.from(hash);
    }

    const vote = async (direction) => {
        try {
            setWaitingForVote(true);
            let tx = await props.governorContract.castVote(currentProposal.proposalId, direction);
            await tx.wait()

            let tmpProposal = currentProposal;
            tmpProposal.hasVoted = true;
            
            tmpProposal.votes= tmpProposal.votes.map( (tokenVote, tokenId) => {
                if (direction ==1){
                    tokenVote.for += props.tokenBalance[tokenId];
                }
                else{
                    tokenVote.against += props.tokenBalance[tokenId];
                }
                return tokenVote;
            })
            
            setCurrentProposal(tmpProposal);
        }
        finally {
            setWaitingForVote(false);
        }

    }

    const getStatus = async (proposalId) => {
        return await props.governorContract.state(proposalId);
    }

    const mapVotes = (proposalVotes) =>{
        return proposalVotes.map((tokenVotes, tokenId) =>{

            return {
                name: getFaction(tokenId),
                against: tokenVotes["againstVotes"].toNumber(),
                for: tokenVotes["forVotes"].toNumber()
            }
        })
    };
    const refresh = async () => {
        console.log("refreshing")
        await refreshCurrentBlock();
        setRefreshing(true);

        let statusId = await getStatus(currentProposal.proposalId);

        let tmpCurrentProposal = currentProposal;
        tmpCurrentProposal.status = getStatusName(statusId);
        tmpCurrentProposal.votes = await getVotes(currentProposal.proposalId);
        if (!isProposalInProgress(statusId)) {
            setPreviousProposal(tmpCurrentProposal);
            setCurrentProposal(null);
        }
        else {
            setCurrentProposal(tmpCurrentProposal);
        }


        setRefreshing(false);
    }

    const queue = async () => {
        try {
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
        finally {
            setQueuingProposal(false);
        }
    }

    const execute = async () => {
        try {
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
        finally {
            setExecutingProposal(false);
        }
    }

    const blocksLeftForVotingStart = () => {
        return currentProposal.voteStart - currentBlock + 1;
    }

    const blocksLeftForVotingEnd = () => {
        return currentProposal.voteEnd - currentBlock + 1;
    }

    return (
        <>
        {
            pageLoading ? 
            <div class="d-flex justify-content-center">
                <div class="spinner-border" role="status">
                    <span class="sr-only"></span>
                </div>
            </div>
            : ""
        }
            {
                currentProposal == null && !pageLoading ? 
                <CreateProposal
                    currentGameDifficulty={props.currentGameDifficulty}
                    handleDifficultyChange={handleDifficultyChange}
                    handleDescriptionChange={handleDescriptionChange}
                    createProposal={createProposal}
                    creatingProposal={creatingProposal}
                />
                : ""
            }
            {previousProposal != null && currentProposal == null && !pageLoading?
                <PreviousProposal 
                    proposal={previousProposal}/>
                : ""}
            {currentProposal != null && !pageLoading?
                < CurrentProposal
                    proposal={currentProposal}
                    refresh={refresh}
                    refreshing={refreshing}
                    blocksLeftForVotingStart={blocksLeftForVotingStart}
                    blocksLeftForVotingEnd={blocksLeftForVotingEnd}
                    vote={vote}
                    queue={queue}
                    execute={execute}
                    waitingForVote={waitingForVote}
                    queuingProposal={queuingProposal}
                    executingProposal={executingProposal}
                     />
                :""
                
            }

            
        </>


    )
}
