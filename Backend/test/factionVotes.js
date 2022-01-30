const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FactionVotes contract tests" , () => {
    let deployer;
    
    beforeEach(async function(){
        [deployer] = await ethers.getSigners();

        const FactionVotes = await ethers.getContractFactory("FactionVotes", deployer);
        this.initialDifficulty = 0;
        this.factionVotes = await FactionVotes.deploy();
    })

    describe("mint tests", () =>{
        it("Should fail when we try to mint with an incorrect token id", async function(){
            let incorrectId =1; //correct first id is 0
            await expect(this.factionVotes.mint(deployer.address, incorrectId, 1000, ethers.utils.formatBytes32String("")))
                .to.be.revertedWith("ERC1155Votes: if minting new token id, it must equal nextTokenId");
        })

        it("Should fail when we try to mint amount 0", async function(){
            await expect(this.factionVotes.mint(deployer.address, 0, 0, ethers.utils.formatBytes32String("")))
                .to.be.revertedWith("ERC1155Votes: must mint more than 0");
        })

        it("Should let the owner mint", async function(){
            let amountToMint = 1000;
            let tokenId =0;
            let tx = await this.factionVotes.mint(deployer.address, tokenId, amountToMint, ethers.utils.formatBytes32String(""));
            ethers.provider.send("evm_mine")
            
            //verify balance
            expect(await this.factionVotes.balanceOf(deployer.address, tokenId)).to.eq(amountToMint);
            //verify voting power
            let votes = await this.factionVotes.getVotes(deployer.address);
            expect(votes[tokenId]).to.eq(amountToMint);
            //verify supply
            let supply = await this.factionVotes.getPastTotalSupply(tx.blockNumber)
            expect(supply[0]).to.eq(amountToMint);
        })
    })


})