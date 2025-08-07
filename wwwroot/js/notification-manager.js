import { NOTIFICATION_ICONS, DEFAULTS } from './constants.js';

// Notification System
export class NotificationManager {
    constructor() {
        this.notificationCounter = 0;
    }

    showNotification(type, title, message, duration = DEFAULTS.NOTIFICATION_DURATION) {
        const container = document.getElementById('notificationContainer');
        if (!container) {
            console.error('Notification container not found');
            return null;
        }

        const notificationId = `notification-${++this.notificationCounter}`;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.id = notificationId;

        notification.innerHTML = `
            <div class="notification-icon">${NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.info}</div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" onclick="window.notificationManager.removeNotification('${notificationId}')">×</button>
        `;

        container.appendChild(notification);

        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Auto-remove after duration
        let timeoutId = null;
        if (duration > 0) {
            timeoutId = setTimeout(() => {
                this.removeNotification(notificationId);
            }, duration);
        }

        // Store timeout ID for potential cleanup
        notification.dataset.timeoutId = timeoutId;

        return notificationId;
    }

    removeNotification(notificationId) {
        const notification = document.getElementById(notificationId);
        if (notification) {
            // Clear the timeout if it exists
            if (notification.dataset.timeoutId) {
                clearTimeout(parseInt(notification.dataset.timeoutId));
                delete notification.dataset.timeoutId;
            }

            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }

    showErrorNotification(message) {
        return this.showNotification('error', 'Error', message, DEFAULTS.ERROR_NOTIFICATION_DURATION);
    }

    showSuccessNotification(message) {
        return this.showNotification('success', 'Success', message, DEFAULTS.SUCCESS_NOTIFICATION_DURATION);
    }

    showWarningNotification(message) {
        return this.showNotification('warning', 'Warning', message, DEFAULTS.WARNING_NOTIFICATION_DURATION);
    }

    showInfoNotification(message) {
        return this.showNotification('info', 'Info', message, DEFAULTS.INFO_NOTIFICATION_DURATION);
    }
}

// Create global instance
window.notificationManager = new NotificationManager();

// Make functions globally accessible for onclick handlers
window.removeNotification = (notificationId) => window.notificationManager.removeNotification(notificationId);
