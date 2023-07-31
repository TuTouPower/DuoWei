const { ipcRenderer } = require('electron');
const i18next = require('i18next');
const Backend = require('i18next-fs-backend');

const runCommandButton = document.getElementById('runCommandButton');
const settingsButton = document.getElementById('settingsButton');
const selectWeChatPathButton = document.getElementById('selectWeChatPath');
const weChatAppPathInput = document.getElementById('weChatPath');
const weChatOpenCountInput = document.getElementById('weChatOpenCount');
const weChatStatusText = document.getElementById('wechat-status');

i18next
    .use(Backend)
    .init({
        lng: 'zh', // 默认语言
        fallbackLng: 'en', // 如果当前语言的翻译不存在，将使用此备用语言
        backend: {
            loadPath: __dirname + '/locales/{{lng}}/translation.json'
        }
    });

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
    console.log('weChatStatus:', weChatStatus);
    switch (weChatStatus) {
        case 0:
            statusText = i18next.t('status_0');
            buttonColor = '#007BFF';
            break;
        case -1:
            statusText = i18next.t('status_1');
            buttonColor = 'gray';
            break;
        case -2:
            statusText = i18next.t('status_2');
            buttonColor = 'gray';
            break;
        default:
            statusText = `${weChatStatus} ` + i18next.t('status_3');
            buttonColor = 'gray';
    }

    console.log('statusText:', statusText);
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

    weChatOpenCountInput.addEventListener('change', () => {
        ipcRenderer.send('wechat-open-count-changed', weChatOpenCountInput.value);
    });

    selectWeChatPathButton.addEventListener('click', () => {
        ipcRenderer.send('set-wechat-path-clicked');
    });

    runCommandButton.addEventListener('click', () => {
        if (weChatStatus !== 0 ) {
            ipcRenderer.send('not-run-command', weChatStatusText.textContent);
        } else {
            ipcRenderer.send('run-command', weChatOpenCountInput.value, weChatAppPathInput.value);
        }
    });

    settingsButton.addEventListener('click', () => {
        ipcRenderer.send('open-settings');
    });
});
