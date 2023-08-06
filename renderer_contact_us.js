const { initI18n, i18n } = require('../scripts/i18nConfig.js');

const duoweiTitle       =   document.getElementById('title');
const duoweiHeadline    =   document.getElementById('headline');
const githubLink        =   document.querySelector('#github-link a');
const feedbackLink      =   document.querySelector('#feedback-link a');

window.addEventListener('DOMContentLoaded', () => {
    initI18n(function(t) {
        duoweiTitle.innerText = t('contact_us_title');
        duoweiHeadline.innerText = t('contact_us_headline');
        githubLink.innerText = t('contact_us_github_link');
        feedbackLink.innerText = t('contact_us_feedback_link');
    });
});
