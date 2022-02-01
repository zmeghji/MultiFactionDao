const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Game contract tests" , () => {
    let deployer, player;
    
    beforeEach(async function(){
        [deployer, player] = await ethers.getSigners();

        const Game = await ethers.getContractFactory("Game", deployer);
        this.initialDifficulty = 0;
        this.game = await Game.deploy(this.initialDifficulty);
    })

    describe("setDifficulty tests", () =>{
        it("Should change the difficulty when owner does it with a valid number", async function(){
            let newDifficulty = 5;
            await this.game.setDifficulty(newDifficulty);
            expect(await this.game.difficulty()).to.eq(newDifficulty);
        })

        it("Should fail when an invalid difficulty is provided", async function(){
            await expect(this.game.setDifficulty(11)).to.be.revertedWith("Difficulty must be between 0 and 9");
        })

        it("Should fail when someone other than the owner tries to change difficulty", async function(){
            await expect(this.game.connect(player).setDifficulty(5)).to.be.revertedWith("Ownable: caller is not the owner");
        })
        
    })


})