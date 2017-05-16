/**
 * This module keeps track of localization json files, should be initialized after assets are loaded
 * Json files should be kept in /localization/* folder, each language json should be named by a 2 letter codename, for example en.json
 * Languages are detected by these 2 letter codes, meaning there is no distinction between regional languages, for example
 en-US and en-UK are both detected as "en" and will use the same language file.
 * One exception is Chinese. Any tradional Chinese language will be detected as "zt"
 */
bento.define('modules/localization', [
    'bento',
    'bento/utils'
], function (
    Bento,
    Utils
) {
    'use strict';
    var languageCode = 'en';
    var languages = []; // available langcodes
    var languageJson = {};
    // this function merges every json file with the same languageCode in the /localization folder
    var createLanguageJson = function (code, debug) {
        var assets = Bento.assets.getAssets();
        var jsons = assets.json;
        var conflicts = [];

        // reset the language Json
        languageJson = {};

        Utils.forEach(jsons, function (json, key, l, breakLoop) {
            if (key.indexOf('localization/') === 0 && key.slice(-2) === code) {
                if (json.base) {
                    Utils.log("WARNING: json key 'base' is a reserved name, in file " + key);
                }
                // merge the languageJson
                Utils.extend(languageJson, json, false, function (duplicateKey) {
                    var duplicate = json[duplicateKey];
                    if (Utils.isString(duplicate) || Utils.isArray(duplicate)) {
                        // strings and arrays which can't be merged
                        Utils.log('WARNING: duplicate key "' + duplicateKey + '" detected in language json "' + key + '"');
                        if (debug) {
                            debug.errors = debug.errors;
                            debug.errors += 1;
                        }
                    } else {
                        // resolve later
                        conflicts.push({
                            key: duplicateKey,
                            duplicate: duplicate,
                            original: languageJson[duplicateKey]
                        });
                    }
                });
            }
        });

        // resolve conflicts by merging the two objects, will not resolve inner conflicts
        Utils.forEach(conflicts, function (conflict, i, l, breakLoop) {
            // merge in the original
            Utils.extend(languageJson[conflict.key], conflict.original, false, function (duplicateKey) {
                Utils.log('WARNING: Inner conflict in language "' + code + '" with key "' + conflict.key + '/' + duplicateKey + '"');
                if (debug) {
                    debug.errors = debug.errors;
                    debug.errors += 1;
                }
            });
            if (debug) {
                debug.merges = debug.merges;
                debug.merges += 1;
            }
        });

        return languageJson;
    };
    var Localization = {
        systemLanguage: 'en',
        /**
         * Get string of current language
         * @param {String} key - key value of json
         */
        getText: function (key) {
            var string = languageJson[key];
            if (!Utils.isDefined(string)) {
                Utils.log('WARNING: ' + key + ' was not found in localization strings');
            }
            return string || '';
        },
        /**
         * Change language
         * @param {String} code - language code
         */
        setLanguage: function (code) {
            code = code || Localization.systemLanguage;
            console.log('Language set to ' + code);
            try {
                languageJson = createLanguageJson(code); //Bento.assets.getJson('localization/' + code);
                languageCode = code;
            } catch (e) {
                // in case something terrible happens
                console.error('ERROR: language json ' + code + ' does not exist!!');
                console.log(e);
            }
        },
        /**
         * Inits localization with language from system/OS settings
         */
        init: function () {
            var language = window.navigator.userLanguage || window.navigator.language || 'en-US';
            var langLowerCase = language.toLowerCase();
            var code;
            var sub;
            // detect all available json files in text/
            var detectLanguages = function () {
                var assetGroups = Bento.assets.getAssetGroups();

                Utils.forEach(assetGroups, function (assetGroup) {
                    var jsons = assetGroup.json || {};
                    Utils.forEach(jsons, function (json, key, l, breakLoop) {
                        if (key.indexOf('localization/') === 0 && languages.indexOf(key.slice(-2)) < 0) {
                            // the json file must be named after a 2 letter keycode in lowercase!
                            languages.push(key.slice(-2));
                        }
                    });
                });
            };
            // compare code with detected languages
            var hasLanguage = function (langCode) {
                var i, l;
                for (i = 0, l = languages.length; i < l; ++i) {
                    if (languages[i] === langCode) {
                        return true;
                    }
                }
                return false;
            };

            console.log('Detected system language:', language);
            detectLanguages();

            // get the first 2 letters
            code = language.substr(0, 2).toLowerCase();

            // special cases for chinese tradition (zh-TW) and HK (zh-HK):
            if (
                langLowerCase === 'zh-tw' ||
                langLowerCase.indexOf('zh-hant') >= 0 || // taiwan
                langLowerCase === 'zh-hk' ||
                langLowerCase.indexOf('zh-hans') >= 0 // hongkong
            ) {
                code = 'zt';
            }

            // check if language json exists
            if (hasLanguage(code)) {
                languageCode = code;
            }

            // set language
            Localization.systemLanguage = languageCode;

            // for debugging purposes, create a report for every language
            if (Utils.isDev()) {
                window.inspectLanguages = function () {
                    var currentLanguageJson = languageJson;
                    Utils.forEach(languages, function (langCode, i, l, breakLoop) {
                        var debug = {
                            merges: 0,
                            errors: 0
                        };
                        var json = createLanguageJson(langCode, debug);
                        // log data
                        console.log(langCode + ': ' + Utils.getKeyLength(json) + ' keys, ' + debug.merges + ' merges,' + debug.errors + ' errors.');
                    });

                    languageJson = currentLanguageJson;
                };
            }
        },
        /**
         * Returns the current languageCode
         */
        getLanguage: function () {
            return languageCode;
        },
        /**
         * Returns true if the language was set to simplified/traditional chinese
         */
        isChinese: function () {
            return languageCode === 'zh' || languageCode === 'zt';
        },
        /**
         * Removes all languages from assets that are not the system language
         */
        cleanUnusedAssets: function () {
            var assetGroups = Bento.assets.getAssetGroups();
            Utils.forEach(assetGroups, function (assetGroup) {
                var jsons = assetGroup.json || {};
                Utils.forEach(jsons, function (json, key, l, breakLoop) {
                    var langKey = key.slice(-2);
                    if (key.indexOf('localization/') === 0 && langKey !== Localization.systemLanguage) {
                        delete jsons[key];
                    }
                });
            });
        }
    };

    return Localization;
});