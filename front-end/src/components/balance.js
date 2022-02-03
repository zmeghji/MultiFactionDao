import React, { useState, useEffect } from 'react'
import logo from '../logo.svg';

import styled from 'styled-components';
import { useOutletContext } from "react-router-dom";

import Modal from "react-bootstrap/Modal";

export default function Balance(props) {
    const getFaction = (tokenId) => {
        if (tokenId == 0)
            return "Cyber Ninjas";
        else if (tokenId == 1)
            return "Crypto Samurais"
        else if (tokenId == 2)
            return "Meta Shoguns"
        else
            throw "Unknown TokenId"
    }



    return (
        <table className="table table-dark">
            <thead>
                <tr>
                    <th scope="col">Token Id</th>
                    <th scope="col">Faction</th>
                    <th scope="col">Balance</th>
                    <th scope="col"></th>
                </tr>
            </thead>
            <tbody>
                {
                    props.tokenBalance.map((b, i) =>
                        <tr>
                            <th>{i}</th>
                            <td>{getFaction(i)}</td>
                            <td>{b}</td>
                            <td>
                                <button
                                    className="btn btn-success"
                                    onClick={() => props.getMoreTokens(i)}>Get More!</button>
                            </td>
                        </tr>
                    )
                }
                <Modal show={props.tokensPending}>
                    <Modal.Header>Just a Moment...</Modal.Header>
                    <Modal.Body>
                        We're getting the tokens for you! This could take up to 30 seconds.
                        <div class="spinner-border text-primary" role="status">
                            <span class="sr-only"></span>
                        </div>
                    </Modal.Body>
                </Modal>
                

            </tbody>
        </table>
    )
}
