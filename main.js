const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { findWeChatAppPath, selectWeChatAppThroughDialog, checkWeChatStatus, editWeChatPathAndStatus, checkForUpdates } = require('./utils.js');
const { exec } = require('child_process');
const Store = require('electron-store');
const i18next = require('./i18nConfig.js');

let mainWindow;
let settingsWindow;
let contactUsWindow;
let weChatAppPath;
let weChatOpenCount = 1;
const store = new Store();

function createWindow(config) {
    const window = new BrowserWindow({
        width: config.width,
        height: config.height,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        show: false  // 先不显示窗口
    });

    window.loadFile(config.htmlFile);

    window.once('ready-to-show', () => {
        window.show();
        // window.webContents.openDevTools();
    });

    return window;
}

function createMainWindow () {
    mainWindow = createWindow({width: 520, height: 300, htmlFile: 'index.html'});
}

function createSettingsWindow () {
    settingsWindow = createWindow({width: 300, height: 200, htmlFile: 'settings.html'});
}

function createContactUsWindow () {
    contactUsWindow = createWindow({width: 300, height: 200, htmlFile: 'contact_us.html'});
}

app.whenReady().then(async () => {
    // Prioritize getting weChatAppPath from store, if unsuccessful then call findWeChatAppPath
    weChatAppPath = store.get('wechatAppPath') || await findWeChatAppPath();
    weChatOpenCount = store.get('wechatOpenCount', 1);

    createMainWindow();

    // Wrap checkWeChatStatus in a function for recursion
    const checkWeChatStatusRepeatedly = async () => {
        try {
            let result = await checkWeChatStatus(weChatAppPath);
            editWeChatPathAndStatus(mainWindow, result.appPath, result.status);
        } catch (error) {
            console.error('Error in checking WeChat process:', error);
        }
        // Repeat checking after 1 second
        setTimeout(checkWeChatStatusRepeatedly, 1000);
    };

    // Run the recursive function
    checkWeChatStatusRepeatedly();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});

app.on('before-quit', () => {
    // Save user settings
    store.set('wechatAppPath', weChatAppPath);
    store.set('wechatOpenCount', weChatOpenCount);
});

ipcMain.on('not-run-command', (event, weChatStatus) => {
    console.log('weChatStatus:', weChatStatus);
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Can not run now',
        message: `${weChatStatus}`,
        buttons: ['OK'],
    });
});

ipcMain.on('run-command', (event, count, weChatAppPath) => {
    let runWeChatShell = `nohup ${weChatAppPath}/Contents/MacOS/WeChat > /dev/null 2>&1 &`;

    let promises = [];  // 存储所有的 promise

    // 执行指定次数的命令
    for (let i = 0; i < count; i++) {
        let promise = new Promise((resolve, reject) => {
            exec(runWeChatShell, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    reject(error);  // 如果有错误，reject 这个 promise
                } else {
                    console.log(`stdout: ${stdout}`);
                    console.error(`stderr: ${stderr}`);
                    resolve();  // 如果没有错误，resolve 这个 promise
                }
            });
        });
        promises.push(promise);
    }

    // 等待所有 promise 完成
    Promise.all(promises)
        .then(() => {
            // 如果所有命令都执行成功，弹出对话框并退出程序
            dialog.showMessageBox({
                message: i18next.t('success_message'),
                buttons: [i18next.t('ok')]
            }).then(() => {
                app.quit();
            });
        })
        .catch((error) => {
            // 如果有命令执行失败，也弹出对话框
            dialog.showErrorBox('Error', `${error.message} ` + i18next.t('error_message'));
        });
});

async function handleSetWeChatPath() {
    let appPath = await selectWeChatAppThroughDialog(dialog, mainWindow);
    if (appPath !== null) {
        weChatAppPath = appPath;
        let result = await checkWeChatStatus(weChatAppPath);
        editWeChatPathAndStatus(mainWindow, result.appPath, result.status);
    }
}

ipcMain.on('set-wechat-path-clicked', (event) => {
    handleSetWeChatPath().catch(console.error);
});

ipcMain.on('open-settings', (event) => {
    createSettingsWindow();
});

ipcMain.on('check-updates', (event) => {
    let currentVersion = app.getVersion();
    checkForUpdates(dialog, currentVersion);
});

ipcMain.on('contact-us', (event) => {
    createContactUsWindow();
});

ipcMain.on('get-wechat-path', (event) => {
    event.reply('wechat-path', weChatAppPath);
});

ipcMain.on('wechat-count-changed', (event, newCount) => {
    weChatOpenCount = newCount;
});

ipcMain.on('wechat-path-changed', (event, newPath) => {
    weChatAppPath = newPath;
});
