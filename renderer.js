const { ipcRenderer } = require('electron');
const runCommandButton = document.getElementById('runCommandButton');
const settingsButton = document.getElementById('settingsButton');
const setWeChatPathButton = document.getElementById('setWeChatPath');
const weChatCountInput = document.getElementById('wechatCount');
const weChatAppPathInput = document.getElementById('wechatPath');
const weChatStatusText = document.getElementById('wechat-status');

let weChatStatus = -10000; 

window.addEventListener('DOMContentLoaded', () => {
    ipcRenderer.on('wechat-path', (event, path) => {
        weChatAppPathInput.value = path;
    });

    // createMainWindow() 的时候这个传递 weChatAppPath
    ipcRenderer.send('get-wechat-path');

    ipcRenderer.on('wechat-status', (event, status) => {
        weChatStatus = status
        if (weChatStatus == 0 ){
            weChatStatusText.textContent = 'Please enter the number of WeChat to open and  click the run button';
            runCommandButton.style.background = '#007BFF';
        } else if (weChatStatus == -1 ){
            weChatStatusText.textContent = 'WeChat path is empty. Please set it';
            runCommandButton.style.background = 'gray';
        } else if (weChatStatus == -2 ){
            weChatStatusText.textContent =
                    'Do not find executable file in the selected WeChat path. Please set right path';
            runCommandButton.style.background = 'gray';
        } else {
            weChatStatusText.textContent =
                    `${weChatStatus} WeChat is running, please exit WeChat and then open WeChat more`;
            runCommandButton.style.background = 'gray';
        }
    });

    weChatAppPathInput.addEventListener('change', () => {
        ipcRenderer.send('set-wechat-path', weChatAppPathInput.value);
    });

    setWeChatPathButton.addEventListener('click', () => {
        ipcRenderer.send('set-wechat-path-clicked');
    });

    runCommandButton.addEventListener('click', () => {
        if (weChatStatus !== 0 ) {
            runCommandButton.style.background = 'gray';
            ipcRenderer.send('not-run-command', weChatStatusText.textContent);
        } else {
            ipcRenderer.send('run-command', weChatCountInput.value, weChatAppPathInput.value);
        }
    });    

    settingsButton.addEventListener('click', () => {
        ipcRenderer.send('open-settings');
    });
    
});
