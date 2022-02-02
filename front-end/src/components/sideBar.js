import React, { Component } from 'react'
import logo from '../logo.svg';
import styled from 'styled-components';
import {Link ,NavLink} from "react-router-dom";
import Instructions from './instructions'
import Balance from './balance'

const Div = styled.section`
    padding-left: 0px;
    @media only screen and (min-width: 755px) {
        min-height:80vh;
    }
`


export default function SideBar(props){
    return (
        <Div className="d-flex flex-column flex-shrink-0 p-3 text-white bg-dark" >
            <a href="/" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
                <span className="fs-4">Menu</span>
            </a>
            <hr />
            <ul className="nav nav-pills flex-column mb-auto">
                <li className="nav-item">
                    <NavLink 
                        className="nav-link" 
                        aria-current="page" 
                        to="/instructions">Instructions</NavLink>
                </li>
                <li>
                    {/* <a href="#" className="nav-link text-white">
                        Balance
                    </a> */}
                    <NavLink 
                        className="nav-link" 
                        aria-current="page" 
                        to="/balance">Balance</NavLink>
                </li>
                <li>
                    <a href="#" className="nav-link text-white">
                        Proposals
                    </a>
                </li>
            </ul>
            <hr />
        </Div>

    )
}
