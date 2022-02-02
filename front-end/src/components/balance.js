import React, {useState, useEffect} from 'react'
import logo from '../logo.svg';

import styled from 'styled-components';
import { useOutletContext } from "react-router-dom";

export default function Balance(props){

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
                <tr>
                    <th scope="row">0</th>
                    <td>Cyber Ninjas</td>
                    <td></td>
                    <td></td>
                </tr>
            </tbody>
            </table>
    )
}
