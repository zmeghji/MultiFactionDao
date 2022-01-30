// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Governor.sol";
import "../Token/ERC1155Votes.sol";

/**
@dev vote counting module for Governor using ERC1155Votes. keeps track of voting results for each proposal and whether an account has voted or not.
 */
abstract contract GovernorCounting is Governor {
    /**
     * @dev Supported vote types. 
     */
    enum VoteType {
        Against,
        For
    }

    struct ProposalVote {
        uint256 againstVotes;
        uint256 forVotes;
    }

    //@dev proposal id => (token id => proposalvote)
    mapping(uint256 => mapping (uint256 =>ProposalVote)) private _proposalVotes;

    // @dev proposal id => (account => voted or not)
    mapping (uint256 => mapping(address => bool)) _hasVoted;

    //Represents the goverance token 
    ERC1155Votes internal _token;

    constructor(address tokenAddress){
        _token = ERC1155Votes(tokenAddress);
    }


    /**
     * @dev See {IGovernor-COUNTING_MODE}.
     */
    // solhint-disable-next-line func-name-mixedcase
    function COUNTING_MODE() public pure virtual override returns (string memory) {
        return "support=alpha&quorum=for";
    }

    /**
     * @dev See {IGovernor-hasVoted}.
     */
    function hasVoted(uint256 proposalId, address account) public view virtual override returns (bool) {
        return _hasVoted[proposalId][account];
    }

    /**
     * @dev Accessor to the internal vote counts.
     */
    function proposalVotes(uint256 proposalId)
        public
        view
        virtual
        returns (ProposalVote[] memory ) 
    {
        uint256 nextTokenId = _token.nextTokenId();
        ProposalVote[] memory votes = new ProposalVote[](nextTokenId);
        for (uint i = 0; i < nextTokenId; i ++){
            votes[i] =  _proposalVotes[proposalId][i];
        }
        return votes;
    }

    // /**
    //  * @dev See {Governor-_quorumReached}.
    //  */
    function _quorumReached(uint256 proposalId) internal view virtual override returns (bool) {
        uint256 requiredForQuorum = quorum(proposalSnapshot(proposalId));
        uint numberOfTokenIdsFor = 0;

        for (uint i = 0; i < _token.nextTokenId(); i++){
            ProposalVote storage  proposalVote = _proposalVotes[proposalId][i];
            if (proposalVote.forVotes > proposalVote.againstVotes){
                numberOfTokenIdsFor++;
            }
        }

        return numberOfTokenIdsFor >=requiredForQuorum;
    }

    /**
     * @dev See {Governor-_voteSucceeded}. Returns whether the number of token Ids voting for is greater than the number of token Ids voting against
     */
    function _voteSucceeded(uint256 proposalId) internal view virtual override returns (bool) {
        uint numberOfTokenIdsFor = 0;
        uint numberOfTokenIdsAgainst = 0;

        for (uint i = 0; i < _token.nextTokenId(); i++){
            ProposalVote storage  proposalVote = _proposalVotes[proposalId][i];
            if (proposalVote.forVotes > proposalVote.againstVotes){
                numberOfTokenIdsFor++;
            }
            else if (proposalVote.forVotes < proposalVote.againstVotes){
                numberOfTokenIdsAgainst++;
            }
        }

        return (numberOfTokenIdsFor > numberOfTokenIdsAgainst);
    }


     /**
     * @dev See {Governor-_countVote}. 
     */
    function _countVote(
        uint256 proposalId,
        address account,
        uint8 support,
        uint256[] memory weights 
    ) internal virtual override {
        require(! _hasVoted[proposalId][account], "GovernorCounting: vote already cast");
        for (uint i = 0; i < _token.nextTokenId(); i ++){
            ProposalVote storage proposalvote = _proposalVotes[proposalId][i];
            if (support == uint8(VoteType.Against)) {
                proposalvote.againstVotes += weights[i];
            } else if (support == uint8(VoteType.For)) {
                proposalvote.forVotes += weights[i];
            } else {
                revert("GovernorVotingSimple: invalid value for enum VoteType");
            }
        }
    }

}