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

const RPC_ENDPOINT = 'https://rpc.sepolia.org/'
const TOKEN_CONTRACT_ADDRESS = '0x68194a729C2450ad26072b3D33ADaCbcef39D574' // DAI ERC-20 Contract Address
const ORIGIN_ACCOUNT_ADDRESS = '0xF65e3cCbe04D4784EDa9CC4a33F84A6162aC9EB6'
const RECIPIENT_ACCOUNT_ADDRESS = '0x1bf171563b2642bB6E93081a7a1F2E6B16A54c93'
const CHAIN_ID = 1071

const TX_OPTIONS = { common: Common.custom({
    chainId: CHAIN_ID,
})}

const AMOUNT = 10000000000000000 // 1DAI = 1000000000000000000
const ETH_AMOUNT = 0 // Since we don't want to transfer ETH

let provider: Web3

async function run(): Promise<void> {
    try {
        // 0. Initialize the provider
        await initializeProvider()

        // 1. Get the unsigned transaction data
        const transactionData = await createTxData()
        const transactionObject = await createTransaction(transactionData)

        // 2. Serialize message for ledger
        const message = transactionObject.getMessageToSign(false)
        const serializedMessage = Buffer.from(RLP.encode(message)).toString('hex')
        console.log('serialize', serializedMessage)

        // 3. Create signed transaction
        const signature = await signEthereumTransaction(serializedMessage)
        console.log(signature)
        const signedTransaction = createSignedTransaction(serializedMessage, signature)
        console.log('signedTx', signedTransaction)

        // 3b create signed transaction using transaction object
        // const signedObject = await createTransaction({ ...transactionData, v: `0x${v}`, r: `0x${r}`, s: `0x${s}` })
        // const serializedTransaction = Buffer.from(RLP.encode(signedObject.raw()))
        // console.log('expected', serializedTransaction)

        // 4. Send the transaction
        const tx = await provider.eth.sendSignedTransaction(signedTransaction)
        console.log('Sent Transaction', tx)
    } catch (err) {
        console.error(err)
    }
}

function createSignedTransaction(hexString: string, signature: any): string {
    const BREAK_SPACE = 'a0'
    const VRS_PRE_FILLED_BYTE_LENGTH = 8

    const {v, r, s} = signature
    const substr = hexString.substring(0, hexString.length - VRS_PRE_FILLED_BYTE_LENGTH)

    const signedTransaction =  substr + v.toString(16) + BREAK_SPACE + r + BREAK_SPACE + s
    console.log('Pre-error:', signedTransaction)
    const transaction = Transaction.fromSerializedTx(Buffer.from(signedTransaction, 'hex'), TX_OPTIONS)

    return '0x' + transaction.serialize().toString('hex')
}

async function initializeProvider(): Promise<any> {
    provider = new Web3(RPC_ENDPOINT)
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

async function createTransaction(txData: TxData): Promise<Transaction> {
    return Transaction.fromTxData(txData, TX_OPTIONS)
}

void run()