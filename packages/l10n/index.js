const en = require('./locales/en');
const tr = require('./locales/tr');

const dictionaries = { en, tr };

/**
 * Flexible localization helper.
 * @param {string} key - Translation key
 * @param {object} params - Dynamic interpolation key-values
 * @param {string|null} overrideLang - Optional language override ('tr' or 'en')
 */
function t(key, params = {}, overrideLang = null) {

    const defaultLang = process.env.DEFAULT_LANG || 'en';
    const selectedLang = (overrideLang || defaultLang).toLowerCase();


    const dict = dictionaries[selectedLang] || dictionaries['en'];
    let text = dict[key] || dictionaries['en'][key] || key;


    if (params && typeof params === 'object') {
        for (const [paramKey, paramVal] of Object.entries(params)) {
            text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), paramVal || '');
        }
    }

    return text;
}

module.exports = { t };