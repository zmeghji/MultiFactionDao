// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
Contract to set difficulty of a game.
@dev ownership should be transferred to a DAO after deployment.
 */
contract Game is Ownable{

    enum Difficulty{
        Easy,
        Medium,
        Hard
    }

    Difficulty public difficulty;

    constructor(Difficulty _difficulty){
        difficulty = _difficulty;
    }
    
    /**@dev sets difficulty of game. Only accessible by owner.*/
    function setDifficulty(Difficulty _difficulty) external onlyOwner{
        difficulty = _difficulty;
    }
}