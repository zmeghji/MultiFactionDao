// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ERC1155.sol";
import "./ERC1155Supply.sol";
import "./ERC1155Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
@dev contract for an ERC1155 token used for voting in a game with multiple factions. Each faction gets one vote. 
@dev Faction vote is decided by how owners of the faction token type vote 
 */
//Ownership can be transferred later to a DAO restrict access for minting new token types
contract FactionVotes is Ownable, ERC1155,ERC1155Supply,ERC1155Votes {
    
    constructor()
        ERC1155("")
    {}

    //@dev mint function, only available to owner of contract
    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public virtual onlyOwner{
        _mint(to, id, amount, data);
    }

    //@dev publicly available function to request tokens (used for easy demo from front-end)
    function faucet(uint256 id) external{
        _mint(msg.sender, id, 10, "");
    }


    function _afterTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155, ERC1155Votes) {
        super._afterTokenTransfer(operator, from, to, ids, amounts, data);
    }

    //@dev see {ERC1155Supply-_beforeTokenTransfer}
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override(ERC1155, ERC1155Supply) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    //@dev see {ERC1155Votes-_mint}
    function _mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal override(ERC1155, ERC1155Votes) {
        super._mint(to, id, amount, data);
    }

    //@dev see {ERC1155Votes-_burn}
    function _burn(
        address from,
        uint256 id,
        uint256 amount
    ) internal override(ERC1155, ERC1155Votes){
        super._burn(from, id ,amount);
    }

}