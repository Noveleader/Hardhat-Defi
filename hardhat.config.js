require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

const MAINNET_URL = process.env.MAINNET_URL_ALCHEMY
const MUMBAI_URL = process.env.MUMBAI_RPC_URL
const MUMBAI_PRIVATE_KEY = process.env.MUMBAI_PRIVATE_KEY
const POLYSCAN_API_KEY = process.env.POLYSCAN_API_KEY
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY
const REPORT_GAS = process.env.REPORT_GAS.toLowerCase() === "true" || false

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
      forking: {
        url: MAINNET_URL,
      },
    },
    localhost: {
      chainId: 31337,
    },
    mumbai: {
      chainId: 80001,
      blockconfirmations: 1,
      url: MUMBAI_URL,
      accounts: [MUMBAI_PRIVATE_KEY],
      saveDeployments: true,
    },
  },
  etherscan: {
    // npx hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <CONSTRUCTOR_PARAMETERS>
    apiKey: {
      polygonMumbai: POLYSCAN_API_KEY,
    },
    customChains: [],
  },
  gasReporter: {
    enabled: REPORT_GAS,
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
    coinmarketcap: COINMARKETCAP_API_KEY,
  },
  contractSizer: {
    runOnCompile: false,
    only: ["OurToken"],
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
      1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
    },
    user1: {
      default: 1,
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.7",
      },
      {
        version: "0.6.6",
      },
      {
        version: "0.4.19",
      },
      {
        version: "0.6.12",
      },
    ],
  },
  mocha: {
    timeout: 200000, // 200 seconds max for running tests
  },
}
