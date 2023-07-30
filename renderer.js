const { ipcRenderer } = require('electron');
const runCommandButton = document.getElementById('runCommandButton');
const settingsButton = document.getElementById('settingsButton');
const weChatCountInput = document.getElementById('wechatCount');
const weChatPathInput = document.getElementById('wechatPath');

window.addEventListener('DOMContentLoaded', () => {
    ipcRenderer.on('wechat-path', (event, path) => {
        weChatPathInput.value = path;
    });

    ipcRenderer.send('get-wechat-path');

    weChatPathInput.addEventListener('change', () => {
        ipcRenderer.send('set-wechat-path', weChatPathInput.value);
    });

    runCommandButton.addEventListener('click', () => {
        ipcRenderer.send('run-command', weChatCountInput.value);
    });

    settingsButton.addEventListener('click', () => {
        ipcRenderer.send('open-settings');
    });
});
