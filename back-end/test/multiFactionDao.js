const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MultiFactionDao Test", () => {
    let deployer, player;

    beforeEach(async function () {
        [deployer, player] = await ethers.getSigners();

        //Deploy voting token
        this.factionVotes = await deploy("FactionVotes", []);

        //Mint first 3 token types 
        this.amountToMint = 1000;
        await this.factionVotes.mint(deployer.address, 0, this.amountToMint, ethers.utils.formatBytes32String(""));
        await this.factionVotes.mint(deployer.address, 1, this.amountToMint, ethers.utils.formatBytes32String(""));
        await this.factionVotes.mint(deployer.address, 2, this.amountToMint, ethers.utils.formatBytes32String(""));

        //Deploy the timelock controller
        this.timelockController = await deploy("TimelockController", [1, [], []]);

        this.minimumForProposal = 1;
        this.votingDelay =1;
        this.votingPeriod =5;
        this.quorumRequirement = 2;
        //Deploy the governance contract 
        this.multiFactionDao = await deploy("MultiFactionDao",[
            this.factionVotes.address, 
            this.timelockController.address, 
            this.minimumForProposal, 
            this.quorumRequirement, 
            this.votingDelay, 
            this.votingPeriod])

        //get roles;
        let proposerRole = await this.timelockController.PROPOSER_ROLE();
        let executorRole = await this.timelockController.EXECUTOR_ROLE();
        let adminRole = await this.timelockController.TIMELOCK_ADMIN_ROLE();

        //Grant proposer role on timelock controller to governance contract
        await this.timelockController.grantRole(proposerRole, this.multiFactionDao.address);
        await this.timelockController.grantRole(executorRole, this.multiFactionDao.address);

        //revoke admin role from deployer account
        await this.timelockController.revokeRole(adminRole, deployer.address);

        //deploy game contract with  difficulty 0
        this.game = await deploy("Game", [0])

        //Transfer ownership of game to Timelock Controller
        await this.game.transferOwnership(this.timelockController.address);
    })

    describe("Propose", () => {
        it("will fail if the user doesn't have enough tokens", async function () {
            await expect(this.multiFactionDao.connect(player).propose(
                [this.game.address],
                [0],
                [getEncodedFunctionCall()],
                "Changing the difficulty to medium"
            )).to.be.revertedWith("Governor: proposer votes below proposal threshold");

        })

        it("should go through the full lifecycle of a defeated proposal", async function () {

            let targets = [this.game.address];
            let values = [0];
            let calldatas = [getEncodedFunctionCall()];
            let description = "Changing the difficulty to medium"
            await this.multiFactionDao.propose(
                targets, values, calldatas, description);
            let proposalId = await this.multiFactionDao.hashProposal(
                targets, values, calldatas, hre.ethers.utils.id(description));

            expect(await this.multiFactionDao.state(proposalId))
                .to.eq(0);

            await waitForBlocks(this.votingDelay+1);
            expect(await this.multiFactionDao.state(proposalId))
                .to.eq(1);

            await waitForBlocks(this.votingPeriod+1);
            expect(await this.multiFactionDao.state(proposalId))
                .to.eq(3);
        })

        it("should go through the lifecycle of a succesful proposal before queuing", async function () {
            let targets = [this.game.address];
            let values = [0];
            let calldatas = [getEncodedFunctionCall()];
            let description = "Changing the difficulty to medium"
            await this.multiFactionDao.propose(
                targets, values, calldatas, description);
            let proposalId = await this.multiFactionDao.hashProposal(
                targets, values, calldatas, hre.ethers.utils.id(description));

            expect(await this.multiFactionDao.state(proposalId))
                .to.eq(0);

            await waitForBlocks(this.votingDelay+1);
            expect(await this.multiFactionDao.state(proposalId))
                .to.eq(1);
            
            let tx =await this.multiFactionDao.castVoteWithReason(proposalId,1, "The game is too easy right now.")
            
            await waitForBlocks(1);
            let deployerVotes = await this.multiFactionDao.getVotes(deployer.address,tx.blockNumber);
            expect(deployerVotes[0]).to.eq(this.amountToMint);
            expect(deployerVotes[1]).to.eq(this.amountToMint);
            expect(deployerVotes[2]).to.eq(this.amountToMint);

            await waitForBlocks(this.votingPeriod);
            expect(await this.multiFactionDao.state(proposalId))
                .to.eq(4);

        })


    })

    describe("quorum", () =>{
        it("should return the correct quorum requirement", async function(){
            expect(await this.multiFactionDao.quorum(0))
                .to.eq(this.quorumRequirement);
        })
    })
    describe("votingDelay", () =>{
        it("should return the correct voting delay", async function(){
            expect(await this.multiFactionDao.votingDelay())
                .to.eq(this.votingDelay);
        })
    })
    describe("votingPeriod", () =>{
        it("should return the correct voting period", async function(){
            expect(await this.multiFactionDao.votingPeriod())
                .to.eq(this.votingPeriod);
        })
    })
    describe("queue", ()=>{
        it("should fail when the proposal hasn't successful", async function(){
            let targets = [this.game.address];
            let values = [0];
            let calldatas = [getEncodedFunctionCall()];
            let description = "Changing the difficulty to medium"
            await this.multiFactionDao.propose(targets, values, calldatas, description);
            await expect(this.multiFactionDao.queue(targets, values, calldatas, hre.ethers.utils.id(description)))
                .to.be.revertedWith("Governor: proposal not successful");
        })
        it("should successfully queue when the proposal is successful", async function(){
            let targets = [this.game.address];
            let values = [0];
            let calldatas = [getEncodedFunctionCall()];
            let description = "Changing the difficulty to medium"

            await this.multiFactionDao.propose(targets, values, calldatas, description);
            await waitForBlocks(this.votingDelay+1);
            let proposalId = await this.multiFactionDao.hashProposal(
                targets, values, calldatas, hre.ethers.utils.id(description));
            await this.multiFactionDao.castVoteWithReason(proposalId,1, "The game is too easy right now.")
            await waitForBlocks(this.votingPeriod+1);

            await this.multiFactionDao.queue(targets, values, calldatas, hre.ethers.utils.id(description));

            expect(await this.multiFactionDao.state(proposalId))
                .to.eq(5);

        })
    })
    describe("execute", () =>{
        it("should fail if proposal has not succeeded", async function(){
            let targets = [this.game.address];
            let values = [0];
            let calldatas = [getEncodedFunctionCall()];
            let description = "Changing the difficulty to medium"
            await this.multiFactionDao.propose(targets, values, calldatas, description);
            await expect(this.multiFactionDao.execute(targets, values, calldatas, hre.ethers.utils.id(description)))
                .to.be.revertedWith("Governor: proposal not successful");
        })
        
        it("should execute if the proposal has passed", async function(){
            let targets = [this.game.address];
            let values = [0];
            let calldatas = [getEncodedFunctionCall()];
            let description = "Changing the difficulty to medium"

            await this.multiFactionDao.propose(targets, values, calldatas, description);
            await waitForBlocks(this.votingDelay+1);
            let proposalId = await this.multiFactionDao.hashProposal(
                targets, values, calldatas, hre.ethers.utils.id(description));
            await this.multiFactionDao.castVoteWithReason(proposalId,1, "The game is too easy right now.")
            await waitForBlocks(this.votingPeriod+1);

            await this.multiFactionDao.queue(targets, values, calldatas, hre.ethers.utils.id(description));
            await this.multiFactionDao.execute(targets, values, calldatas, hre.ethers.utils.id(description));
            
            expect(await this.multiFactionDao.state(proposalId)).to.eq(7);
        })
    })
    describe("hasVoted", () =>{
        it("should return false when user hasn't voted", async function(){
            let targets = [this.game.address];
            let values = [0];
            let calldatas = [getEncodedFunctionCall()];
            let description = "Changing the difficulty to medium"

            await this.multiFactionDao.propose(targets, values, calldatas, description);
            await waitForBlocks(this.votingDelay+1);
            let proposalId = await this.multiFactionDao.hashProposal(
                targets, values, calldatas, hre.ethers.utils.id(description));

            expect (await this.multiFactionDao.hasVoted(proposalId, deployer.address))
                .to.be.false;
        })

        it("should return true when user has voted", async function(){
            let targets = [this.game.address];
            let values = [0];
            let calldatas = [getEncodedFunctionCall()];
            let description = "Changing the difficulty to medium"

            await this.multiFactionDao.propose(targets, values, calldatas, description);
            await waitForBlocks(this.votingDelay+1);
            let proposalId = await this.multiFactionDao.hashProposal(
                targets, values, calldatas, hre.ethers.utils.id(description));
            await this.multiFactionDao.castVoteWithReason(proposalId,1, "The game is too easy right now.")

            expect (await this.multiFactionDao.hasVoted(proposalId, deployer.address))
                .to.be.true;
        })
    })
    describe("proposalVotes", () =>{
        it("should return the current votes for the proposal", async function(){
            let targets = [this.game.address];
            let values = [0];
            let calldatas = [getEncodedFunctionCall()];
            let description = "Changing the difficulty to medium"

            await this.multiFactionDao.propose(targets, values, calldatas, description);
            await waitForBlocks(this.votingDelay+1);
            let proposalId = await this.multiFactionDao.hashProposal(
                targets, values, calldatas, hre.ethers.utils.id(description));
            await this.multiFactionDao.castVoteWithReason(proposalId,1, "The game is too easy right now.")

            let proposalVotes = await this.multiFactionDao.proposalVotes(proposalId);

            expect(proposalVotes[0].forVotes).to.eq(this.amountToMint);
            expect(proposalVotes[1].forVotes).to.eq(this.amountToMint);
            expect(proposalVotes[2].forVotes).to.eq(this.amountToMint);


        })
    })
})

async function deploy(contractName, constructorArgs) {
    const Contract = await ethers.getContractFactory(contractName);
    const contract = await Contract.deploy(...constructorArgs);
    await contract.deployed();
    return contract;
}

function getEncodedFunctionCall() {
    let ABI = [
        "function setDifficulty(uint256 _difficulty) external"
    ];
    let gameInterface = new hre.ethers.utils.Interface(ABI);
    let encodedFunction = gameInterface.encodeFunctionData(
        "setDifficulty", [5]
    );
    return encodedFunction;
}

async function waitForBlocks(number){
    for(var i =1; i <= number; i++){
        await hre.ethers.provider.send("evm_mine");
    }
}