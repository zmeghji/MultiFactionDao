import React, { PureComponent } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function VotesChart(props) {
    return (
        <ResponsiveContainer width="70%" height="60%">
            <BarChart
                width={500}
                height={300}
                data={props.votes}
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
                <Legend />
                <Bar dataKey="for" fill="#8884d8" />
                <Bar dataKey="against" fill="#82ca9d" />
            </BarChart>
        </ResponsiveContainer>
    )
}