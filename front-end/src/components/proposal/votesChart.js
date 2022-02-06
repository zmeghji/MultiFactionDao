import React, { PureComponent } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function VotesChart(props) {
    const factionsFor = () => {
        return props.votes.reduce(
            (numberFor, tokenVotes) => {
                if (tokenVotes.for > tokenVotes.against) {
                    return numberFor + 1;
                }
                else {
                    return numberFor;
                }
            }, 0
        )
    }

    const forFactionsClass = factionsFor()>=2 ? 'card-title text-success': 'card-title text-danger';
    
    return (
        <>
            <div className='row'>
                <div className='col-6'>
                    <div className="card" >
                        <div className="card-body">
                            <h5 className="card-title">Factions Voting For</h5>
                            <h5 className={forFactionsClass}>{factionsFor()}</h5>
                        </div>
                    </div>
                </div>
                <div className='col-6'>
                    <div className="card" >
                        <div className="card-body">
                            <h5 className="card-title">Required Factions Voting For</h5>
                            <h5 className="card-title text-info">2</h5>
                        </div>
                    </div>
                </div>
            </div>
            <ResponsiveContainer width="65%" height="60%" debounce={1}>
                <BarChart
                    data={props.votes }
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend align="center" verticalAlign='bottom'/>
                    <Bar dataKey="for" fill="#82ca9d" />
                    <Bar dataKey="against" fill="#d52727" />
                </BarChart>
            </ResponsiveContainer>
        </>
    )
}