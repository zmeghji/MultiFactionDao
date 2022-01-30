// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";

//TODO consider implementing token delegation

/**
 @title ERC1155 Voting Template
 @author Zeeshan Meghji 
 @notice Inherit from this contract to implement ERC1155 tokens which can be used for voting in DAOs
 @dev The main functionality of this contract is maintaining checkpoints for whenever total supply of tokens or voting power of accounts change
 */
abstract contract ERC1155Votes is ERC1155Supply{
    /**
     * @dev Emitted when a token transfer results in changes to an account's voting power.
     */
    event VotesChanged(address indexed account, uint256 indexed tokenId, uint256 previousBalance, uint256 newBalance);

    struct Checkpoint {
        uint32 fromBlock;
        uint256 votes;
    }

    //Mapping from accounts to a mapping of checkpoints for each token Id
    mapping(address => mapping (uint => Checkpoint[])) private _checkpoints;

    //Mapping from token id to total supply checkpoints
    //TODO make this private again
    mapping(uint => Checkpoint[]) public _totalSupplyCheckpoints;

    //If a new token type is minted, it will use the value of nextTokenId as its id
     uint256 public nextTokenId;

    /**
     * @dev Gets the current votes balance or each token id for `account`
     */
    function getVotes(address account) public view returns (uint256[]memory ) {
        if (nextTokenId == 0 ){
            revert ("ERC1155Votes: no token ids have been minted");
        }
        uint256[]memory votes = new uint256[](nextTokenId);

        for (uint256 i = 0; i < nextTokenId; i++){
            uint numberOfCheckpoints = _checkpoints[account][i].length;
            if (numberOfCheckpoints == 0){
                votes[i] = 0;
            }
            else{
                votes[i] = _checkpoints[account][i][numberOfCheckpoints-1].votes;
            }
        }
        return votes;
    }

    /**
     * @dev Retrieve the number of votes for each token id for `account` at the end of `blockNumber`.
     *
     * Requirements:
     *
     * - `blockNumber` must have been already mined
     */
    function getPastVotes(address account, uint256 blockNumber) public view returns (uint256[] memory ) {
        require(blockNumber < block.number, "ERC1155Votes: block not yet mined");
        uint256[] memory votes = new uint256[](nextTokenId);
        for (uint256 i = 0; i < nextTokenId; i++){
            votes[i] = _checkpointsLookup(_checkpoints[account][i], blockNumber);
        }
        return votes;
    }

    /**
    @dev Gets the total supply of each token id (as an array) at the specified block number
     */
    function getPastTotalSupply(uint256 blockNumber) public view returns (uint256[] memory ) {
        require(blockNumber < block.number, "ERC1155Votes: block not yet mined");
        uint256[] memory supply = new uint256[](nextTokenId);

        for (uint256 i = 0; i < nextTokenId; i++){
            supply[i] = _checkpointsLookup(_totalSupplyCheckpoints[i], blockNumber);
        }

        return supply;
    }

    /**
    @dev overrides _mint to ensure that newly minted token ids are one plus the previously minted token id
     */
    function _mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    )internal virtual override{
        require(amount >0, "ERC1155Votes: must mint more than 0");
        require(totalSupply(id)==0 && id == nextTokenId, "ERC1155Votes: if minting new token id, it must equal nextTokenId");

        super._mint(to, id,amount, data);
        require(totalSupply(id) <= _maxSupply(), "ERC1155Votes: total supply risks overflowing votes");
        _writeCheckpoint(_totalSupplyCheckpoints[id], _add, amount);

        nextTokenId++;
    }

    //TODO implement override for _mintBatch so that necessary checks are done. It's not being used at the moment, but would be good to add.

     /**
     * @dev Snapshots the totalSupply after it has been decreased.
     */
    function _burn(address account, uint256 id, uint256 amount) internal virtual override {
        super._burn(account, id, amount);

        _writeCheckpoint(_totalSupplyCheckpoints[id], _subtract, amount);
    }
    /**
     * @dev Move voting power when tokens are transferred.
     *
     */
    function _afterTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override virtual {
        _moveVotingPower(from, to, ids, amounts);
    }

    
    /**
    @dev helper function used to either update an existing checkpoint or add a new one if the total supply changes or tokens are transferred
     */
    function _writeCheckpoint(
        Checkpoint[] storage ckpts,
        function(uint256, uint256) view returns (uint256) op,
        uint256 delta
    ) private returns (uint oldWeight, uint newWeight){
        uint256 pos = ckpts.length;
        oldWeight = pos == 0 ? 0 : ckpts[pos - 1].votes;
        newWeight = op(oldWeight, delta);

        if (pos > 0 && ckpts[pos - 1].fromBlock == block.number) {
            ckpts[pos - 1].votes = newWeight;
        } else {
            ckpts.push(Checkpoint({fromBlock: SafeCast.toUint32(block.number), votes: newWeight}));
        }
    }
    
    //@dev simple add function to be used as a parameter for _writeCheckpoint
    function _add(uint256 a, uint256 b) private pure returns (uint256) {
        return a + b;
    }

    //@dev simple subtract function to be used as a parameter for _writeCheckpoint
    function _subtract(uint256 a, uint256 b) private pure returns (uint256) {
        return a - b;
    }

    /**
     * @dev Maximum token supply for every token id. Defaults to `type(uint256).max` (2^256^ - 1).
     */
    function _maxSupply() internal view virtual returns (uint256) {
        return type(uint256).max;
    }

    // //_checkpointsLookup implementation taken from openzeppelin ERC20Votes.sol version 4.4.2
    function _checkpointsLookup(Checkpoint[] storage ckpts, uint256 blockNumber) private view returns (uint256) {
        // We run a binary search to look for the earliest checkpoint taken after `blockNumber`.
        //
        // During the loop, the index of the wanted checkpoint remains in the range [low-1, high).
        // With each iteration, either `low` or `high` is moved towards the middle of the range to maintain the invariant.
        // - If the middle checkpoint is after `blockNumber`, we look in [low, mid)
        // - If the middle checkpoint is before or equal to `blockNumber`, we look in [mid+1, high)
        // Once we reach a single value (when low == high), we've found the right checkpoint at the index high-1, if not
        // out of bounds (in which case we're looking too far in the past and the result is 0).
        // Note that if the latest checkpoint available is exactly for `blockNumber`, we end up with an index that is
        // past the end of the array, so we technically don't find a checkpoint after `blockNumber`, but it works out
        // the same.
        uint256 high = ckpts.length;
        uint256 low = 0;
        while (low < high) {
            uint256 mid = Math.average(low, high);

            if (ckpts[mid].fromBlock > blockNumber) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }

        return high == 0 ? 0 : ckpts[high - 1].votes;
    }

    

    //@dev helper function used to update checkpoints when tokens are transferred
    function _moveVotingPower(
        address src,
        address dst,
        uint256[] memory ids,
        uint256[] memory amounts
    ) private {
        for (uint256 i =0; i< ids.length; i++){
            if (src != dst && amounts[i] > 0) {
                if (src != address(0)) {
                    (uint256 oldWeight, uint256 newWeight) = _writeCheckpoint(_checkpoints[src][ids[i]], _subtract, amounts[i]);
                    emit VotesChanged(src, ids[i], oldWeight, newWeight);
                }

                if (dst != address(0)) {
                    (uint256 oldWeight, uint256 newWeight) =  _writeCheckpoint(_checkpoints[dst][ids[i]], _add, amounts[i]);
                    emit VotesChanged(dst, ids[i], oldWeight, newWeight);
                }
            }
        }
    }

}