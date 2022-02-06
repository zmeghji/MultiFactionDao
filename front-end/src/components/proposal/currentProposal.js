import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import VotesChart from './votesChart';
import Modal from "react-bootstrap/Modal";

import { library } from '@fortawesome/fontawesome-svg-core'
import {
    faSync
} from '@fortawesome/free-solid-svg-icons'

library.add(
    faSync
)
export default function CurrentProposal(props) {
    return (
        <>
            <div className="card">
                <div className="card-header">
                    Current Proposal
                    <FontAwesomeIcon
                        onClick={props.refresh}
                        icon={["fa", "sync"]}
                        style={{ "color": "#18bc9c", "cursor": "pointer", "marginLeft": "1rem" }} />

                    {props.refreshing ?
                        <div
                            className="spinner-grow text-success"
                            style={{ "marginLeft": "1rem" }}
                            role="status"></div>
                        : ""
                    }
                </div>
                <div className="card-body">
                    <h5 className="card-title">Status: {props.proposal.status}</h5>
                    {
                        props.proposal.status == "Pending" ?
                            <p className="card-text text-danger">{props.blocksLeftForVotingStart()} blocks until voting starts (approximately {props.blocksLeftForVotingStart() * 15} seconds)</p>
                            : ""
                    }
                    {
                        props.proposal.status == "Active" ?
                            <p className="card-text text-danger">{props.blocksLeftForVotingEnd()} blocks until voting ends (approximately {props.blocksLeftForVotingEnd() * 15} seconds)</p>
                            : ""
                    }
                    <p className="card-text">{props.proposal.description}</p>
                    {
                        props.proposal.hasVoted || props.proposal.status != "Active" ? "" :
                            <>
                                <button
                                    className="btn btn-success"
                                    onClick={() => props.vote(1)}>Vote For</button>
                                <button
                                    className="btn btn-danger"
                                    onClick={() => props.vote(0)}>Vote Against</button>
                            </>
                    }
                    {
                        props.proposal.hasVoted && props.proposal.status == "Active" ? <p className="text-info">Thank you for voting</p> : ""
                    }

                    {
                        props.proposal.status == "Succeeded" ?
                            <button
                                className="btn btn-warning"
                                onClick={props.queue}>Queue For Execution</button>

                            : ""
                    }
                    {
                        props.proposal.status == "Queued" ?
                            <button
                                className="btn btn-secondary"
                                onClick={props.execute}>Execute Proposal</button>

                            : ""
                    }
                    <VotesChart votes={props.proposal.votes} />

                </div>
            </div>
            <Modal show={props.waitingForVote}>
                <Modal.Header>Just a Moment...</Modal.Header>
                <Modal.Body>
                    We're casting your vote! This could take up to 30 seconds.
                    <div className="spinner-border text-primary" role="status">
                        <span className="sr-only"></span>
                    </div>
                </Modal.Body>
            </Modal>
            <Modal show={props.queuingProposal}>
                <Modal.Header>Just a Moment...</Modal.Header>
                <Modal.Body>
                    Queueing the proposal for execution. This could take up to 30 seconds.
                    <div className="spinner-border text-primary" role="status">
                        <span className="sr-only"></span>
                    </div>
                </Modal.Body>
            </Modal>
            <Modal show={props.executingProposal}>
                <Modal.Header>Just a Moment...</Modal.Header>
                <Modal.Body>
                    Executing the proposal. This could take up to 30 seconds.
                    <div className="spinner-border text-primary" role="status">
                        <span className="sr-only"></span>
                    </div>
                </Modal.Body>
            </Modal>
            <hr />
        </>

    );
}
