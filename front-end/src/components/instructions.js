import React, { Component } from 'react'
import logo from '../logo.svg';

import styled from 'styled-components';

export default function Instructions(props) {
    return (
        <ol>
            <li>Install Metamask</li>
            <li>Switch to the Rinkeby network in Metamask</li>
            <li>Get some ether from the <a rel="noreferrer" href="https://faucets.chain.link/rinkeby" target="_blank">Chainlink Rinkeby faucet</a></li>
            <li>Log In</li>
        </ol>
    )
}
