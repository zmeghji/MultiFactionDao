import React, {useState, useEffect} from 'react'




export default function Proposal(props) {
    const [difficulty, setDifficulty] = useState(0);
    const [description, setDescription] = useState(0);

    const handleDifficultyChange = (event)=>{
        setDifficulty(event.target.value);
    }

    const handleDescriptionChange = (event)=>{
        setDescription(event.target.value);
    }

    return (
        <form>
            <div className="form-group">
                <label htmlFor="currentDifficulty">Current Game Difficulty</label>
                <select className="form-control" id="currentDifficulty" disabled>
                    <option  >{props.currentGameDifficulty}</option>
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="newDifficulty">New Game Difficulty</label>
                <select className="form-control" id="newDifficulty" onChange={handleDifficultyChange}>
                    <option>0</option>
                    <option>1</option>
                    <option>2</option>
                    <option>3</option>
                    <option>4</option>
                    <option>5</option>
                    <option>6</option>
                    <option>7</option>
                    <option>8</option>
                    <option>9</option>
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="proposalDescription">Reason for change</label>
                <textarea 
                    className="form-control" 
                    id="proposalDescription" 
                    rows="3" 
                    onChange={handleDescriptionChange}></textarea>
            </div>
            <button className="btn btn-primary">Submit Proposal</button>
        </form>
    )
}
