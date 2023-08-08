const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { findWeChatAppPath, selectWeChatAppThroughDialog, getWeChatExecutableFilePath, checkWeChatStatus, editWeChatPathAndStatus, checkForUpdates, initI18nUtil , os, i18n, path} = require('./scripts/utils.js');
const { spawn } = require('child_process');
const fs = require('fs');
const Store = require('electron-store');

let mainWindow;
let settingsWindow;
let contactUsWindow;

// mac .app 路径
// windows .exe 路径
let weChatAppPath;
let weChatOpenCount = 2;
const store = new Store();

function createWindow(config) {
    const window = new BrowserWindow({
        width: config.width,
        height: config.height,
        icon: './assets/logos/duo_wei_logo.ico',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        show: false  // 先不显示窗口
    });

    window.setMenu(null) // 移除默认菜单
    window.loadFile(config.htmlFile);

    window.once('ready-to-show', () => {
        window.show();
        // window.webContents.openDevTools({ mode: 'detach' });
    });

    return window;
}

function createMainWindow () {
    mainWindow = createWindow({width: 520, height: 300, htmlFile: './pages/index.html'});
}

function createSettingsWindow () {
    settingsWindow = createWindow({width: 300, height: 200, htmlFile: './pages/settings.html'});
}

function createContactUsWindow () {
    contactUsWindow = createWindow({width: 400, height: 300, htmlFile: './pages/contact_us.html'});
}

app.whenReady().then(async () => {
    // Prioritize getting weChatAppPath from store, if unsuccessful then call findWeChatAppPath
    weChatAppPath = store.get('wechatAppPath') || await findWeChatAppPath();
    weChatOpenCount = store.get('wechatOpenCount', 1);

    initI18nUtil();

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
    let binPath = getWeChatExecutableFilePath(weChatAppPath);
    let command;
    let args;

    if (os.platform() === 'darwin') {
        // command = `nohup "${binPath}" > /dev/null 2>&1 &`;
        command = `nohup`;
        args = [`"${binPath}"`, '> /dev/null', '2>&1 &'];
    } else if (os.platform() === 'win32') {
        // 创建批处理文件
        const batPath = path.join(__dirname, 'run.bat');
        console.log('batPath:', batPath);

        console.log('binPath:', binPath);
        binPath = `"${binPath}"`.replace(/^"([A-Za-z]:)(\\)(.*)$/, '$1"$2$3"');
        console.log('binPath:', binPath);

        fs.writeFileSync(batPath, `"${binPath}"\nexit\n`);
        command = 'start';
        args = ['/b', '""', `"${batPath}"`];
    } else {
        throw new Error('Unsupported platform');
    }

    let promises = [];

    for (let i = 0; i < count; i++) {
        let promise = new Promise((resolve, reject) => {
            console.log('Running command:', command);
            console.log('Running args:', args);
            const child = spawn(command, args, {detached: true, shell: true});
            child.on('error', (error) => {
                console.error('Error in running command:', error);
                reject(error);
            });
            child.unref();
            resolve();
        });
        console.log(`Run command ${i + 1} times`);
        promises.push(promise);
    }
    console.log(`Run command ${count} times in total`);

    // 等待所有 promise 完成
    Promise.all(promises)
    .then(() => {
        console.log('All commands have been executed successfully');
        dialog.showMessageBox({
            message: i18n.t('success_message'),
            buttons: [i18n.t('ok')]
        }).then(() => {
            console.log('App Quit');
            app.quit();
        });
    })
    .catch((error) => {
        console.error('Error in executing commands:', error);
        dialog.showErrorBox('Error', `${error.message} ` + i18n.t('error_message'));
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
