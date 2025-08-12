import { AppSettings, RepeatMode, TabType, SettingsKeys } from './types';

// Constants
const SIDEBAR_COLLAPSE_BREAKPOINT = 800;

// Settings keys
const SETTINGS_KEYS: SettingsKeys = {
    PLAYLIST: 'playlist',
    SONG: 'song',
    REPEAT: 'repeat',
    TAB: 'tab',
    RIGHT_SIDEBAR_SPLITTER_POS: 'split'
};

// Global settings object
export let settings: AppSettings = {
    repeat: 'none',
    playlist: null,
    song: null,
    tab: 'info',
    split: 300
};

/**
 * Load a setting from URL parameters or localStorage
 */
export function loadSetting(key: string, defaultValue: any = null): any {
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
    } catch (error) {
        console.error(`Error loading setting ${key}:`, error);
    }
    
    return defaultValue;
}

/**
 * Save a setting to localStorage and update URL if needed
 */
export function saveSetting(key: string, value: any): void {
    try {
        localStorage.setItem(`setting_${key}`, JSON.stringify(value));
        
        if (key === SETTINGS_KEYS.PLAYLIST || key === SETTINGS_KEYS.SONG) {
            const url = new URL(window.location.href);
            if (value === null || value === undefined || value === '') {
                url.searchParams.delete(key);
            } else {
                url.searchParams.set(key, value.toString());
            }
            window.history.replaceState({}, '', url);
        }
    } catch (error) {
        console.error(`🎵 Settings System: Error saving setting ${key}:`, error);
    }
}

/**
 * Parse setting value based on key type
 */
function parseSettingValue(key: string, value: string): any {
    switch (key) {
        case SETTINGS_KEYS.RIGHT_SIDEBAR_SPLITTER_POS:
            const num = parseFloat(value);
            return isNaN(num) ? 0 : num;
            
        case SETTINGS_KEYS.REPEAT:
            if (['none', 'one', 'all'].includes(value)) {
                return value as RepeatMode;
            }
            return 'none';
            
        case SETTINGS_KEYS.TAB:
            if (['info', 'lyrics'].includes(value)) {
                return value as TabType;
            }
            return 'info';
            
        default:
            return value;
    }
}

/**
 * Load all settings from storage
 */
export function loadAllSettings(): AppSettings {
    const loadedSettings: AppSettings = {
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
export function applySettings(newSettings: Partial<AppSettings>): void {
    settings = { ...settings, ...newSettings };
    
    // Apply settings to UI components if they exist
    if ((window as any).rightSidebarManager) {
        (window as any).rightSidebarManager.switchTab(settings.tab);
    }
    
    if ((window as any).rightSidebarManager) {
        (window as any).rightSidebarManager.sidebarWidth = settings.split;
        (window as any).rightSidebarManager.updateSidebarWidth();
    }
    
    updateRepeatShuffleDisplay();
}

/**
 * Save all current settings
 */
export function saveAllSettings(): void {
    // Update split setting from right sidebar manager if available
    if ((window as any).rightSidebarManager) {
        settings.split = (window as any).rightSidebarManager.sidebarWidth;
    }
    
    saveSetting(SETTINGS_KEYS.PLAYLIST, settings.playlist);
    saveSetting(SETTINGS_KEYS.SONG, settings.song);
    saveSetting(SETTINGS_KEYS.REPEAT, settings.repeat);
    saveSetting(SETTINGS_KEYS.TAB, settings.tab);
    saveSetting(SETTINGS_KEYS.RIGHT_SIDEBAR_SPLITTER_POS, settings.split);
}

/**
 * Setup automatic saving of settings
 */
export function setupSettingsAutoSave(): void {
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
function updateRepeatShuffleDisplay(): void {
    const repeatButton = document.getElementById('repeatButton') as HTMLButtonElement;
    if (repeatButton) {
        const repeatModes = {
            'none': { icon: '🔁', title: 'No repeat' },
            'one': { icon: '🔂', title: 'Repeat one' },
            'all': { icon: '🔁', title: 'Repeat all' }
        };
        
        const mode = repeatModes[settings.repeat];
        repeatButton.textContent = mode.icon;
        repeatButton.title = mode.title;
    }
}

// Export constants for use in other modules
export { SIDEBAR_COLLAPSE_BREAKPOINT, SETTINGS_KEYS };
