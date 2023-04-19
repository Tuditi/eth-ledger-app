// Modules to control application life and create native browser window
const TransportNodeHid = require("@ledgerhq/hw-transport-node-hid").default;
const AppEth = require("@ledgerhq/hw-app-eth").default;
const { listen } = require("@ledgerhq/logs");


const { app, BrowserWindow, ipcMain } = require("electron");

// This a very basic example
// Ideally you should not run this code in main thread
// but run it in a dedicated node.js process
async function getEthereumInfo(verify) {
    try {
      console.log("Dir", __dirname)
        const transport = await TransportNodeHid.open("")
      listen(log => console.log(log))
    //   console.error("transport", transport)
      const appEth = new AppEth(transport);
        
      const config = await appEth.getAppConfiguration();
      console.log(config);
      const address = await appEth.getAddress("44'/60'/0'/0/0", true, false)
      return address
    } catch(e) {
      console.warn(e);
      // try again until success!
      return new Promise(s => setTimeout(s, 1000)).then(() =>
        getEthereumInfo(verify)
      );
    };
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
    }
})

  // and load the index.html of the app.
  mainWindow.loadFile("index.html");

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on("closed", function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  // ~~~ BASIC LEDGER EXAMPLE ~~~

  ipcMain.on("requestEthereumInfo", () => {
    getEthereumInfo(false).then(result => {
      mainWindow.webContents.send("ethereumInfo", result);
    });
  });

  ipcMain.on("verifyEthereumInfo", () => {
    getEthereumInfo(true);
  });

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", function() {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function() {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.