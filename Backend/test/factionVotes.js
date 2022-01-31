const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FactionVotes contract tests", () => {
    let deployer, player;

    beforeEach(async function () {
        [deployer, player] = await ethers.getSigners();

        const FactionVotes = await ethers.getContractFactory("FactionVotes", deployer);
        this.initialDifficulty = 0;
        this.factionVotes = await FactionVotes.deploy();
    })

    describe("mint tests", () => {
        it("Should fail when we try to mint with an incorrect token id", async function () {
            let incorrectId = 1; //correct first id is 0
            await expect(this.factionVotes.mint(deployer.address, incorrectId, 1000, ethers.utils.formatBytes32String("")))
                .to.be.revertedWith("ERC1155Votes: if minting new token id, it must equal nextTokenId");
        })

        it("Should fail when we try to mint amount 0", async function () {
            await expect(this.factionVotes.mint(deployer.address, 0, 0, ethers.utils.formatBytes32String("")))
                .to.be.revertedWith("ERC1155Votes: must mint more than 0");
        })

        it("Should let the owner mint", async function () {
            let amountToMint = 1000;
            let tokenId = 0;
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

    describe("getVotes", () => {
        it("fails if no tokens minted", async function () {
            expect(this.factionVotes.getVotes(deployer.address)).to.be.revertedWith("ERC1155Votes: no token ids have been minted");
        })
    })

    describe("getPastVotes", () => {
        it("fails if no tokens minted", async function () {
            expect(this.factionVotes.getPastVotes(deployer.address, 0))
                .to.be.revertedWith("ERC1155Votes: no token ids have been minted");
        })

        it("fails if block not yet mined", async function () {
            let tx = await this.factionVotes.mint(deployer.address, 0, 100, ethers.utils.formatBytes32String(""))
            expect(this.factionVotes.getPastVotes(deployer.address, tx.blockNumber + 1000))
                .to.be.revertedWith("ERC1155Votes: block not yet mined");
        })
    })

    describe("getPastTotalSupply", () => {
        it("fails if no tokens minted", async function () {
            expect(this.factionVotes.getPastTotalSupply(0)).to.be.revertedWith("ERC1155Votes: no token ids have been minted");
        })

        it("fails if block not yet mined", async function () {
            let tx = await this.factionVotes.mint(deployer.address, 0, 100, ethers.utils.formatBytes32String(""))
            expect(this.factionVotes.getPastTotalSupply(tx.blockNumber + 1000))
                .to.be.revertedWith("ERC1155Votes: block not yet mined");
        })
    })

    describe("safeTransferFrom", () => {
        it("should update voting power", async function () {
            let tokenId = 0;
            let amountToMint = 1000;
            await this.factionVotes.mint(deployer.address, tokenId, amountToMint, ethers.utils.formatBytes32String(""))

            let amountToTransfer = 500;

            await this.factionVotes.safeTransferFrom(
                deployer.address, player.address, tokenId, amountToTransfer, ethers.utils.formatBytes32String(""))

            let deployerVotes = await this.factionVotes.getVotes(deployer.address);
            expect(deployerVotes[tokenId]).to.eq(amountToMint - amountToTransfer);

            let playerVotes = await this.factionVotes.getVotes(player.address);
            expect(playerVotes[tokenId]).to.eq(amountToTransfer);

        })

    })

    describe("safeBatchTransferFrom", () => {
        it("should update voting power", async function () {
            let tokenId1 = 0;
            let tokenId2 = 1;

            let amountToMint = 1000;
            await this.factionVotes.mint(deployer.address, tokenId1, amountToMint, ethers.utils.formatBytes32String(""))
            await this.factionVotes.mint(deployer.address, tokenId2, amountToMint, ethers.utils.formatBytes32String(""))

            let amountToTransfer = 500;

            await this.factionVotes.safeBatchTransferFrom(
                deployer.address, 
                player.address, 
                [tokenId1,tokenId2], 
                [amountToTransfer,amountToTransfer], 
                ethers.utils.formatBytes32String(""))

            let deployerVotes = await this.factionVotes.getVotes(deployer.address);
            expect(deployerVotes[tokenId1]).to.eq(amountToMint - amountToTransfer);
            expect(deployerVotes[tokenId2]).to.eq(amountToMint - amountToTransfer);

            let playerVotes = await this.factionVotes.getVotes(player.address);
            expect(playerVotes[tokenId1]).to.eq(amountToTransfer);
            expect(playerVotes[tokenId2]).to.eq(amountToTransfer);


        })
    })


})