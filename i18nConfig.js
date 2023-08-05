const i18next = require('i18next');
const Backend = require('i18next-fs-backend');

i18next
    .use(Backend)
    .init({
        lng: 'zh', // 默认语言
        fallbackLng: 'en', // 如果当前语言的翻译不存在，将使用此备用语言
        backend: {
            loadPath: __dirname + '/locales/{{lng}}/translation.json'
        }
    });

module.exports = i18next;
