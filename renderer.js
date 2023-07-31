const { ipcRenderer } = require('electron');
const runCommandButton = document.getElementById('runCommandButton');
const settingsButton = document.getElementById('settingsButton');
const setWeChatPathButton = document.getElementById('setWeChatPath');
const weChatCountInput = document.getElementById('wechatCount');
const weChatPathInput = document.getElementById('wechatPath');
const weChatStatusText = document.getElementById('wechat-status');

let weChatStatus = -10000; 

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
        if (weChatStatus !== 0 ) {
            runCommandButton.style.background = 'gray';
            ipcRenderer.send('not-run-command', weChatStatusText.textContent);
        } else {
            ipcRenderer.send('run-command', weChatCountInput.value, weChatPathInput.value);
        }
    });    

    settingsButton.addEventListener('click', () => {
        ipcRenderer.send('open-settings');
    });

    setWeChatPathButton.addEventListener('click', () => {
        ipcRenderer.send('set-wechat-path-clicked');
    });

    ipcRenderer.on('wechat-status', (event, status) => {
        weChatStatus = status
        if (weChatStatus < 0 ){
            weChatStatusText.textContent = 'Do not find WeChat executable file in the selected path. Please select again';
            runCommandButton.style.background = 'gray';
        } else if (weChatStatus == 0 ){
            weChatStatusText.textContent = 'WeChat is not running';
            runCommandButton.style.background = '#007BFF';
        } else {
            weChatStatusText.textContent =
                    `${weChatStatus} WeChat is running, please exit WeChat and then open WeChat more`;
            runCommandButton.style.background = 'gray';
        }
    });
    
});
