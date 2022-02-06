import React from 'react';
import VotesChart from './votesChart';

export default function PreviousProposal(props) {
    return (
        <>
            <div className="card">
                <div className="card-header">
                    Previous Proposal
                </div>
                <div className="card-body">
                    <h5 className="card-title">Status: {props.proposal.status}</h5>
                    <p className="card-text">{props.proposal.description}</p>

                    <VotesChart votes={props.proposal.votes} />

                </div>
            </div>
            <hr className="mt-3" />
        </>

    );
}
