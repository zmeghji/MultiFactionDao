// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
Contract to set difficulty of a game.
@dev ownership should be transferred to a DAO after deployment.
 */
contract Game is Ownable{

    /**@dev difficulty can range from 0 to 9. 0 is least difficult and 9 is most difficult */
    uint256 public difficulty;
    
    constructor(uint256 _difficulty){
        _ensureValidDifficulty(_difficulty);
        difficulty = _difficulty;
    }
    
    /**@dev sets difficulty of game. Only accessible by owner.*/
    function setDifficulty(uint256 _difficulty) external onlyOwner{
        _ensureValidDifficulty(_difficulty);
        difficulty = _difficulty;
    }

    function _ensureValidDifficulty(uint256 _difficulty) private pure {
        require(_difficulty <= 9, "Difficulty must be between 0 and 9");
    }
}