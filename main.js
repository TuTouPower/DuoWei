const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { findWeChatApp, selectWeChatApp, checkWeChatStatus } = require('./utils.js');
const { exec } = require('child_process');
const Store = require('electron-store');

// 在这里声明全局变量
let mainWindow;
let settingsWindow;
let weChatAppPath;
let weChatOpenCount = 1;
const store = new Store();

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

    // 优先从 store 中获取 weChatAppPath，没成功的话再调用 findWeChatApp
    weChatAppPath = store.get('wechatAppPath');
    weChatAppPath = weChatAppPath || await findWeChatApp();
    weChatOpenCount = store.get('wechatOpenCount', 1);
    
    createMainWindow();

    // 必须这样写前几次执行的才快，不知道为什么
    let count = 0;
    const limit = 2;
    const intervalId = setInterval( async () => {
        await checkWeChatStatus(mainWindow, weChatAppPath);
        count += 1;
        if (count === limit) {
            clearInterval(intervalId); // 清除定时器，停止执行
        }
    }, 10);

    // 每隔一秒执行一次
    setInterval(async () => {
        try {
            await checkWeChatStatus(mainWindow, weChatAppPath);
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

app.on('before-quit', function () {
    // 存储用户配置
    store.set('wechatAppPath', weChatAppPath)
    store.set('wechatOpenCount', weChatOpenCount)
});

ipcMain.on('not-run-command', (event, weChatStatusText) => {
    console.log('weChatStatusText:', weChatStatusText);
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Can not run now',
        message: `${weChatStatusText}`,
        buttons: ['OK'],
    });
});

ipcMain.on('run-command', (event, count, weChatAppPath) => {
    let runWeChatShell = `nohup ${weChatAppPath}/Contents/MacOS/WeChat > /dev/null 2>&1 &`;

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
    weChatAppPath = await selectWeChatApp(dialog, mainWindow);
    checkWeChatStatus(mainWindow, weChatAppPath);
});

ipcMain.on('open-settings', (event) => {
    createSettingsWindow();
});

ipcMain.on('get-wechat-path', (event) => {
    event.reply('wechat-path', weChatAppPath);
});

ipcMain.on('wechat-open-count', (event, newCount) => {
    weChatOpenCount = newCount;
});

ipcMain.on('set-wechat-path', (event, newPath) => {
    weChatAppPath = newPath;
});
