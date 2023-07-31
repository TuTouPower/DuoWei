const fs = require('fs');
const path = require('path');
const find = require('find-process');

let weChatRunningProcessCount = 0;

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

exports.checkExecutableFile = (appPath) => {
    const executableFilePath = path.join(appPath, 'Contents', 'MacOS', 'WeChat');
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

exports.checkWeChatProcess = async (mainWindow) => {
    const binPath = '/Applications/WeChat.app/Contents/MacOS/WeChat';
    const cmdPath = '/Applications/WeChat.app/Contents/MacOS/WeChat';

    const list = await find('name', 'WeChat', true);
    const specificProcessList = list.filter(proc => proc.bin === binPath && proc.cmd === cmdPath);
    console.log('Specific process list:', specificProcessList);
    const nowWeChatRunningProcessCount = specificProcessList.length;
    console.log('nowWeChatRunningProcessCount:', nowWeChatRunningProcessCount);

    // 如果 WeChat 的运行状态发生了变化，发送一个 IPC 事件到前端
    if (weChatRunningProcessCount !== nowWeChatRunningProcessCount) {
        weChatRunningProcessCount = nowWeChatRunningProcessCount;
        mainWindow.webContents.send('wechat-status', weChatRunningProcessCount);
    }
}

