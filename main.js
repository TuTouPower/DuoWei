const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

let mainWindow;
let settingsWindow;

function createMainWindow () {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

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

app.whenReady().then(() => {
    // 查找 WeChat 应用的路径
    const applicationsPath = '/Applications';
    weChatPath = null;
    fs.readdir(applicationsPath, (err, files) => {
        if (err) {
            console.error(err);
            return;
        }

        for (let file of files) {
            if (file.toLowerCase().startsWith('wechat123.app')) {
                weChatPath = path.join(applicationsPath, file, 'Contents', 'MacOS', 'WeChat');
                console.log(`weChatPath: ${weChatPath}`);
                break;
            }
        }

        // 创建主窗口
        createMainWindow();

        if (weChatPath == null) {
            weChatPath = 'Not Found WeChat.app, Please Set It In Settings';
            console.log(`weChatPath: ${weChatPath}`);
            dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'WeChat not found',
                message: 'WeChat app is not found, please select the path in the following dialog.',
                buttons: ['OK']
            }).then(() => {
                dialog.showOpenDialog(mainWindow, {
                    title: 'Select WeChat App',
                    properties: ['openFile'],
                    filters: [
                        { name: 'Applications', extensions: ['app'] }
                    ]
                }).then(result => {
                    if (!result.canceled) {
                        weChatPath = result.filePaths[0];
                        mainWindow.webContents.send('wechat-path', weChatPath);
                    }
                });
            });
        }
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});

ipcMain.on('run-command', (event, count) => {
    // 执行指定次数的命令
    for (let i = 0; i < count; i++) {
        exec('open -n /Applications/WeChat.app/Contents/MacOS/WeChat', (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
        });
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
