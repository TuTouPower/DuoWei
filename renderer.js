const { ipcRenderer } = require('electron');
const { initI18n, i18n } = require('../scripts/i18nConfig.js');

const duoweiTitle               =   document.getElementById('title');
const duoweiHeadline            =   document.getElementById('headline');
const weChatStatusText          =   document.getElementById('wechat-status');
const weChatPathLabel           =   document.querySelector('label[for="wechat-path-input"]')
const weChatPathInput           =   document.getElementById('wechat-path-input');
const selectWeChatPathButton    =   document.getElementById('select-wechat-path-button');
const weChatCountLabel          =   document.querySelector('label[for="wechat-count-input"]')
const weChatCountInput          =   document.getElementById('wechat-count-input');
const runCommandButton          =   document.getElementById('run-command-button');
const checkUpdatesButton        =   document.getElementById('check-updates-button');
const contactUsButton           =   document.getElementById('contact-us-button');

// 1+ 运行中的进程数
// 0 未运行
// -1 weChatAppPath 不存在
// -2 未在 weChatAppPath 下找到可执行文件
// -10000 初始值
let weChatStatus = -10000;

function activateButton(button) {
    button.classList.remove('button-inactive');
    button.classList.add('button-active');
}

function deactivateButton(button) {
    button.classList.remove('button-active');
    button.classList.add('button-inactive');
}

function updateWeChatStatus(status) {
    weChatStatus = status;
    let statusText = '';
    let statusColor = '';
    let rightColor = "#888";
    let errorColor = "red";

    console.log(weChatStatus);
    switch (weChatStatus) {
        case 0:
            statusText = i18n.t('wechat_status_0');
            statusColor = rightColor;
            activateButton(runCommandButton);
            deactivateButton(selectWeChatPathButton);
            break;
        case -1:
            statusText = i18n.t('wechat_status_negative_1');
            statusColor = errorColor;
            deactivateButton(runCommandButton);
            activateButton(selectWeChatPathButton);
            break;
        case -2:
            statusText = i18n.t('wechat_status_negative_2');
            statusColor = errorColor;
            deactivateButton(runCommandButton);
            activateButton(selectWeChatPathButton);
            break;
        default:
            statusText = `${weChatStatus} ` + i18n.t('wechat_status_positive_num');
            statusColor = errorColor;
            deactivateButton(runCommandButton);
            deactivateButton(selectWeChatPathButton);
    }

    weChatStatusText.textContent = statusText;
    weChatStatusText.style.color = statusColor;
}

window.addEventListener('DOMContentLoaded', () => {
    initI18n(function(t) {
        // 在此回调函数中进行翻译，因为此时可以确保i18next已经初始化完成
        duoweiTitle.innerText = t('title');
        duoweiHeadline.innerText = t('headline');
        weChatStatusText.innerText = t('wechat_status_negative_10000');
        weChatPathLabel.innerText = t('wechat_path_label');
        selectWeChatPathButton.innerText = t('select_wechat_path_button');
        weChatCountLabel.innerText = t('wechat_count_label');
        runCommandButton.innerText = t('run_command_button');
        checkUpdatesButton.innerText = t('check_updates_button');
        contactUsButton.innerText = t('contact_us_button');
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
            ipcRenderer.send('not-run-command', weChatStatusText.textContent);
        } else {
            ipcRenderer.send('run-command', weChatCountInput.value, weChatPathInput.value);
        }
    });

    checkUpdatesButton.addEventListener('click', () => {
        ipcRenderer.send('check-updates');
    });

    contactUsButton.addEventListener('click', () => {
        ipcRenderer.send('contact-us');
    });
});
