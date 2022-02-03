import React, { Component } from 'react'
import logo from '../logo.svg';

import styled from 'styled-components';

export default function Instructions(props) {
    return (
        <>
            <ol>
                <li>Install the Metamask on your browser</li>
                <li>Switch to the Rinkeby network in Metamask</li>
                <li>Get some ether from the <a rel="noreferrer" href="https://faucets.chain.link/rinkeby" target="_blank">Chainlink Rinkeby faucet</a></li>
                <li>Log In</li>
                <li>Go to the balance page and get some tokens using the faucet buttons</li>
                <li>Go to the proposal page and create a proposal or vote on the existing proposal</li>
            </ol>
        </>
    )
}
