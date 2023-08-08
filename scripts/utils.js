const fs = require('fs');
const path = require('path');
const find = require('find-process');
const axios = require('axios');
const {shell} = require('electron');
const { initI18n, i18n } = require('./i18nConfig.js');
const os = require('os');

function initI18nUtil() {
    initI18n((err, t) => {
        if (err) {
            console.log(t('initI18n_error_message'));
            console.log('initI18n went wrong loading', err);
        }
    });
}

function getAppInstallPaths() {
    let appInstallPaths = [];
    if (os.platform() === 'darwin') {
        appInstallPaths = ['/Applications'];
    } else if (os.platform() === 'win32') {
        const driveLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        for (let letter of driveLetters) {
            const drivePath = `${letter}:\\`;
            if (fs.existsSync(drivePath)) {
                appInstallPaths.push(path.join(drivePath, 'Program Files'));
                appInstallPaths.push(path.join(drivePath, 'Program Files (x86)'));
            }
        }
    } else {
        throw new Error('Unsupported platform');
    }
    return appInstallPaths;
}

function findFileInDirectory(directory, filename) {
    const files = fs.readdirSync(directory);
    for (let file of files) {
        if (file.toLowerCase() === filename.toLowerCase()) {
            return path.join(directory, file);
        }
    }
    return null;
}

function findWeChatInAppInstallPath(appInstallPath) {
    if (os.platform() === 'darwin') {
        return findFileInDirectory(appInstallPath, 'wechat.app');
    } else if (os.platform() === 'win32') {
        const tencentPath = findFileInDirectory(appInstallPath, 'tencent');
        if (tencentPath) {
            const weChatPath = findFileInDirectory(tencentPath, 'wechat');
            if (weChatPath) {
                return findFileInDirectory(weChatPath, 'wechat.exe');
            }
        } else {
            const weChatPath = findFileInDirectory(appInstallPath, 'wechat');
            if (weChatPath) {
                return findFileInDirectory(weChatPath, 'wechat.exe');
            }
        }
    } else {
        throw new Error('Unsupported platform');
    }
    return null;
}

async function findWeChatAppPath() {
    const appInstallPaths = getAppInstallPaths();

    for (let appInstallPath of appInstallPaths) {
        if (fs.existsSync(appInstallPath)) {
            const weChatAppPath = findWeChatInAppInstallPath(appInstallPath);
            if (weChatAppPath) {
                return weChatAppPath;
            }
        }
    }
    return null;
}

async function selectWeChatAppThroughDialog(dialog, mainWindow) {
    let dialogOptions;

    const platformOptions = {
        'darwin': {
            title: 'Select WeChat App',
            properties: ['openFile'],
            defaultPath: '/Applications',
            filters: [{ name: 'Applications', extensions: ['app'] }]
        },
        'win32': {
            title: 'Select WeChat Exe',
            properties: ['openFile'],
            defaultPath: 'C:\\Program Files',
            filters: [{ name: 'Executable File', extensions: ['exe'] }]
        }
    };
    
    const currentPlatform = os.platform();
    if (platformOptions[currentPlatform]) {
        dialogOptions = platformOptions[currentPlatform];
    } else {
        throw new Error('Unsupported platform');
    }

    try {
        const result = await dialog.showOpenDialog(mainWindow, dialogOptions);
        if (!result.canceled) {
            const weChatAppPath = result.filePaths[0];
            return weChatAppPath;
        } else {
            console.log('User canceled the dialog');
            return null;
        }
    } catch (err) {
        console.error(err);
        throw err;
    }
};

function isWeChatAppDirectoryValid(weChatAppPath) {
    return !!weChatAppPath;
};

function findCaseInsensitiveMatch(dir, filename) {
    const files = fs.readdirSync(dir);
    for (let file of files) {
        if (file.toLowerCase() === filename.toLowerCase()) {
            return file;
        }
    }
    return null;
}

function getWeChatExecutableFilePath(weChatAppPath) {
    if (os.platform() === 'darwin') {
        const contentsDir = findCaseInsensitiveMatch(weChatAppPath, 'Contents');
        if (!contentsDir) return null;

        const macOSDir = findCaseInsensitiveMatch(path.join(weChatAppPath, contentsDir), 'MacOS');
        if (!macOSDir) return null;

        const weChatFile = findCaseInsensitiveMatch(path.join(weChatAppPath, contentsDir, macOSDir), 'WeChat');
        if (!weChatFile) return null;

        return path.join(weChatAppPath, contentsDir, macOSDir, weChatFile);
    } else if (os.platform() === 'win32') {
        return weChatAppPath;
    } else {
        console.error(err);
        throw new Error('Unsupported platform');
    }
}

function isWeChatExecutableFileValid(weChatAppPath) {
    const binPath = getWeChatExecutableFilePath(weChatAppPath);
    if (!binPath) return false;

    try {
        return fs.existsSync(binPath);
    } catch (err) {
        console.error(err);
        throw err;
    }
}

async function checkWeChatStatus(weChatAppPath) {
    // 1+ 运行中的进程数
    // 0 未运行
    // -1 weChatAppPath 不存在
    // -2 未在 weChatAppPath 下找到可执行文件
    // -10000 初始值
    let weChatStatus;

    if (os.platform() === 'darwin' && !isWeChatAppDirectoryValid(weChatAppPath)) {
        weChatAppPath = '';
        weChatStatus = -1;
    } else if (!isWeChatExecutableFileValid(weChatAppPath)) {
        weChatStatus = -2;
    } else {
        const list = await find('name', 'WeChat', true);
        const specificProcessList = list.filter(proc => proc.bin.includes('WeChat.exe'));
        const WeChatRunningProcessCount = specificProcessList.length;
        weChatStatus = WeChatRunningProcessCount;
    }

    return {appPath: weChatAppPath, status: weChatStatus};
}

async function editWeChatPathAndStatus(mainWindow, weChatAppPath, weChatStatus) {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('wechat-status', weChatStatus);
        mainWindow.webContents.send('wechat-path', weChatAppPath);
    } else {
        console.error('mainWindow is destroyed');
    }
}

async function checkForUpdates(dialog, currentVersion) {
    console.log('Checking for updates...');
    console.log('Current version:', currentVersion);
    try {
        const response = await axios.get('http://www.baidu.com/duo-wei/check-for-updates', {  // 虚构的地址
            params: {
                currentVersion,
            },
        });
        console.log('Response:', response.data);
        if (response.data.hasUpdate) {
            console.log('Update available');
            const userConsent = dialog.showMessageBoxSync({
                type: 'question',
                buttons: [i18n.t('yes'), i18n.t('no') ],
                title: 'Confirm',
                message: i18n.t('update_available_message'),
            });
            console.log('User consent:', userConsent);
            if (userConsent === 0) {
                openUpdateLink(response.data.updateUrl);
            }
        } else {
            dialog.showMessageBox({
                title: 'No Updates',
                message: i18n.t('updates_not_available_message'),
            });
        }
    } catch (error) {
        console.error('Error checking for updates:', error);
        dialog.showMessageBox({
            title: 'Error',
            message: i18n.t('error_checking_updates_message'),
        });
    }
}

function openUpdateLink(url) {
    shell.openExternal(url).catch(error => {
        console.error('Error opening update URL:', error);
    });
}

module.exports = {
    findWeChatAppPath,
    selectWeChatAppThroughDialog,
    getWeChatExecutableFilePath,
    checkWeChatStatus,
    editWeChatPathAndStatus,
    checkForUpdates,
    initI18nUtil,
    os,
    i18n,
    path,
}
