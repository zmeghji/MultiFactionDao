import React, { useState, useEffect } from 'react'
import Modal from "react-bootstrap/Modal";
import {getFaction} from "../modules/helpers";
export default function Balance(props) {

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
                        <tr key={i}>
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
                        <div className="spinner-border text-primary" role="status">
                            <span className="sr-only"></span>
                        </div>
                    </Modal.Body>
                </Modal>
                

            </tbody>
        </table>
    )
}
