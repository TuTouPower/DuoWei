const { ipcRenderer } = require('electron');
const runCommandButton = document.getElementById('runCommandButton');
const settingsButton = document.getElementById('settingsButton');
const setWeChatPathButton = document.getElementById('setWeChatPath');
const weChatCountInput = document.getElementById('wechatCount');
const weChatPathInput = document.getElementById('wechatPath');
const weChatStatusElement = document.getElementById('wechat-status');

window.addEventListener('DOMContentLoaded', () => {
    ipcRenderer.on('wechat-path', (event, path) => {
        weChatPathInput.value = path;
    });

    // createMainWindow() 的时候这个传递 weChatPath
    ipcRenderer.send('get-wechat-path');

    weChatPathInput.addEventListener('change', () => {
        ipcRenderer.send('set-wechat-path', weChatPathInput.value);
    });

    runCommandButton.addEventListener('click', () => {
        ipcRenderer.send('run-command', weChatCountInput.value, weChatPathInput.value);
    });    

    settingsButton.addEventListener('click', () => {
        ipcRenderer.send('open-settings');
    });

    setWeChatPathButton.addEventListener('click', () => {
        ipcRenderer.send('set-wechat-path-clicked');
    });

    ipcRenderer.on('wechat-status', (event, weChatRunningProcessCount) => {
        if (weChatRunningProcessCount == 0 ){
            weChatStatusElement.textContent = 'WeChat is not running';
        } else {
            weChatStatusElement.textContent =  `${weChatRunningProcessCount} WeChat is running;`;
        }
    });
    
});
