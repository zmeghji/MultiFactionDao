const hre = require("hardhat");


async function main(){
    const deployer = (await hre.ethers.getSigners())[0];

    //Deploy voting token
    let factionVotes = await deploy("FactionVotes", []);

    //Mint first 3 token types 
    const amountToMint = 10;
    await factionVotes.mint(deployer.address, 0, amountToMint, hre.ethers.utils.formatBytes32String(""));
    console.log("minted token 0");
    await new Promise(resolve => setTimeout(resolve, 20000));
    await factionVotes.mint(deployer.address, 1, amountToMint, hre.ethers.utils.formatBytes32String(""));
    console.log("minted token 1");
    await new Promise(resolve => setTimeout(resolve, 20000));
    await factionVotes.mint(deployer.address, 2, amountToMint, hre.ethers.utils.formatBytes32String(""));
    console.log("minted token 2");

    console.log("Minted voting tokens");

    //Deploy the timelock controller
    let timelockController = await deploy("TimelockController", [0, [], []]);

    //Deploy the governance contract 
    let multiFactionDao = await deploy ("MultiFactionDao", 
        [factionVotes.address, timelockController.address, 1, 2, 5,20])

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

    // Create initial test proposal 
    let ABI = [
        "function setDifficulty(uint256 _difficulty) external"
    ];
    let gameInterface = new hre.ethers.utils.Interface(ABI);
    let encodedFunction = gameInterface.encodeFunctionData(
        "setDifficulty",[0]
    );

    let targets = [game.address]
    let values  = [0];
    let calldatas = [encodedFunction];
    let description = "This is simply the first test proposal. Executing it will not actually change the game's difficulty.";
    await multiFactionDao.propose(
        targets,
        values,
        calldatas,
        description
    )
    console.log("Created proposal");
}

async function deploy(contractName, constructorArgs){
    const Contract = await hre.ethers.getContractFactory(contractName);
    const contract = await Contract.deploy(...constructorArgs);
    await contract.deployed();
    console.log(`${contractName} deployed to:`, contract.address);
    return contract;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });