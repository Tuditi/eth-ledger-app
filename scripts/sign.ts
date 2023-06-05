// Get Smart Contract ABI
// Integrate web3.js to create smart contract call
// See if we need to do RLP Encoding ourselves.
// Create data for ledger to be signed
import Web3 from 'web3'
import { Chain, Common } from '@ethereumjs/common'
import { Transaction, TxData } from '@ethereumjs/tx'
import { RLP } from '@ethereumjs/rlp'
import { bufArrToArr } from '@ethereumjs/util'

import { ERC_20_ABI } from '../abis'
import { signEthereumTransaction } from './ledger'

const RPC_ENDPOINT = 'https://rpc.sepolia.org/'
const TOKEN_CONTRACT_ADDRESS = '0x68194a729C2450ad26072b3D33ADaCbcef39D574' // DAI ERC-20 Contract Address
const ORIGIN_ACCOUNT_ADDRESS = '0xF65e3cCbe04D4784EDa9CC4a33F84A6162aC9EB6'
const RECIPIENT_ACCOUNT_ADDRESS = '0x1bf171563b2642bB6E93081a7a1F2E6B16A54c93'
const CHAIN_ID = Chain.Sepolia

// Change to 1071 for shimmer testnet
const TX_OPTIONS = { common: Common.custom({
    chainId: CHAIN_ID,
})}

const AMOUNT = 10000000000000000 // 1DAI = 1000000000000000000
const ETH_AMOUNT = 0 // Since we don't want to transfer ETH

let provider: Web3

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

async function createTxObject(txData: TxData): Promise<Transaction> {
    return Transaction.fromTxData(txData, TX_OPTIONS)
}


async function run(): Promise<void> {
    try {
        // 0. Initialize the provider
        await initializeProvider()

        // 1. Get the unsigned transaction data
        const transactionData = await createTxData()
        const transactionObject = await createTxObject(transactionData)

        // 2. Serialize message for ledger
        const message = transactionObject.getMessageToSign(false)
        const serializedMessage = Buffer.from(RLP.encode(bufArrToArr(message)))

        // 3. Sign the data using Ledger
        const signature = await signEthereumTransaction(serializedMessage)

        // 4. Send the transaction
        const signedObject = await createTxObject({ ...transactionData, v: '0x' + signature.v, r: '0x' + signature.r, s: '0x' + signature.s })
        const serializedTransaction = Buffer.from(RLP.encode(bufArrToArr(signedObject.raw())))
    
        const tx = await provider.eth.sendSignedTransaction('0x'+serializedTransaction.toString('hex'))

        const expected = Transaction.fromSerializedTx(serializedTransaction, TX_OPTIONS)
        console.log('exp', expected)
        console.log('TX: ', tx)
    } catch (err) {
        console.error(err)
    }
}

void run()