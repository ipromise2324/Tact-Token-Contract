# TACT Token and Wallet Contracts
This repository contains two main smart contracts: Token and JettonDefaultWallet. These contracts are designed to manage and interact with the TACT token, a custom cryptocurrency.

## Token Contract
The Token contract represents the TACT token. It provides functionalities such as:

- `Minting`: New tokens can be created and added to the total supply.
- `Token Metadata`: The contract holds metadata like the token's name, symbol, and decimals.

## JettonDefaultWallet Contract
The JettonDefaultWallet contract represents a user's wallet for the TACT token. It provides functionalities such as:

- `Token Transfers`: Users can send tokens to other wallets.
- `Token Receipt`: The wallet can receive tokens from other wallets or from the main token contract.
- `Token Burning`: Users can destroy a certain amount of tokens, reducing the total supply.
- `Balance Query`: Users can check the balance of their wallet.

## Test
The tests in this repository cover various functionalities of the contracts:

1. `Deployment`: Ensures that the Token contract can be successfully deployed.
2. `Minting`: Tests the ability to mint new tokens and add them to a user's wallet.
3. `Token Transfer`: Validates that tokens can be transferred from one wallet to another.
4. `Token Burn`: Ensures that tokens can be burned, reducing the total supply.

To run the tests, use the command:
```
npx blueprint test
```
## Project structure

-   `contracts` - source code of all the smart contracts of the project and their dependencies.
-   `wrappers` - wrapper classes (implementing `Contract` from ton-core) for the contracts, including any [de]serialization primitives and compilation functions.
-   `tests` - tests for the contracts.
-   `scripts` - scripts used by the project, mainly the deployment scripts.

## How to install
```
    git clone https://github.com/ipromise2324/Tact-Token-Contract.git
    cd Tact-Token-Contract
    yarn install
    yarn blueprint build
    yarn blueprint test
```

### Build

`npx blueprint build` or `yarn blueprint build`

### Test

`npx blueprint test` or `yarn blueprint test`

### Deploy or run another script

`npx blueprint run` or `yarn blueprint run`

### Add a new contract

`npx blueprint create ContractName` or `yarn blueprint create ContractName`
# Tact-Token-Contract
