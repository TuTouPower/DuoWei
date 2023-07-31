const fs = require('fs');
const path = require('path');
const find = require('find-process');


// -2 未在 weChatAppPath 下找到可执行文件
// -1 weChatAppPath 不存在
// 0 未运行
// 1+ 运行中的进程数
let weChatStatus = -10000;

exports.findWeChatApp = async () => {
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
    }
    return null;
};

exports.selectWeChatApp = async (dialog, mainWindow) => {
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
        }
    } catch (err) {
        console.error(err);
    }
    return null;
};

function checkWeChatAppDirectory (weChatAppPath) {
    return !!weChatAppPath;
};

function checkWeChatExecutableFile (weChatAppPath) {
    const executableFilePath = path.join(weChatAppPath, 'Contents', 'MacOS', 'WeChat');
    try {
        return fs.existsSync(executableFilePath);
    } catch (err) {
        console.error(err);
    }
    return false;
};

// TODO: weChatAppPath
exports.checkWeChatStatus = async (mainWindow, weChatAppPath) => {
    if (!checkWeChatAppDirectory(weChatAppPath)) {
        weChatAppPath = '';
        weChatStatus = -1;
    } else if (!checkWeChatExecutableFile(weChatAppPath)) {
        weChatStatus = -2;
    } else {
        const binPath = path.join(weChatAppPath, 'Contents', 'MacOS', 'WeChat');
        const list = await find('name', 'WeChat', true);
        const specificProcessList = list.filter(proc => proc.bin === binPath);
        const WeChatRunningProcessCount = specificProcessList.length;

        weChatStatus = WeChatRunningProcessCount;
    }
    mainWindow.webContents.send('wechat-status', weChatStatus);
    mainWindow.webContents.send('wechat-path', weChatAppPath);
}

