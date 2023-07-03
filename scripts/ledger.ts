const TransportNodeHid = require("@ledgerhq/hw-transport-node-hid").default;
const AppEth = require("@ledgerhq/hw-app-eth").default;
const { listen } = require("@ledgerhq/logs");

export async function getEthereumInfo(verify): Promise<string> {
    try {
        console.log("Dir", __dirname)
            const transport = await TransportNodeHid.open("")
        // listen(log => console.log(log))
        //   console.error("transport", transport)
        const appEth = new AppEth(transport);
            
        const config = await appEth.getAppConfiguration();
        console.log(config);
        const address = await appEth.getAddress("44'/60'/0'/0/0", true, false)
        return address
    } catch(err) {
        console.warn(err);
        // try again until success!
        return new Promise(s => setTimeout(s, 1000)).then(() =>
            getEthereumInfo(verify)
        );
    };
}

export async function signEthereumTransaction(rawTransaction: string): Promise<any> {
    try {
        const transport = await TransportNodeHid.open("")
        listen(log => console.log(log))
        //   console.error("transport", transport)
        const appEth = new AppEth(transport);
        
        // raw tx = 
        // f86b01860896367830008301944694b4fbf271143f4fbf7b91a5ded31805e42b2208d680b844a9059cbb000000000000000000000000cbcd6d8659ed1998a452335ae53904dc0af1c99b000000000000000000000000000000000000000000000000002386f26fc10000058080'
        const signature = await appEth.signTransaction("44'/60'/0'/0/0", rawTransaction, false)
        return signature
    } catch(err) {
        console.error(err)
    }
}
