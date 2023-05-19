const electron = require("electron");
const { ipcRenderer } = electron;
document.getElementById("main").innerHTML =
    "<h1>Connect your Nano and open Bitcoin app...</h1>";
ipcRenderer.on("ethereumInfo", (event, arg) => {
    const h1 = document.createElement("h2");
    h1.textContent = JSON.stringify(arg);
    document.getElementById("main").innerHTML =
        "<h1>Your first Ethereum address:</h1>";
    document.getElementById("main").appendChild(h1);
    ipcRenderer.send("verifyEthereumInfo");
});
ipcRenderer.send("requestEthereumInfo");
