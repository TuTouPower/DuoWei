const { ipcRenderer } = require('electron');
const i18next = require('i18next');
const Backend = require('i18next-fs-backend');

const duoweiTitle = document.getElementById('title');
const duoweiHeadline = document.getElementById('headline');
const weChatStatusText = document.getElementById('wechat-status');
const weChatPathLabel = document.querySelector('label[for="wechat-path-input"]')
const weChatPathInput = document.getElementById('wechat-path-input');
const selectWeChatPathButton = document.getElementById('select-wechat-path-button');
const weChatCountLabel = document.querySelector('label[for="wechat-count-input"]')
const weChatCountInput = document.getElementById('wechat-count-input');
const runCommandButton = document.getElementById('run-command-button');
const settingsButton = document.getElementById('settings-button');

// 1+ 运行中的进程数
// 0 未运行
// -1 weChatAppPath 不存在
// -2 未在 weChatAppPath 下找到可执行文件
// -10000 初始值
let weChatStatus = -10000;

function updateWeChatStatus(status) {
    weChatStatus = status;
    let statusText = '';
    let buttonColor = 'gray';

    switch (weChatStatus) {
        case 0:
            statusText = i18next.t('wechat_status_0');
            buttonColor = '#007BFF';
            break;
        case -1:
            statusText = i18next.t('wechat_status_negative_1');
            break;
        case -2:
            statusText = i18next.t('wechat_status_negative_2');
            break;
        default:
            statusText = `${weChatStatus} ` + i18next.t('wechat_status_positive_num');
    }

    weChatStatusText.textContent = statusText;
    runCommandButton.style.background = buttonColor;
}

window.addEventListener('DOMContentLoaded', () => {
    i18next
        .use(Backend)
        .init({
            lng: 'zh',
            fallbackLng: 'en',
            backend: {
                loadPath: __dirname + '/locales/{{lng}}/translation.json'
            }
        }, function(err, t) {
            if (err) return console.log('something went wrong loading', err);
            
            // 在此回调函数中进行翻译，因为此时可以确保i18next已经初始化完成
            duoweiTitle.innerText = t('title');
            duoweiHeadline.innerText = t('headline');
            weChatStatusText.innerText = t('wechat_status_negative_10000');
            weChatPathLabel.innerText = t('wechat_path_label');
            selectWeChatPathButton.innerText = t('select_wechat_path_button');
            weChatCountLabel.innerText = t('wechat_count_label');
            runCommandButton.innerText = t('run_command_button');
            settingsButton.innerText = t('settings_button');
        });

    ipcRenderer.on('wechat-path', (event, path) => {
        weChatPathInput.value = path;
    });

    // createMainWindow() 的时候这个传递 weChatAppPath
    ipcRenderer.send('get-wechat-path');

    ipcRenderer.on('wechat-status', (event, status) => {
        updateWeChatStatus(status);
    });

    weChatPathInput.addEventListener('change', () => {
        ipcRenderer.send('wechat-path-changed', weChatPathInput.value);
    });

    weChatCountInput.addEventListener('change', () => {
        ipcRenderer.send('wechat-count-changed', weChatCountInput.value);
    });

    selectWeChatPathButton.addEventListener('click', () => {
        ipcRenderer.send('set-wechat-path-clicked');
    });

    runCommandButton.addEventListener('click', () => {
        if (weChatStatus !== 0 ) {
            ipcRenderer.send('not-run-command', weChatStatus.textContent);
        } else {
            ipcRenderer.send('run-command', weChatCountInput.value, weChatPathInput.value);
        }
    });

    settingsButton.addEventListener('click', () => {
        ipcRenderer.send('open-settings');
    });
});
