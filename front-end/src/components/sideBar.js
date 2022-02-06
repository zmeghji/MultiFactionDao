import React, { Component } from 'react'
import logo from '../logo.svg';
import styled from 'styled-components';

const Div = styled.section`
    padding-left: 0px;
    @media only screen and (min-width: 755px) {
        min-height:100%;
        height:80vh;
    }
`


export default function SideBar(props) {
    return (
        <Div className="d-flex flex-column flex-shrink-0 p-3 text-white bg-dark" >
            <a href="/" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
                <span className="fs-4">Menu</span>
            </a>
            <hr />
            <ul className="nav nav-pills flex-column mb-auto">
                <li className="nav-item">
                    <a href="#" className="nav-link text-white" onClick={() => props.setPage("Instructions")}>
                        Instructions
                    </a>
                </li>
                {props.defaultAccount != null ?
                    <>
                        <li>
                            <a href="#" className="nav-link text-white " onClick={() => props.setPage("Balance")}>
                                Balance
                            </a>
                        </li>
                        <li>
                            <a href="#" className="nav-link text-white" onClick={() => props.setPage("Proposal")}>
                                Proposal
                            </a>
                        </li>
                    </>
                    : ""}
            </ul>
            <hr />
        </Div>

    )
}
