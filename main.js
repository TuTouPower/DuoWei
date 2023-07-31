const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { findWeChatAppPath, selectWeChatAppThroughDialog, checkWeChatStatus } = require('./utils.js');
const { exec } = require('child_process');
const Store = require('electron-store');
const i18next = require('i18next');
const Backend = require('i18next-fs-backend');

i18next
    .use(Backend)
    .init({
        lng: 'zh', // 默认语言
        fallbackLng: 'en', // 如果当前语言的翻译不存在，将使用此备用语言
        backend: {
            loadPath: __dirname + '/locales/{{lng}}/translation.json'
        }
    });

let mainWindow;
let settingsWindow;
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
        }
    });

    // window.webContents.openDevTools();
    window.loadFile(config.htmlFile);

    return window;
}

function createMainWindow () {
    mainWindow = createWindow({width: 600, height: 400, htmlFile: 'index.html'});
}

function createSettingsWindow () {
    settingsWindow = createWindow({width: 300, height: 200, htmlFile: 'settings.html'});
}

app.whenReady().then(async () => {
    // Prioritize getting weChatAppPath from store, if unsuccessful then call findWeChatAppPath
    weChatAppPath = store.get('wechatAppPath') || await findWeChatAppPath();
    weChatOpenCount = store.get('wechatOpenCount', 1);

    createMainWindow();

    // Wrap checkWeChatStatus in a function for recursion
    const checkWeChatStatusRepeatedly = async () => {
        try {
            await checkWeChatStatus(mainWindow, weChatAppPath);
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
    weChatAppPath = await selectWeChatAppThroughDialog(dialog, mainWindow);
    checkWeChatStatus(mainWindow, weChatAppPath);
});

ipcMain.on('open-settings', (event) => {
    createSettingsWindow();
});

ipcMain.on('get-wechat-path', (event) => {
    event.reply('wechat-path', weChatAppPath);
});

ipcMain.on('wechat-open-count-changed', (event, newCount) => {
    weChatOpenCount = newCount;
});

ipcMain.on('wechat-path-changed', (event, newPath) => {
    weChatAppPath = newPath;
});
