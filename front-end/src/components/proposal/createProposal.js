import React, { useState, useEffect } from 'react'
import { ethers } from "ethers";
import gameAbi from '../../abis/Game.json';
import Modal from "react-bootstrap/Modal";





export default function CreateProposal(props) {
    
    return (
        <>
            <form>
                <div className="form-group">
                    <label htmlFor="currentDifficulty">Current Game Difficulty</label>
                    <select className="form-control" id="currentDifficulty" disabled>
                        <option  >{props.currentGameDifficulty}</option>
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="newDifficulty">New Game Difficulty</label>
                    <select className="form-control" id="newDifficulty" onChange={props.handleDifficultyChange}>
                        <option>0</option>
                        <option>1</option>
                        <option>2</option>
                        <option>3</option>
                        <option>4</option>
                        <option>5</option>
                        <option>6</option>
                        <option>7</option>
                        <option>8</option>
                        <option>9</option>
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="proposalDescription">Unique Description of Proposal</label>
                    <textarea
                        className="form-control"
                        id="proposalDescription"
                        rows="3"
                        onChange={props.handleDescriptionChange}></textarea>
                </div>
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={props.createProposal}>Submit Proposal</button>
            </form>


            <Modal show={props.creatingProposal}>
                <Modal.Header>Just a Moment...</Modal.Header>
                <Modal.Body>
                    We're creating your proposal. This could take up to 30 seconds.
                    <div class="spinner-border text-primary" role="status">
                        <span class="sr-only"></span>
                    </div>
                </Modal.Body>
            </Modal>
        </>


    )
}