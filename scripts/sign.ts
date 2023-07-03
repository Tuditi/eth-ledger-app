// Get Smart Contract ABI
// Integrate web3.js to create smart contract call
// See if we need to do RLP Encoding ourselves.
// Create data for ledger to be signed
import Web3 from 'web3'
import { Chain, Common } from '@ethereumjs/common'
import { Transaction, TxData } from '@ethereumjs/tx'

import { ERC_20_ABI } from '../abis'
import { signEthereumTransaction } from './ledger'
import { RLP } from '@ethereumjs/rlp'

const RPC_ENDPOINT = 'https://rpc.sepolia.org/'
const TOKEN_CONTRACT_ADDRESS = '0x68194a729C2450ad26072b3D33ADaCbcef39D574' // DAI ERC-20 Contract Address
const ORIGIN_ACCOUNT_ADDRESS = '0xF65e3cCbe04D4784EDa9CC4a33F84A6162aC9EB6'
const RECIPIENT_ACCOUNT_ADDRESS = '0x1bf171563b2642bB6E93081a7a1F2E6B16A54c93'
const CHAIN_ID = Chain.Sepolia

const TX_OPTIONS = { 
    common: Common.custom({
        chainId: CHAIN_ID,
    }),
    freeze: false
}

const AMOUNT = 10000000000000000 // 1DAI = 1000000000000000000
const ETH_AMOUNT = 0 // Since we don't want to transfer ETH

let provider: Web3

async function run(): Promise<void> {
    try {
        // 0. Initialize the provider
        await initializeProvider()

        // 1. Get the unsigned transaction data
        const transactionData = await createTxData()
        const transaction = Transaction.fromTxData(transactionData, TX_OPTIONS)

        // 2. Replace v value of raw transaction
        const rawTx = transaction.raw()
        const chainId = TX_OPTIONS.common.chainId().toString(16)
        const vHex = padHexString(chainId)
        rawTx[6] = Buffer.from(vHex, 'hex')

        // 3. RLP Encode message for ledger        
        const message = Buffer.from(RLP.encode(rawTx)).toString('hex')

        // 4a. Create signed transaction using raw string
        const signature = await signEthereumTransaction(message)
        const signedTransaction = createSignedTransaction(rawTx, signature)
        
        // 4b create signed transaction using transaction object
        // const signedObject = await createTransaction({ ...transactionData, v: `0x${v}`, r: `0x${r}`, s: `0x${s}` })
        // const serializedTransaction = Buffer.from(RLP.encode(signedObject.raw()))
        // console.log('expected', serializedTransaction)

        // 5. Send the transaction
        const tx = await provider.eth.sendSignedTransaction(signedTransaction)
        console.log('Sent Transaction', tx)
    } catch (err) {
        console.error(err)
    }
}

function createSignedTransaction(rawTx: Buffer[], signature: any): string {
    rawTx[6] = Buffer.from(signature.v, 'hex')
    rawTx[7] = Buffer.from(signature.r, 'hex')
    rawTx[8] = Buffer.from(signature.s, 'hex')

    const transaction = Transaction.fromValuesArray(rawTx, TX_OPTIONS)
    const serializedTx = transaction.serialize()
    return `0x${serializedTx.toString('hex')}`
}

async function initializeProvider(): Promise<any> {
    provider = new Web3(RPC_ENDPOINT)
}

function padHexString(str: string): string {
    return str.length % 2 !== 0 ? "0" + str : str;
}

async function createTxData(): Promise<TxData> {
    const erc20Contract = new provider.eth.Contract(ERC_20_ABI, TOKEN_CONTRACT_ADDRESS)

    const data = erc20Contract.methods.transfer(RECIPIENT_ACCOUNT_ADDRESS, provider.utils.toHex(AMOUNT)).encodeABI()
    const nonce = provider.utils.toHex(await provider.eth.getTransactionCount(ORIGIN_ACCOUNT_ADDRESS))

    const _gasPrice = await provider.eth.getGasPrice()
    const gasPrice = '0x' + _gasPrice
    
    const estimatedGas = await provider.eth.estimateGas({ from: ORIGIN_ACCOUNT_ADDRESS, to: TOKEN_CONTRACT_ADDRESS, data })
    const gasLimit = provider.utils.toHex(2*estimatedGas) // Double to ensure we have enough gas

    const to = TOKEN_CONTRACT_ADDRESS
    const value = provider.utils.toHex(ETH_AMOUNT)

    return { nonce, gasPrice, gasLimit, to, value, data }
}

void run()
