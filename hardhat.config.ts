import * as dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";
import "@typechain/hardhat";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomiclabs/hardhat-ethers";
import "hardhat-gas-reporter";
import "hardhat-contract-sizer";
import "hardhat-spdx-license-identifier";
import "solidity-coverage";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import "./tasks";

dotenv.config();

const networkConfig = (url: string | null | undefined, verifyKey?: string) => ({
  url: url || "",
  accounts:
    process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
  verify: {
    etherscan: {
      apiKey: verifyKey ?? "",
    },
  },
});

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.25",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  networks: {
    hardhat: {
      forking: process.env.FORKING_RPC_URL
        ? {
            url: process.env.FORKING_RPC_URL,
            blockNumber: Number.parseInt(process.env.FORKING_BLOCK_NUMBER!),
          }
        : undefined,
    },
    mainnet: networkConfig(
      `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      process.env.ETHSCAN_API_KEY,
    ),
    sepolia: networkConfig(
      `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      process.env.ETHSCAN_API_KEY,
    ),
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: false,
    only: ["DeltaNeutralTokenV1"],
  },
  spdxLicenseIdentifier: {
    overwrite: true,
    runOnCompile: true,
  },
};

export default config;
