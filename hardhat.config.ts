import "@nomiclabs/hardhat-waffle";
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import "@openzeppelin/hardhat-upgrades"
import "@typechain/hardhat";
import "hardhat-contract-sizer"
import "@openzeppelin/hardhat-defender"
import {task} from "hardhat/config";
import "./scripts/deploy";
import "hardhat-gas-reporter";
import "hardhat-abi-exporter";
import "solidity-coverage";
import {
    POSI_CHAIN_MAINNET_URL,
    POSI_CHAIN_TESTNET_URL,
    PRIV_POSI_CHAIN_MAINNET_ACCOUNT,
    PRIV_POSI_CHAIN_TESTNET_ACCOUNT
} from "./constants";

task("accounts", "Prints the list of accounts", async (args, hre) => {
    const accounts = await hre.ethers.getSigners();
    for (const account of accounts) {
        console.log(account.address);
    }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    defaultNetwork: "hardhat",

    networks: {
        localhost: {
            url: "http://127.0.0.1:8545"
        },
        hardhat: {
            allowUnlimitedContractSize: true,
        },
        posi_testnet: {
            url: POSI_CHAIN_TESTNET_URL,
            chainId: 910000,
            accounts: PRIV_POSI_CHAIN_TESTNET_ACCOUNT ? [PRIV_POSI_CHAIN_TESTNET_ACCOUNT] : [],
            allowUnlimitedContractSize: true,
            blockGasLimit: 0x1fffffffffffff,
        },
        posi_mainnet: {
            url: POSI_CHAIN_MAINNET_URL,
            chainId: 900000,
            accounts: PRIV_POSI_CHAIN_MAINNET_ACCOUNT ? [PRIV_POSI_CHAIN_MAINNET_ACCOUNT] : []
        },
    },

    solidity: {
        compilers: [
            {
                version: "0.8.8",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 1,
                    },
                },
            },
            {
                version: "0.8.0",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 1,
                    },
                },
            },
            {
                version: "0.6.0",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 1,
                    },
                },
            },
            {
                version: "0.8.2",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 1,
                    },
                },
            }

        ]
    },
    etherscan: {
        apiKey: {
            posi_testnet: 'UXFZRYWHB141CX97CPECWH9V7E9QSPHUF6',
            posi_mainnet: 'UXFZRYWHB141CX97CPECWH9V7E9QSPHUF6',
        },
        customChains: [
            {
                network: "posi_testnet",
                chainId: 910000,
                urls: {
                    apiURL: "https://explorer-testnet.posichain.org/api",
                    browserURL: "https://explorer-testnet.posichain.org"
                }
            },
            {
                network: "posi_mainnet",
                chainId: 900000,
                urls: {
                    apiURL: "https://blockscout.posichain.org/api",
                    browserURL: "https://blockscout.posichain.org"
                }
            }
        ]
    },
    defender: {
        apiKey: process.env.DEFENDER_TEAM_API_KEY,
        apiSecret: process.env.DEFENDER_TEAM_API_SECRET_KEY,
    },
    typechain: {
        outDir: "typeChain",
        target: "ethers-v5",
    },
    contractSizer: {
        strict: true
    },
    mocha: {
        timeout: 100000
    }
};

