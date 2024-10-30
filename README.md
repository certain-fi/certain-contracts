# Delta Neutral Token

This repository contains smart contracts for Deltra Neutral Token

## Usage

### Pre Requisites

Install dependencies

```
$ yarn
```

_(For older versions:)_ Fix hardhat-ethers dependencies by running:

```
$ yarn add -D @nomiclabs/hardhat-ethers@yarn:hardhat-deploy-ethers@0.3.0-beta.13
```

### Compile

Compile the smart contracts with Hardhat:

```
$ npx hardhat compile
```

### Test

Run the tests with Hardhat:

```
$ npx hardhat test
```

## Production Deployment

1. Create `.env` file and add following variables there:

`PRIVATE_KEY` - private key of the account to use for deploy

`ALCHEMY_API_KEY` - Alchemy API key

`ETHSCAN_API_KEY` - Etherscan API key (optional)

2. Run following command:

```
$ npx hardhat --network [network name] deploy:dnt --owner [initial owner's address]
```

Project currently supports Ethereum `mainnet` and `sepolia`

Deployment artifact will be added to `deployments` folder under respective
network

### Verification

Make sure that you've added `ETHSCAN_API_KEY` to `.env`

Then run:

```
$ npx hardhat --network [network name] etherscan-verify
```
