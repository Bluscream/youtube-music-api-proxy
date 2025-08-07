// Responsive breakpoints - these values are used throughout the application
// and are synchronized with CSS custom properties for consistent responsive behavior
export const SIDEBAR_COLLAPSE_BREAKPOINT = 800; // Breakpoint for sidebar collapse (desktop and mobile)

// Default title for the application
export const DEFAULT_TITLE = 'YT Music';

// Player states
export const PLAYER_STATES = {
    PLAYING: 'playing',
    PAUSED: 'paused',
    STOPPED: 'stopped'
};

// Repeat modes
export const REPEAT_MODES = {
    NONE: 'none',
    ONE: 'one',
    ALL: 'all'
};

// Sidebar states
export const SIDEBAR_STATES = {
    FULL: 'full',
    EXPANDED: 'expanded',
    ICON: 'icon',
    COLLAPSED: 'collapsed'
};

// Right sidebar tabs
export const RIGHT_SIDEBAR_TABS = {
    INFO: 'info',
    LYRICS: 'lyrics'
};

// Notification types
export const NOTIFICATION_TYPES = {
    ERROR: 'error',
    SUCCESS: 'success',
    WARNING: 'warning',
    INFO: 'info'
};

// Notification icons
export const NOTIFICATION_ICONS = {
    error: '❌',
    success: '✅',
    warning: '⚠️',
    info: 'ℹ️'
};

// Default values
export const DEFAULTS = {
    VOLUME: 0.5,
    NOTIFICATION_DURATION: 5000,
    ERROR_NOTIFICATION_DURATION: 8000,
    SUCCESS_NOTIFICATION_DURATION: 4000,
    WARNING_NOTIFICATION_DURATION: 6000,
    INFO_NOTIFICATION_DURATION: 5000,
    RIGHT_SIDEBAR_WIDTH: 300,
    RIGHT_SIDEBAR_MIN_WIDTH: 200,
    RIGHT_SIDEBAR_MAX_WIDTH: 600
};

// Error recovery timeout for automatic playlist advancement
export const ERROR_RECOVERY_TIMEOUT = 3000;

// Swipe gesture minimum distance
export const MIN_SWIPE_DISTANCE = 100;

// Volume slider drag threshold
export const VOLUME_DRAG_THRESHOLD = 50;
