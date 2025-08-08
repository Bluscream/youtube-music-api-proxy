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
} as const;

export type PlayerState = typeof PLAYER_STATES[keyof typeof PLAYER_STATES];

// Repeat modes
export const REPEAT_MODES = {
    NONE: 'none',
    ONE: 'one',
    ALL: 'all'
} as const;

export type RepeatMode = typeof REPEAT_MODES[keyof typeof REPEAT_MODES];

// Sidebar states
export const SIDEBAR_STATES = {
    FULL: 'full',
    EXPANDED: 'expanded',
    ICON: 'icon',
    COLLAPSED: 'collapsed'
} as const;

export type SidebarState = typeof SIDEBAR_STATES[keyof typeof SIDEBAR_STATES];

// Right sidebar tabs
export const RIGHT_SIDEBAR_TABS = {
    INFO: 'info',
    LYRICS: 'lyrics'
} as const;

export type RightSidebarTab = typeof RIGHT_SIDEBAR_TABS[keyof typeof RIGHT_SIDEBAR_TABS];

// Notification types
export const NOTIFICATION_TYPES = {
    ERROR: 'error',
    SUCCESS: 'success',
    WARNING: 'warning',
    INFO: 'info'
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

// Notification icons
export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
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
} as const;

// Error recovery timeout for automatic playlist advancement
export const ERROR_RECOVERY_TIMEOUT = 3000;

// Swipe gesture minimum distance
export const MIN_SWIPE_DISTANCE = 100;

// Volume slider drag threshold
export const VOLUME_DRAG_THRESHOLD = 50;
