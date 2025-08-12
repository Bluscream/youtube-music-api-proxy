"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SETTINGS_KEYS = exports.SIDEBAR_COLLAPSE_BREAKPOINT = exports.settings = void 0;
exports.loadSetting = loadSetting;
exports.saveSetting = saveSetting;
exports.loadAllSettings = loadAllSettings;
exports.applySettings = applySettings;
exports.saveAllSettings = saveAllSettings;
exports.setupSettingsAutoSave = setupSettingsAutoSave;
// Constants
const SIDEBAR_COLLAPSE_BREAKPOINT = 800;
exports.SIDEBAR_COLLAPSE_BREAKPOINT = SIDEBAR_COLLAPSE_BREAKPOINT;
// Settings keys
const SETTINGS_KEYS = {
    PLAYLIST: 'playlist',
    SONG: 'song',
    REPEAT: 'repeat',
    TAB: 'tab',
    RIGHT_SIDEBAR_SPLITTER_POS: 'split'
};
exports.SETTINGS_KEYS = SETTINGS_KEYS;
// Global settings object
exports.settings = {
    repeat: 'none',
    playlist: null,
    song: null,
    tab: 'info',
    split: 300
};
/**
 * Load a setting from URL parameters or localStorage
 */
function loadSetting(key, defaultValue = null) {
    const urlParams = new URLSearchParams(window.location.search);
    const queryValue = urlParams.get(key);
    if (queryValue !== null) {
        return parseSettingValue(key, queryValue);
    }
    try {
        const storedValue = localStorage.getItem(`setting_${key}`);
        if (storedValue !== null) {
            return parseSettingValue(key, storedValue);
        }
    }
    catch (error) {
        console.error(`Error loading setting ${key}:`, error);
    }
    return defaultValue;
}
/**
 * Save a setting to localStorage and update URL if needed
 */
function saveSetting(key, value) {
    try {
        localStorage.setItem(`setting_${key}`, JSON.stringify(value));
        if (key === SETTINGS_KEYS.PLAYLIST || key === SETTINGS_KEYS.SONG) {
            const url = new URL(window.location.href);
            if (value === null || value === undefined || value === '') {
                url.searchParams.delete(key);
            }
            else {
                url.searchParams.set(key, value.toString());
            }
            window.history.replaceState({}, '', url);
        }
    }
    catch (error) {
        console.error(`🎵 Settings System: Error saving setting ${key}:`, error);
    }
}
/**
 * Parse setting value based on key type
 */
function parseSettingValue(key, value) {
    switch (key) {
        case SETTINGS_KEYS.RIGHT_SIDEBAR_SPLITTER_POS:
            const num = parseFloat(value);
            return isNaN(num) ? 0 : num;
        case SETTINGS_KEYS.REPEAT:
            if (['none', 'one', 'all'].includes(value)) {
                return value;
            }
            return 'none';
        case SETTINGS_KEYS.TAB:
            if (['info', 'lyrics'].includes(value)) {
                return value;
            }
            return 'info';
        default:
            return value;
    }
}
/**
 * Load all settings from storage
 */
function loadAllSettings() {
    const loadedSettings = {
        playlist: loadSetting(SETTINGS_KEYS.PLAYLIST, null),
        song: loadSetting(SETTINGS_KEYS.SONG, null),
        repeat: loadSetting(SETTINGS_KEYS.REPEAT, 'none'),
        tab: loadSetting(SETTINGS_KEYS.TAB, 'info'),
        split: loadSetting(SETTINGS_KEYS.RIGHT_SIDEBAR_SPLITTER_POS, 300)
    };
    console.log('🎵 Settings System: Loaded settings:', loadedSettings);
    return loadedSettings;
}
/**
 * Apply settings to the global settings object
 */
function applySettings(newSettings) {
    exports.settings = { ...exports.settings, ...newSettings };
    // Apply settings to UI components if they exist
    if (window.rightSidebarManager) {
        window.rightSidebarManager.switchTab(exports.settings.tab);
    }
    if (window.rightSidebarManager) {
        window.rightSidebarManager.sidebarWidth = exports.settings.split;
        window.rightSidebarManager.updateSidebarWidth();
    }
    updateRepeatShuffleDisplay();
}
/**
 * Save all current settings
 */
function saveAllSettings() {
    // Update split setting from right sidebar manager if available
    if (window.rightSidebarManager) {
        exports.settings.split = window.rightSidebarManager.sidebarWidth;
    }
    saveSetting(SETTINGS_KEYS.PLAYLIST, exports.settings.playlist);
    saveSetting(SETTINGS_KEYS.SONG, exports.settings.song);
    saveSetting(SETTINGS_KEYS.REPEAT, exports.settings.repeat);
    saveSetting(SETTINGS_KEYS.TAB, exports.settings.tab);
    saveSetting(SETTINGS_KEYS.RIGHT_SIDEBAR_SPLITTER_POS, exports.settings.split);
}
/**
 * Setup automatic saving of settings
 */
function setupSettingsAutoSave() {
    setInterval(saveAllSettings, 30000); // Save every 30 seconds
    window.addEventListener('beforeunload', saveAllSettings);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            saveAllSettings();
        }
    });
}
/**
 * Update the repeat/shuffle display in the UI
 */
function updateRepeatShuffleDisplay() {
    const repeatButton = document.getElementById('repeatButton');
    if (repeatButton) {
        const repeatModes = {
            'none': { icon: '🔁', title: 'No repeat' },
            'one': { icon: '🔂', title: 'Repeat one' },
            'all': { icon: '🔁', title: 'Repeat all' }
        };
        const mode = repeatModes[exports.settings.repeat];
        repeatButton.textContent = mode.icon;
        repeatButton.title = mode.title;
    }
}
//# sourceMappingURL=settings.js.map