import React, { Component } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components';

const Section = styled.section`
    font-size: 2rem;
    text-align: center;
    margin-bottom: 2rem;
    line-height: 3rem;
    display: inline-block;
`
const Button = styled.button`
    margin: 0 8px;
    width: 150px;

`

export default function LogIn(props){
    return (
        <>
            <Section>
            {props.getDefaultAccount() ?
                `Welcome ${props.getDefaultAccount()}`
                : ""
            }

            {props.getDefaultAccount() ===null && window.ethereum?  
                <Button 
                    className="btn btn-warning"
                    onClick={props.connectWalletHandler}>Log In</Button>
                :""
            }
                
            </Section>
        </>
    )
}