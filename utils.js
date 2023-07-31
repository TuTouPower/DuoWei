const fs = require('fs');
const path = require('path');
const find = require('find-process');

// -1 未在 WeChatPath 下找到可执行文件
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

function checkExecutableFile (weChatPath) {
    const executableFilePath = path.join(weChatPath, 'Contents', 'MacOS', 'WeChat');
    try {
        return fs.existsSync(executableFilePath);
    } catch (err) {
        console.error(err);
    }
    return false;
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
            const appPath = result.filePaths[0];
            return appPath;
        }
    } catch (err) {
        console.error(err);
    }
    return null;
};

// TODO: weChatPath
exports.checkWeChatStatus = async (mainWindow, weChatPath) => {
    if (!checkExecutableFile(weChatPath)) {
        weChatStatus = -1;
        mainWindow.webContents.send('wechat-status', weChatStatus);
    } else {
        const binPath = path.join(weChatPath, 'Contents', 'MacOS', 'WeChat');

        const list = await find('name', 'WeChat', true);
        const specificProcessList = list.filter(proc => proc.bin === binPath);
        const WeChatRunningProcessCount = specificProcessList.length;

        // 如果 WeChat 的运行状态发生了变化，发送一个 IPC 事件到前端
        if (weChatStatus !== WeChatRunningProcessCount) {
            weChatStatus = WeChatRunningProcessCount;
            mainWindow.webContents.send('wechat-status', weChatStatus);
        }
    }
}

