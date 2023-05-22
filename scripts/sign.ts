// Get Smart Contract ABI
// Integrate web3.js to create smart contract call
// See if we need to do RLP Encoding ourselves.
// Create data for ledger to be signed

import Web3 from 'web3'
import { Chain, Common } from '@ethereumjs/common'
import { Transaction, TxData } from '@ethereumjs/tx'
import { RLP } from '@ethereumjs/rlp'

import { ERC_20_ABI } from '../abis'
import { signEthereumTransaction } from './ledger'
import { bufArrToArr } from '@ethereumjs/util'

const CHAIN_ID = 5
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

async function createTxObject(): Promise<any> {
    const erc20Contract = new provider.eth.Contract(ERC_20_ABI, TOKEN_CONTRACT_ADDRESS)
    const data = erc20Contract.methods.transfer(RECIPIENT_ACCOUNT_ADDRESS, provider.utils.toHex(AMOUNT)).encodeABI()
    const nonce = provider.utils.toHex(await provider.eth.getTransactionCount(ORIGIN_ACCOUNT_ADDRESS))
    const gasPrice = provider.utils.toHex(await provider.eth.getGasPrice())
    const estimatedGas = await provider.eth.estimateGas({ from: ORIGIN_ACCOUNT_ADDRESS, to: TOKEN_CONTRACT_ADDRESS, data })
    // Twice as much, because we want to be safe
    const gasLimit = provider.utils.toHex(2*estimatedGas)
    
    const to = TOKEN_CONTRACT_ADDRESS
    const value = provider.utils.toHex(ETH_AMOUNT)
    const parity = 0
    const v = parity + (CHAIN_ID * 2) + 35

    // https://github.com/ethereumbook/ethereumbook/blob/develop/code/web3js/raw_tx/raw_tx_demo.js
    // https://eips.ethereum.org/EIPS/eip-155
    // https://ethereum.stackexchange.com/questions/40857/how-to-get-a-signed-transaction-string-when-ive-already-got-the-r-sv-from-sign

    const transactionData: TxData = { nonce, gasPrice, gasLimit, to, value, data }
    console.log('TX DATA: ', transactionData)
    const common = new Common({ chain: Chain.Goerli })
    const transactionObject = Transaction.fromTxData(transactionData, { common })
    console.log('TX OBJECT: ', transactionObject)
    const message = transactionObject.getMessageToSign(false)
    const serializedMessage = Buffer.from(RLP.encode(bufArrToArr(message)))
    console.log('HASH: ', serializedMessage)

    return serializedMessage
}

async function run(): Promise<void> {
    try {
        // 0. Initialize the provider
        await initializeProvider()

        // 1. Get the data for the Ledger to sign
        const data = await createTxObject()
        console.log('DATA: ', data)

        // 2. Sign the data
        const signature = await signEthereumTransaction(data)
        console.log('SIGNATURE: ', signature)

        // 3. Send the transaction
        const tx = await provider.eth.sendSignedTransaction(signature)
        console.log('TX: ', tx)
    } catch (err) {
        console.error(err)
    }
}

void run()