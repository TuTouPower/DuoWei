const { ipcRenderer } = require('electron');
const runCommandButton = document.getElementById('runCommandButton');
const settingsButton = document.getElementById('settingsButton');
const setWeChatPathButton = document.getElementById('setWeChatPath');
const weChatAppPathInput = document.getElementById('wechatPath');
const weChatCountInput = document.getElementById('wechatCount');
const weChatStatusText = document.getElementById('wechat-status');

// 1+ 运行中的进程数
// 0 未运行
// -1 weChatAppPath 不存在
// -2 未在 weChatAppPath 下找到可执行文件
// -10000 未知错误
let weChatStatus = -10000;

function updateWeChatStatus(status) {
    weChatStatus = status;
    let statusText = '';
    let buttonColor = '';

    switch (weChatStatus) {
        case 0:
            statusText = 'Please enter the number of WeChat to open and click the Run button.';
            buttonColor = '#007BFF';
            break;
        case -1:
            statusText = 'WeChat path is empty. Please set it.';
            buttonColor = 'gray';
            break;
        case -2:
            statusText = 'Do not find executable file in the selected WeChat path. Please set right path.';
            buttonColor = 'gray';
            break;
        default:
            statusText = `${weChatStatus} WeChat is running, please exit WeChat and then open WeChat more.`;
            buttonColor = 'gray';
    }

    weChatStatusText.textContent = statusText;
    runCommandButton.style.background = buttonColor;
}

window.addEventListener('DOMContentLoaded', () => {
    ipcRenderer.on('wechat-path', (event, path) => {
        weChatAppPathInput.value = path;
    });

    // createMainWindow() 的时候这个传递 weChatAppPath
    ipcRenderer.send('get-wechat-path');

    ipcRenderer.on('wechat-status', (event, status) => {
        updateWeChatStatus(status);
    });

    weChatAppPathInput.addEventListener('change', () => {
        ipcRenderer.send('wechat-path-changed', weChatAppPathInput.value);
    });

    weChatCountInput.addEventListener('change', () => {
        ipcRenderer.send('wechat-open-count-changed', weChatCountInput.value);
    });

    setWeChatPathButton.addEventListener('click', () => {
        ipcRenderer.send('set-wechat-path-clicked');
    });

    runCommandButton.addEventListener('click', () => {
        if (weChatStatus !== 0 ) {
            ipcRenderer.send('not-run-command', weChatStatusText.textContent);
        } else {
            ipcRenderer.send('run-command', weChatCountInput.value, weChatAppPathInput.value);
        }
    });

    settingsButton.addEventListener('click', () => {
        ipcRenderer.send('open-settings');
    });
});
