require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-waffle');

const { RPC_URL, PRIVATE_KEY, CHAIN_ID } = process.env;

const config = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    bloctopus: {
      url: RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: parseInt(CHAIN_ID),
      gas: 'auto',
      gasPrice: 'auto',
      timeout: 60000
    },
    localhost: {
      url: "http://localhost:8545",
      chainId: 31337
    }
  },
  paths: {
    sources: "./src/contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  }
};

module.exports = config;