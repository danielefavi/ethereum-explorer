# Ethereum Explorer - NPM javascript package
**Ethereum Explorer** is a NPM package to make easy the interaction with Ethereum blockchain.

Ethereum Explorer is a NPM package to ease the interaction with the Ethereum blockchain.

With Ethereum Explorer you can easily invoke smart contracts, self-sign transactions or get general information about the blockchain (like gas price, gas limit, block information).

# Quick Start

## Installation

To use Ethereum Explorer you first have to install the package `ethereum-explorer` in your project:

```sh
npm i ethereum-explorer
```

## Initialization

Import the library `ethereum-explorer` in your code.

```js
const EthereumExplorer = require('ethereum-explorer');
```

or

```js
import EthereumExplorer from 'ethereum-explorer';
```

Then initialize and boot the Ethereum Explorer:

```js
// instantiate a new EthereumExplorer object
const ethExp = new EthereumExplorer();

// connect to the blockchain network
try {
    await ethExp.bootWeb3();
} catch (error) {
    console.error(error);
}
```

# How to interact with smart contracts

Before to continue with this section, please sure you booted the `EthereumExplorer` object with `bootWeb3()` as explained before.

## Initialize the smart contract from ABI

To interact with a smart contract first you must initialize it.  

The function for initializing the smart contract is `loadContact` and accepts the following parameters:

- Contract address (required): the address of the contract.
- Contract ABI (required): the JSON of the contract's ABI.
- Contract name (optional): the name of the contract. You must give it a name if you have more than one smart contract.

```js
const contractAddress1 = '0x9eF8cFDd40fB1Fa402a1c0f981249B763A0a7E4e';
const contractAbiJson1 = require('./assets/contracts/ABI/SmartContract1.json');
ethExp.loadContact(contractAddress1, contractAbiJson1, 'SmartContract1');

const contractAddress2 = '0x1e5d52BC66D53b5A7521C1169133E83F582B7f81';
const contractAbiJson2 = require('./assets/contracts/ABI/SmartContract2.json');
ethExp.loadContact(contractAddress2, contractAbiJson2, 'SmartContract2');
```

You can easily initialize smart contracts from the JSON given in output from the Truffle framework compile.

```js
const netId = await ethExp.getNetworkId();

ethExp.loadContact(ContractAbiJson.networks[netId].address, ContractAbiJson.abi);
```

## How to invoke a **VIEW** or **PURE** smart contract function

The function `call` helps to invoke a function of a smart contract. The parameter to give to the function are:

- Name of the function (required).
- List of parameter to give to the smart contract function in a form of an array (optional).
- Name of the smart contract (optional).

Let's suppose we have a `Users` smart contract and it has a function called `getUserById` to get an user by ID. And below the implementation of the function:

```js
function getUserById(string memory idNumber) public view returns (
    string memory,
    string memory,
    address
) {
    ...
}
```

To invoke the function you can proceed as per below:

```js
const message = await ethExp.call(
    'getUserById',  // name of the smart contract function
    ['341'],        // parameters required from the smart contract function
    'Users'         // name of the smart contract
);
```

## How to invoke a **PAYABLE** or **NON-PAYABLE** smart contract function

There are 2 ways to invoke a function that changes the state of the blockchain:

- Using the wallet user address connected to the wallet provider (like MetaMask). The user will be prompted to MetaMask to confirm the transaction.
- Provide the **wallet address** and the related **private key** to sign the transaction.

The function `sendTxToSmartContract` invokes a functions and needs the following parameters:

- Address of the wallet of the user (required).
- Private key of the user (optional). If not provided the user will be prompted to the wallet provider (like MetaMask).
- Name of the function to call (required).
- Array of parameter required by the smart contract function (optional).
- Optional values for the transaction (optional).
- Name of the smart contract (optional).

### How to send transaction and being prompted to the wallet provider (like MetaMask) for confirmation

The example below invokes a function using the wallet the user is connected with. The user will be prompted to MetaMask (or any other wallet manager) to confirm the transaction.

```js
const walletAddress = await ethExp.getUserAccount(); // wallet address of the user that is sending the transaction

const name = 'John';
const surname = 'Doe'
const address = '0x123'

(await ethExp.sendTxToSmartContract(walletAddress, null, 'updateUser', [name, surname, address], {}, 'Users'))
    .on('transactionHash', transactionHash => console.log(transactionHash))
    .on('receipt', receipt => console.log(receipt))
    .on('error', error => console.error(error));
```

### How to send a self signed transaction

In the example below, the wallet address and its related key are used to sign the transaction, so they must be provided.

```js
const walletAddress = '0x8aD783Bdb18Bd445CB4929BCee117e094Df03A47';
const privateKey = '3eadd2ddc6711115252e919ca785d0fac5d803059c13588dcf36dca5c5a18f2a';

const name = 'John';
const surname = 'Doe'
const address = '0x123'

(await ethExp.sendTxToSmartContract(walletAddress, privateKey, 'updateUser', [name, surname, address], {}, 'Users'))
    .on('transactionHash', transactionHash => console.log(transactionHash))
    .on('receipt', receipt => console.log(receipt))
    .on('error', error => console.error(error));
```

# Utility functions

Below a list of utility function:

- `getGasLimit`: retrieve the current gas limit.
- `getGasPrice`: retrieve the current gas price.
- `getBlock`: return the block information by block number. It accepts positive integers or `latest`.
- `getBlockNumber`: return the total number of blocks in the blockchain. 
- `getUserAccount`: return the wallet user address connected to the wallet provider.

# DApp working example

On the repo [https://github.com/danielefavi/ethereum-explorer-example](https://github.com/danielefavi/ethereum-explorer-example) you can find a DApp that uses the package `ethereum-explorer`.