# YouTube Music API Proxy - Modular JavaScript Architecture

This directory contains the modular JavaScript files for the YouTube Music API Proxy application. The code has been refactored from a single large `app.js` file into multiple organized modules for better maintainability and code organization.

## File Structure

### Core Modules

- **`constants.js`** - Application constants and configuration values
- **`utils.js`** - Utility functions and helper methods
- **`app-new.js`** - Main application entry point

### Manager Classes

- **`notification-manager.js`** - Handles all notification functionality
- **`sidebar-manager.js`** - Manages left sidebar state and mobile responsiveness
- **`right-sidebar-manager.js`** - Manages right sidebar with tabs and resizing
- **`player-manager.js`** - Handles all audio playback and media controls
- **`content-manager.js`** - Manages library, playlists, search, and content display
- **`url-manager.js`** - Handles URL parameter loading and navigation

### Event Handling

- **`event-delegation.js`** - Centralized event delegation for data attributes

## Module Descriptions

### Constants (`constants.js`)
Contains all application constants including:
- Responsive breakpoints
- Player states and repeat modes
- Sidebar states
- Notification types and icons
- Default values

### Utils (`utils.js`)
Utility functions including:
- Formatting functions (duration, numbers, dates)
- URL parameter handling
- Audio stopping functionality
- Loading and error state management
- Navigation helpers

### Notification Manager (`notification-manager.js`)
Handles all notification functionality:
- Show/hide notifications
- Different notification types (error, success, warning, info)
- Auto-dismiss functionality
- Global notification counter

### Sidebar Manager (`sidebar-manager.js`)
Manages the left sidebar:
- State management (expanded, collapsed, icon, full)
- Mobile responsiveness
- Keyboard shortcuts
- Local storage persistence
- Mobile menu functionality

### Right Sidebar Manager (`right-sidebar-manager.js`)
Manages the right sidebar:
- Tab switching (Info, Lyrics)
- Resizable sidebar
- Mobile responsiveness
- Keyboard shortcuts
- State persistence

### Player Manager (`player-manager.js`)
Handles all audio functionality:
- Audio playback control
- Media key support
- Volume management
- Playlist navigation
- Repeat and shuffle modes
- Song info and lyrics display
- Mobile touch controls

### Content Manager (`content-manager.js`)
Manages content display:
- Library navigation
- Search functionality
- Playlist management
- Album and artist loading
- Content rendering

### URL Manager (`url-manager.js`)
Handles URL-based navigation:
- URL parameter loading
- Deep linking support
- Playlist and song URL handling

### Event Delegation (`event-delegation.js`)
Centralized event handling:
- Song click events
- Playlist click events
- Album click events
- Artist click events
- Uses data attributes for clean separation

## Usage

### Importing Modules
```javascript
// Import specific functionality
import { formatDuration } from './utils.js';
import { NOTIFICATION_TYPES } from './constants.js';

// Import manager classes
import { PlayerManager } from './player-manager.js';
```

### Global Access
All managers are available globally through the `window` object:
```javascript
window.playerManager.togglePlay();
window.notificationManager.showSuccessNotification('Success!');
window.sidebarManager.toggle();
```

### Event Handling
The application uses data attributes for event handling:
```html
<div data-song-id="123" data-song-name="Song Title" data-song-artist="Artist">
    Song Title
</div>
```

## Migration from Original app.js

The original `app.js` file has been split into these modules while maintaining all functionality. The new structure provides:

1. **Better Organization** - Related functionality is grouped together
2. **Easier Maintenance** - Smaller, focused files are easier to understand and modify
3. **Reusability** - Modules can be imported and used independently
4. **Testability** - Individual modules can be tested in isolation
5. **Scalability** - New features can be added as separate modules

## Browser Compatibility

The modular structure uses ES6 modules, which are supported in all modern browsers. The application includes fallbacks and polyfills where necessary.

## Development

When adding new features:
1. Determine which manager class should handle the functionality
2. Add the feature to the appropriate module
3. Export necessary functions for global access
4. Update this README if adding new modules

## File Naming Convention

- Manager classes: `*-manager.js`
- Utility files: descriptive names like `constants.js`, `utils.js`
- Event handling: `event-*.js`
- Main entry point: `app-new.js`
