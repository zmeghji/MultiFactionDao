// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Governor.sol";
import "./GovernorCounting.sol";
import "./GovernorTimelockControl.sol";


/**
 @title Multi-Faction DAO
 @notice This contract implements a DAO for a game with different factions. Each faction gets a single vote, and that factions vote is decided by the how the holder's of the factions token type vote.
 */
contract MultiFactionDao is Governor,GovernorCounting,GovernorTimelockControl {

    constructor(
        address _tokenAddress, 
        TimelockController _timelock,
        uint _minimumForProposal,
        uint _quorumRequirement,
        uint256 _votingDelay,
        uint256 _votingPeriod)
        Governor("MultiFactionDao")
        GovernorCounting(_tokenAddress)
        GovernorTimelockControl(_timelock)
        {
            minimumForProposal = _minimumForProposal;
            quorumRequirement = _quorumRequirement;
            votingDelayInBlocks = _votingDelay;
            votingPeriodInBlocks =_votingPeriod;
        }

    /** @dev user must have this much of any particular token type to propose a vote*/
    uint256 minimumForProposal;
    /** @dev this many token ids must be in favor of proposal for it to pass */
    uint256 quorumRequirement;
    /**@dev Delay, in number of block, between the proposal is created and the vote starts. */
    uint256 votingDelayInBlocks;
    /** @dev Delay, in number of blocks, between the vote start and vote ends. */
    uint256 votingPeriodInBlocks;


    //@dev Checks whether account has the minimum amount of tokens of a particular type to make a proposal
    function _meetsProposalRequirements(address account) internal view override(Governor) returns (bool){
        uint256[] memory votes = getVotes(account, block.number - 1);
        for (uint256 i =0; i < votes.length; i++){
            if (votes[i] >= minimumForProposal ){
                return true;
            }
        }
        return false;
    }

    /**
     * Read the voting weight from the token's built in snapshot mechanism (see {IGovernor-getVotes}).
     */
    function getVotes(address account, uint256 blockNumber) public view override returns (uint256[] memory ) {
        return _token.getPastVotes(account, blockNumber);
    }

    /**
     * @dev See {IGovernor-quorum}.
     */
    function quorum(uint256 blockNumber) public view override returns (uint256){
        return quorumRequirement;
    }

    /**
     * @dev See {IGovernor-votingDelay}.
     */
    function votingDelay() public view override returns (uint256) {
        return votingDelayInBlocks; 
    }

    /**
     * @dev See {IGovernor-votingPeriod}.
     */
    function votingPeriod() public view override returns (uint256) {
        return votingPeriodInBlocks;
    }

    /**
     * @dev See {GovernorTimelockControl-_execute}.
     */
    function _execute(uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal
        override(Governor, GovernorTimelockControl)
    {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }

    /**
     * @dev See {GovernorTimelockControl-_cancel}.
     */
    function _cancel(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal
        override(Governor, GovernorTimelockControl)
        returns (uint256)
    {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    /**
     * @dev See {GovernorTimelockControl-_executor}.
     */
    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }

    /**
     * @dev See {GovernorTimelockControl-state}.
     */
    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    /**
     * @dev See {GovernorTimelockControl-state}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

}