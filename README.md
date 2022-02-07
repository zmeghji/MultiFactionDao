# Multi-Faction DAO
A DAO used to govern a game which contains multiple factions. Each faction gets one vote and that vote is determined by how members of that faction vote. Each faction is represented by a specific token id/type in an ERC-1155 contract. The contracts are based on OpenZeppelin's Governor contract, and make the necessary adjustments to use ERC-1155 tokens for voting.

## Deployed Site 🌐
[The deployed site can be found here](https://multifactiondao.z13.web.core.windows.net/#). Directions for using the app can be found on the instructions page.

## Running this project ▶️

### Contracts
1. cd into the back-end folder
2. run **npm install**
3. run **npx hardhat test to run the local tests
4. If you want to deploy to rinkeby, you need to add a .env file under the back-end folder with the variables RINKEBY_URL and PRIVATE_KEY. RINKEBY_URL is the url to the rinkeby node e.g. from Infura/Moralis. PRIVATE_KEY is the private key of your deployer account.


### Front-End
1. cd into the front-end folder
2. if you want to use your own deployed contracts to rinkeby, change the addresses in app.js for the variables tokenAddress, gameAddress, governorAddress in src/app.js
3. run **npm install**
4. run **npm start**

# Tools, Languages & Frameworks Used🛠️
- Hardhat/Solidity
- React/JavaScript
- Azure Static Websites



