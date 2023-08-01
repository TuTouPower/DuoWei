const fs = require('fs');
const path = require('path');
const find = require('find-process');

async function findWeChatAppPath() {
    const applicationsPath = '/Applications';
    try {
        const files = fs.readdirSync(applicationsPath);
        for (let file of files) {
            if (file.toLowerCase().startsWith('wechat.app')) {
                return path.join(applicationsPath, file);
            }
        }
    } catch (err) {
        console.error(err);
        throw err;
    }
    return null;
};

async function selectWeChatAppThroughDialog(dialog, mainWindow) {
    try {
        const result = await dialog.showOpenDialog(mainWindow, {
            title: 'Select WeChat App',
            properties: ['openFile'],
            defaultPath: '/Applications',
            filters: [{ name: 'Applications', extensions: ['app'] }]
        });
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

function isWeChatExecutableFileValid(weChatAppPath) {
    const executableFilePath = path.join(weChatAppPath, 'Contents', 'MacOS', 'WeChat');
    try {
        return fs.existsSync(executableFilePath);
    } catch (err) {
        console.error(err);
        throw err;
    }
};

async function checkWeChatStatus(weChatAppPath) {
    // 1+ 运行中的进程数
    // 0 未运行
    // -1 weChatAppPath 不存在
    // -2 未在 weChatAppPath 下找到可执行文件
    // -10000 初始值
    let weChatStatus;

    if (!isWeChatAppDirectoryValid(weChatAppPath)) {
        weChatAppPath = '';
        weChatStatus = -1;
    } else if (!isWeChatExecutableFileValid(weChatAppPath)) {
        weChatStatus = -2;
    } else {
        const binPath = path.join(weChatAppPath, 'Contents', 'MacOS', 'WeChat');
        const list = await find('name', 'WeChat', true);
        const specificProcessList = list.filter(proc => proc.bin === binPath);
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

module.exports = {
    findWeChatAppPath,
    selectWeChatAppThroughDialog,
    checkWeChatStatus,
    editWeChatPathAndStatus
}
