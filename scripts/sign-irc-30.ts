// Get Smart Contract ABI
// Integrate web3.js to create smart contract call
// See if we need to do RLP Encoding ourselves.
// Create data for ledger to be signed
import Web3 from 'web3'
import { Chain, Common } from '@ethereumjs/common'
import { Transaction, TxData } from '@ethereumjs/tx'
import { RLP } from '@ethereumjs/rlp'

import { ISC_SANDBOX_ABI } from '../abis'
import { signEthereumTransaction } from './ledger'

const RPC_ENDPOINT = 'https://json-rpc.evm.testnet.shimmer.network/v1/chains/rms1prwgvvw472spqusqeufvlmp8xdpyxtrnmvt26jnuk6sxdcq2hk8scku26h7/evm'
const TOKEN_CONTRACT_ADDRESS = '0x1074000000000000000000000000000000000000' // Magic Contract Address
const ORIGIN_ACCOUNT_ADDRESS = '0xF65e3cCbe04D4784EDa9CC4a33F84A6162aC9EB6'
const RECIPIENT_ACCOUNT_ADDRESS = '0xF7dA0Bf497dCa1B2E0C40B9E37731646CC60d549'

const AMOUNT = 10000000000000000 // 1DAI = 1000000000000000000
const ETH_AMOUNT = 0 // Since we don't want to transfer ETH

const TX_OPTIONS = { common: Common.custom({
    chainId: 1071,
})}

let provider: Web3

async function initializeProvider(): Promise<any> {
    provider = new Web3(RPC_ENDPOINT)
}

async function createTxData(): Promise<TxData> {
    const iscContract = new provider.eth.Contract(ISC_SANDBOX_ABI, TOKEN_CONTRACT_ADDRESS)


    const accountsCoreContract = 0x3c4b5e02
    const transferAllowanceTo = 0x23f4e3a1
    const parameters = getAgentBalanceParameters(RECIPIENT_ACCOUNT_ADDRESS)
    const allowance = {
        baseTokens: 1000000,
        nativeTokens: [],
        nfts: [],
    }

    const data = await iscContract.methods.call(accountsCoreContract, transferAllowanceTo, parameters, allowance).encodeABI()
    const nonce = provider.utils.toHex(await provider.eth.getTransactionCount(ORIGIN_ACCOUNT_ADDRESS))

    const _gasPrice = await provider.eth.getGasPrice()
    const gasPrice = '0x' + _gasPrice
    
    const estimatedGas = await provider.eth.estimateGas({ from: ORIGIN_ACCOUNT_ADDRESS, to: TOKEN_CONTRACT_ADDRESS, data })
    const gasLimit = provider.utils.toHex(2*estimatedGas) // Double to ensure we have enough gas

    const to = TOKEN_CONTRACT_ADDRESS
    const value = provider.utils.toHex(ETH_AMOUNT)

    return { nonce, gasPrice, gasLimit, to, value, data }
}

export function getAgentBalanceParameters(recipientAddress: string): {
    items: { key: Uint8Array; value: Uint8Array }[]
} {
    const value = hexToByteArray(recipientAddress) as unknown as Uint8Array
    return {
        items: [
            {
                key: Buffer.from('a'),
                value,
            },
        ],
    }
}

function hexToByteArray(hexString) {
    const byteArray = [3];
    
    for (let i = 2; i < hexString.length; i += 2) {
        const byte = parseInt(hexString.substr(i, 2), 16);
        byteArray.push(byte);
    }
    
    return byteArray;
}

async function createTxObject(txData: TxData): Promise<Transaction> {
    return Transaction.fromTxData(txData, TX_OPTIONS)
}

async function createTxObjectFromString(txString: string, signature): Promise<Transaction> {
    console.log('incoming', txString)
    const {v, r, s} = signature
    console.log('v', v)
    console.log('r', r)
    console.log('s', s)
    const substr = txString.substring(0, txString.length - 8)
    const noVrs =  substr + v.toString(16) + `a0${r}` + `a0${s}`
    console.log('novrs:', noVrs)
    return Transaction.fromSerializedTx(Buffer.from(noVrs, 'hex'), TX_OPTIONS)
}

async function run(): Promise<void> {
    try {
        // 0. Initialize the provider
        await initializeProvider()

        // 1. Get the unsigned transaction data
        const transactionData = await createTxData()
        const transactionObject = await createTxObject(transactionData)
        console.log('transaction', transactionObject.serialize().toString('hex'))

        // 2. Serialize message for ledger
        const message = transactionObject.getMessageToSign(false)
        const serializedMessage = Buffer.from(RLP.encode(message)).toString('hex')

        // 3. Sign the data using Ledger
        const signature = await signEthereumTransaction(serializedMessage)

        // 4. Send the transaction
        const signedObject = await createTxObject({ ...transactionData, v: '0x' + signature.v, r: '0x' + signature.r, s: '0x' + signature.s })
        const serializedTransaction = Buffer.from(RLP.encode(signedObject.raw()))
        console.log('expected:', serializedTransaction.toString('hex'))
        const txData = await createTxObjectFromString(serializedMessage, signature)
        
        const stringifiedTransaction = '0x' + serializedTransaction.toString('hex')
        // const tx = await provider.eth.sendSignedTransaction(stringifiedTransaction)
        // const expected = Transaction.fromSerializedTx(serializedTransaction, TX_OPTIONS)
    } catch (err) {
        console.error(err)
    }
}

void run()