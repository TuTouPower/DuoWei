const fs = require('fs');
const path = require('path');

exports.findWeChatApp = async () => {
    const applicationsPath = '/Applications';
    try {
        const files = fs.readdirSync(applicationsPath);
        for (let file of files) {
            if (file.toLowerCase().startsWith('wechat123.app')) {
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
