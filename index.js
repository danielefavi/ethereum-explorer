/**
 * Utility class to make easier the interaction with the Ethereum blockchain.
 */
class EthereumExplorer {
    
    /**
     * Constructor: initialize the default values of the class attributes.
     */
    constructor() {
        this.web3 = null;
        this.contracts = {};
        this.contractDetails = {};
        this.defaultOptions = {
            gasLimit: null,
            gasPrice: null,
        };
        this.userAccount = null;
        this.callbacks = {};
    }

    /**
     * Initialize Web3.js
     */
    async bootWeb3() {
        var web3Provider = null;

        // Modern dapp browsers...
        if (window.ethereum) {
            web3Provider = window.ethereum;

            try {
                // Request account access
                await window.ethereum.request({ method: 'eth_requestAccounts' });
            } catch (error) {
                // User denied account access...
                throw error;
            }
        } else if (window.web3) {
            // Legacy dapp browsers...
            web3Provider = window.web3.currentProvider;
        } else {
            // If no injected web3 instance is detected, fall back to Ganache
            web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        }

        this.web3 = new Web3(web3Provider);
    }

    /**
     * Load into the EthereumExplorer object all the details of a smart contract.
     * The details needed are the compiled details of the smart contract (like ABI).
     *
     * @param   {Object}  contractJson  The details of the contract to load.
     * @param   {string}  contractName  The name of the contract.
     */
    async loadContractFromJson(contractJson, contractName='default') {
        var netId = await this.getNetworkId();
        
        if (! contractJson.networks[netId]) {
            throw 'The network ID does not exist in the JSON of the contract. Probably you have to change network. Current network: ' + netId;
        }

        this.loadContact(contractJson.networks[netId].address, contractJson.abi, contractName);
    }

    /**
     * Store the contract details in the class "contractDetails" attribute and
     * then store the contract object from web3/eth into the attribute "contracts"
     * for an easy picking of the contract object.
     *
     * @param   {string}  contractAddress  Address of the contract.
     * @param   {Object}  contractAbi      The ABI of the contract.
     * @param   {string}  contractName     The name of the contract, useful if you deal with more than one smart contract.
     */
    loadContact(contractAddress, contractAbi, contractName='default') {
        this.contractDetails[contractName] = {};
        this.contractDetails[contractName].address = contractAddress;
        this.contractDetails[contractName].abi = contractAbi;
        this.contractDetails[contractName].contractName = contractName;

        this.contracts[contractName] = new this.web3.eth.Contract(contractAbi, contractAddress);
    }

    /**
     * Return the web/eth contract instance loaded in the function "loadContact".
     *
     * @param   {string}  contractName      The name of the contract.
     */
    contract(contractName='default') {
        return this.contracts[contractName];
    }

    /**
     * Return the contract details loaded in the function "loadContact".
     *
     * @param   {string}  contractName      The name of the contract.
     */
    contractDetail(contractName='default') {
        return this.contractDetails[contractName];
    }

    /**
     * Call a smart contract function.
     *
     * @param   {string}  method        The name of the smart contract function to call.
     * @param   {mixed}   param         The parameters to pass to the smart contract function we are calling.
     * @param   {string}  contractName  The name of the smart contract.
     * @param   {Object}  options       Extra options for calling the smart contract method (please reference to the Web3.js documentation).
     */
    async call(method, param, contractName='default', options={}) {
        if (param === null) {
            return this.contracts[contractName].methods[method]().call(options);
        }
        
        if (typeof param == 'object') {
            return this.contracts[contractName].methods[method](...param).call(options);
        }

        return this.contracts[contractName].methods[method](param).call(options);
    }

    /**
     * Get the network ID of the blockchain we are connected to.
     *
     * @return  {Integer}    The ID of the blockchain network.
     */
    async getNetworkId() {
        return await this.web3.eth.net.getId(); 
    }

    /**
     * Check if a smart contract method is pure, view, payable, non payable, ...
     *
     * @param   {string}  type          The type of the method to check (pure, view, payable, ...).
     * @param   {string}  method        The name of the method to call.
     * @param   {string}  contractName  The name of the smart contract.
     * @return  {boolean|null}
     */
    methodTypeIs(type, method, contractName='default') {
        if (this.contractDetail(contractName) && this.contractDetail(contractName).abi) {
            const fnc = this.contractDetail(contractName).abi.filter(item => item.name == method);
            if (! fnc.length) return null;

            return (fnc[0].stateMutability && fnc[0].stateMutability == type);
        }

        return null;
    }

    /**
     * Check if the smart contract method is pure.
     *
     * @param   {string}  method        The name of the method to call.
     * @param   {string}  method        The name of the method to call.
     * @return  {boolean|null}
     */
    methodIsViewOrPure(method, contractName='default') {
        return (this.methodTypeIs('view', method, contractName) || this.methodTypeIs('pure', method, contractName));
    }

    /**
     * Check if the smart contract method is payable.
     *
     * @param   {string}  method        The name of the method to call.
     * @param   {string}  method        The name of the method to call.
     * @return  {boolean|null}
     */
    methodIsPayable(method, contractName='default') {
        return this.methodTypeIs('payable', method, contractName);
    }

    /**
     * Check if the smart contract method is non payable.
     *
     * @param   {string}  method        The name of the method to call.
     * @param   {string}  method        The name of the method to call.
     * @return  {boolean|null}
     */
    methodIsNonPayable(method, contractName='default') {
        return this.methodTypeIs('nonpayable', method, contractName);
    }

    /**
     * Submit a transaction to the smart contract.
     *
     * @param   {string}            fromAddress     The address of the user's wallet.
     * @param   {string|null}       fromPrivateKey  The private key of the user's wallet/
     * @param   {string}            contractFnc     The name of the function of the smart contract we are calling.
     * @param   {Array}             contractData    Extra data to sent along with the smart contract call.
     * @param   {[type]}            options         Extra option needed for calling the smart contract (for example when the method is payable then you might need to send funds to the smart contract).
     * @param   {[type]}            contractName    The name of the smart contract.
     *
     * @return  {Object}            Return the transaction promise.
     */
    async sendTxToSmartContract(fromAddress, fromPrivateKey, contractFnc, contractData=[], options={}, contractName='default') {
        // checking if the contract has been loaded
        if (! this.contractDetail(contractName)) {
            throw 'Contract address not found!';
        }

        // getting the transaction raw data
        var txData = await this.getTransactionData(
            fromAddress,
            this.contractDetail(contractName).address,
            options
        );

        // checking if there is a fund to send to the smart contract
        if (options.value) txData.value = options.value;

        // if the private key is given then we must sign the transaction with that private key
        if (fromPrivateKey) {
            const data = this.contract(contractName).methods[contractFnc](...contractData).encodeABI();
            if (data) txData.data = data;

            // signing the transaction with the given private key
            const signedTx = await this.web3.eth.accounts.signTransaction(txData, fromPrivateKey);

            // DOCS: https://web3js.readthedocs.io/en/v1.7.3/web3-eth.html?highlight=sendSignedTransaction#id90
            this.web3.eth.sendSignedTransaction(signedTx.rawTransaction)
                .on('transactionHash', transactionHash => this.emit('transactionHash', transactionHash))
                .on('receipt', receipt => this.emit('receipt', receipt))
                .on('error', error => this.emit('error', error));
            
            return Promise.resolve(this);
        }

        // if the private key is not given then teh signature will be handled via Metamask (or similar)
        this.contract(contractName).methods[contractFnc](...contractData).send(txData)
            .on('transactionHash', transactionHash => this.emit('transactionHash', transactionHash))
            .on('receipt', receipt => this.emit('receipt', receipt))
            .on('error', error => this.emit('error', error));

        return Promise.resolve(this);
    }

    /**
     * Get the basic transaction data.
     *
     * @param   {string}  from     The users's wallet address.
     * @param   {string}  to       The destination address.
     * @param   {Object}  options  The eventual default options.
     *
     * @return  {Object}           The transaction data.
     */
    async getTransactionData(from, to, options={}) {
        return { from, to, 
            nonce: options.nonce || await this.web3.eth.getTransactionCount(from, 'pending'),
            gasPrice: options.gasPrice || await this.getGasPrice(false),
            gasLimit: options.gasLimit || await this.getGasLimit(false),
        }
    }

    /**
     * Get the current gas limit.
     *
     * @param   {string}   fromCache    Load the gas limit from the class attribute.
     *
     * @return  {Number|null}           The gas limit.
     */
    async getGasLimit(fromCache=true) {
        if (this.defaultOptions.gasLimit && fromCache) return this.defaultOptions.gasLimit;

        const block = await this.getBlock('latest');

        if (block) {
            this.defaultOptions.gasLimit = block.gasLimit;
            return this.defaultOptions.gasLimit;
        }
        
        return null;
    }

    /**
     * Get the current gas price.
     *
     * @param   {string}   fromCache    Load the gas price from the class attribute.
     *
     * @return  {Number|null}           The gas price.
     */
    async getGasPrice(fromCache=true) {
        if (this.defaultOptions.gasPrice && fromCache) return this.defaultOptions.gasPrice;

        const gasPrice = this.web3.eth.getGasPrice();

        if (gasPrice) {
            this.defaultOptions.gasPrice = gasPrice;
            return gasPrice;
        }
        
        return null;
    }

    /**
     * Get the block details of the given block number.
     *
     * @param   {Integer}  blockNumber  The number of the block to retrieve.
     *
     * @return  {Object}                The details of the block.
     */
    async getBlock(blockNumber) {
        return await this.web3.eth.getBlock(blockNumber);
    }

    /**
     * Return the number of the latest block minded.
     *
     * @return  {Integer}   The number of the latest block.
     */
    async getBlockNumber() {
        return await this.web3.eth.getBlockNumber();
    }

    /**
     * Get the user account from the Metamask (or any other clients manager).
     *
     * @return  {string}  The user's wallet address.
     */
    async getUserAccount() {
        if (this.userAccount) return this.userAccount;

        const accounts = await this.web3.eth.getAccounts();

        this.userAccount = accounts[0];

        return this.userAccount;
    }

    /**
     * Append a callback to a given event.
     *
     * @param   {string}  eventName    The name of the event.
     * @param   {function}  callback   The callback function to attach to the event.
     *
     * @return  {EthereumExplorer}
     */
     on(eventName, callback) {
        if (! this.callbacks[eventName]) {
            this.callbacks[eventName] = callback;
        }

        return this;
    }

    /**
     * Emit an event.
     *
     * @param   {string}  eventName  The name of the event.
     * @param   {mixed}  data        The data to attach to the event
     *
     * @return  {mixed}
     */
    emit(eventName, data) {
        if (this.callbacks[eventName]) {
            return this.callbacks[eventName](data);
        }
    }

}

module.exports = EthereumExplorer; 