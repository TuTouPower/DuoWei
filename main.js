const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { findWeChatApp, checkExecutableFile, selectWeChatApp, checkWeChatProcess } = require('./utils.js');
const { exec } = require('child_process');

// 在这里声明全局变量
let mainWindow;
let settingsWindow;
let weChatPath;

function createMainWindow () {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    // 开发者工具
    // mainWindow.webContents.openDevTools();

    mainWindow.loadFile('index.html');
}

function createSettingsWindow () {
    settingsWindow = new BrowserWindow({
        width: 400,
        height: 300,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    settingsWindow.loadFile('settings.html');
}

app.whenReady().then(async () => {

    weChatPath = await findWeChatApp();

    createMainWindow();

    if (!weChatPath) {
        const response = await dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'WeChat not found',
            message: 'WeChat app is not found, please select the path in the following dialog.',
            buttons: ['Choose Now', 'Choose later'],
            defaultId: 0,
            cancelId: 1,
        });

        if (response.response === 0) { // 如果用户选择 "Choose Now"
            weChatPath = await selectWeChatApp(dialog, mainWindow);
            mainWindow.webContents.send('wechat-path', weChatPath);
            if (!checkExecutableFile(weChatPath)) {
                dialog.showErrorBox('Error', 
                        `The selected wechat app does not contain the executable file. ${weChatPath}/Contents/MacOS/WeChat`);
            }
        }
    } else {
        mainWindow.webContents.send('wechat-path', weChatPath);
        if (!checkExecutableFile(weChatPath)) {
            dialog.showErrorBox('Error', 
                    `The selected wechat app does not contain the executable file. ${weChatPath}/Contents/MacOS/WeChat`);
        }
    }

    setInterval(async () => {
        try {
            await checkWeChatProcess(mainWindow, weChatPath);
        } catch (error) {
            console.error('Error in checking WeChat process:', error);
        }
    }, 1000);    

});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});

ipcMain.on('run-command', (event, count, weChatPath) => {
    let runWeChatShell = `nohup ${weChatPath}/Contents/MacOS/WeChat > /dev/null 2>&1 &`;

    // 执行指定次数的命令
    for (let i = 0; i < count; i++) {
        exec(runWeChatShell, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
        });
    }
});

ipcMain.on('set-wechat-path-clicked', async (event) => {
    weChatPath = await selectWeChatApp(dialog, mainWindow);
    mainWindow.webContents.send('wechat-path', weChatPath);
    if (!checkExecutableFile(weChatPath)) {
        dialog.showErrorBox('Error', 
                `The selected wechat app does not contain the executable file. ${weChatPath}/Contents/MacOS/WeChat`);
    }
});

ipcMain.on('open-settings', (event) => {
    createSettingsWindow();
});

ipcMain.on('get-wechat-path', (event) => {
    event.reply('wechat-path', weChatPath);
});

ipcMain.on('set-wechat-path', (event, newPath) => {
    weChatPath = newPath;
});
