const hre = require("hardhat");


async function main(){
    const deployer = (await hre.ethers.getSigners())[0];

    //Deploy voting token
    let factionVotes = await deploy("FactionVotes", []);

    //Mint first 3 token types 
    const amountToMint = 10;
    await factionVotes.mint(deployer.address, 0, amountToMint, hre.ethers.utils.formatBytes32String(""));
    await factionVotes.mint(deployer.address, 1, amountToMint, hre.ethers.utils.formatBytes32String(""));
    await factionVotes.mint(deployer.address, 2, amountToMint, hre.ethers.utils.formatBytes32String(""));
    console.log("Minted voting tokens");

    //Deploy the timelock controller
    let timelockController = await deploy("TimelockController", [1, [], []]);

    //Deploy the governance contract 
    let multiFactionDao = await deploy ("MultiFactionDao", 
        [factionVotes.address, timelockController.address, 1, 2, 1,5])

    //get roles;
    let proposerRole = await timelockController.PROPOSER_ROLE();
    let executorRole = await timelockController.EXECUTOR_ROLE();
    let adminRole  = await timelockController.TIMELOCK_ADMIN_ROLE();

    //Grant proposer role on timelock controller to governance contract
    await timelockController.grantRole(proposerRole, multiFactionDao.address);
    await timelockController.grantRole(executorRole, multiFactionDao.address);
    console.log("Granted governor proposer role on timelock controller")

    //revoke admin role from deployer account
    await timelockController.revokeRole(adminRole, deployer.address);
    console.log("Revoked deployer's admin role on timelock controller")


    //deploy game contract with  difficulty 0
    let game = await deploy("Game", [0])

    //Transfer ownership of game to Timelock Controller
    await game.transferOwnership(timelockController.address);
    console.log("Transferred ownership of game to timelock controller");

    // deployer creates proposal through governance contract to change the game difficulty to 5
    let ABI = [
        "function setDifficulty(uint256 _difficulty) external"
    ];
    let gameInterface = new hre.ethers.utils.Interface(ABI);
    let encodedFunction = gameInterface.encodeFunctionData(
        "setDifficulty",[5]
    );

    let targets = [game.address]
    let values  = [0];
    let calldatas = [encodedFunction];
    let description = "Changing the difficulty to medium";
    await multiFactionDao.propose(
        targets,
        values,
        calldatas,
        description
    )
    console.log("Created proposal");

    let descriptionHash = hre.ethers.utils.id(description);
    const proposalId = await multiFactionDao.hashProposal(
        targets,
        values,
        calldatas,
        descriptionHash
    )
    console.log("Proposal id " + proposalId);

    //Wait for two blocks (since we had a vote delay period of 1)
    await waitForBlocks(2);

    // castVoteWithReason to governor contract
    await multiFactionDao.castVoteWithReason(proposalId,1, "The game is too easy right now.")
    console.log("Casted Vote!");

    //Wait for six blocks (our voting period is 5 blocks)
    await waitForBlocks(6);

    //queue proposal for execution using governor contract
    await multiFactionDao.queue(
        targets,
        values,
        calldatas,
        descriptionHash
    );
    console.log("queued proposal for execution ");

    //execute proposal through governance contract
    await multiFactionDao.execute(
        targets,
        values,
        calldatas,
        descriptionHash
    )
    console.log("Executed Proposal");

    //Verify Change
    let newDifficulty = await game.difficulty();
    console.log(`The difficulty has changed from 0 to ${newDifficulty}`);

}


async function deploy(contractName, constructorArgs){
    const Contract = await hre.ethers.getContractFactory(contractName);
    const contract = await Contract.deploy(...constructorArgs);
    await contract.deployed();
    console.log(`${contractName} deployed to:`, contract.address);
    return contract;
}

async function waitForBlocks(number){
    for(var i =1; i <= number; i++){
        await hre.ethers.provider.send("evm_mine");
    }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });