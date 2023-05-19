// Get Smart Contract ABI
// Integrate web3.js to create smart contract call
// See if we need to do RLP Encoding ourselves.
// Create data for ledger to be signed

import Web3 from 'web3'

import { ERC_20_ABI } from '../abis'
import { signEthereumTransaction } from './ledger'

const RPC_ENDPOINT = 'https://ethereum-goerli.publicnode.com'
const TOKEN_CONTRACT_ADDRESS = '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'
const ORIGIN_ACCOUNT_ADDRESS = '0xF65e3cCbe04D4784EDa9CC4a33F84A6162aC9EB6'
const RECIPIENT_ACCOUNT_ADDRESS = '0x1bf171563b2642bB6E93081a7a1F2E6B16A54c93'

const AMOUNT = 10000000000000000 // 0.01 wETH
const ETH_AMOUNT = 0

let provider: Web3

async function initializeProvider(): Promise<any> {
    provider = new Web3(RPC_ENDPOINT)
}

async function getDataToSign(): Promise<any> {
    const erc20Contract = new provider.eth.Contract(ERC_20_ABI, TOKEN_CONTRACT_ADDRESS)
    const data = erc20Contract.methods.transfer(RECIPIENT_ACCOUNT_ADDRESS, provider.utils.toHex(AMOUNT)).encodeABI()
    const nonce = await provider.eth.getTransactionCount(ORIGIN_ACCOUNT_ADDRESS)
    console.log('NONCE: ', nonce)
    const gasPrice = await provider.eth.getGasPrice()
    console.log('GAS PRICE: ', gasPrice)
    const gasLimit = await provider.eth.estimateGas({ from: ORIGIN_ACCOUNT_ADDRESS, to: TOKEN_CONTRACT_ADDRESS, data })
    console.log('GAS LIMIT: ', gasLimit)
    const to = TOKEN_CONTRACT_ADDRESS
    const value = ETH_AMOUNT
    const from = ORIGIN_ACCOUNT_ADDRESS
    const chainId = '0x5'

    const transactionToEncode = { nonce, gasPrice, gasLimit, to, value, data, chainId }
    
    // Create RLP encoding
    // Hash with Keccak-256

    return transactionToEncode
}

async function run(): Promise<void> {
    try {
        // 0. Initialize the provider
        await initializeProvider()

        // 1. Get the data for the Ledger to sign
        const data = await getDataToSign()
        console.log('DATA: ', data)

        // 2. Sign the data
        // const signature = await signEthereumTransaction(data)
        // console.log('SIGNATURE: ', signature)
        
        // 3. Send the transaction
        // const tx = await provider.eth.sendSignedTransaction(signature)
        // console.log('TX: ', tx)
    } catch (err) {
        console.error(err)
    }
}

void run()
