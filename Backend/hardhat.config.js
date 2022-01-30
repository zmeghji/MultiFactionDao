/**
 * @type import('hardhat/config').HardhatUserConfig
 */

 require("dotenv").config();

 require("@nomiclabs/hardhat-waffle");
 require("hardhat-gas-reporter");
 require("solidity-coverage");
 
module.exports = {
  solidity: "0.8.0",
  gasReporter: {
    enabled: true,
    currency: "USD",
  }
};
