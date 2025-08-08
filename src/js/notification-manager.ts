import { NOTIFICATION_ICONS, DEFAULTS, NotificationType } from './constants';

// Notification System
export class NotificationManager {
    private notificationCounter: number = 0;

    constructor() {
        this.notificationCounter = 0;
    }

    showNotification(type: NotificationType, title: string, message: string, duration: number = DEFAULTS.NOTIFICATION_DURATION): string | null {
        const container = document.getElementById('notificationContainer');
        if (!container) {
            console.error('Notification container not found');
            return null;
        }

        const notificationId = `notification-${++this.notificationCounter}`;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.id = notificationId;

        // Create notification icon
        const iconDiv = document.createElement('div');
        iconDiv.className = 'notification-icon';
        iconDiv.textContent = NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.info;
        notification.appendChild(iconDiv);

        // Create notification content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'notification-content';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'notification-title';
        titleDiv.textContent = title;
        contentDiv.appendChild(titleDiv);

        const messageDiv = document.createElement('div');
        messageDiv.className = 'notification-message';
        messageDiv.textContent = message;
        contentDiv.appendChild(messageDiv);

        notification.appendChild(contentDiv);

        // Create close button
        const closeButton = document.createElement('button');
        closeButton.className = 'notification-close';
        closeButton.textContent = '×';
        closeButton.onclick = () => window.notificationManager.removeNotification(notificationId);
        notification.appendChild(closeButton);

        container.appendChild(notification);

        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Auto-remove after duration
        let timeoutId: number | null = null;
        if (duration > 0) {
            timeoutId = window.setTimeout(() => {
                this.removeNotification(notificationId);
            }, duration);
        }

        // Store timeout ID for potential cleanup
        notification.dataset.timeoutId = timeoutId?.toString() || '';

        return notificationId;
    }

    removeNotification(notificationId: string): void {
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

    showErrorNotification(message: string): string | null {
        return this.showNotification('error', 'Error', message, DEFAULTS.ERROR_NOTIFICATION_DURATION);
    }

    showSuccessNotification(message: string): string | null {
        return this.showNotification('success', 'Success', message, DEFAULTS.SUCCESS_NOTIFICATION_DURATION);
    }

    showWarningNotification(message: string): string | null {
        return this.showNotification('warning', 'Warning', message, DEFAULTS.WARNING_NOTIFICATION_DURATION);
    }

    showInfoNotification(message: string): string | null {
        return this.showNotification('info', 'Info', message, DEFAULTS.INFO_NOTIFICATION_DURATION);
    }
}

// Create global instance
window.notificationManager = new NotificationManager();

// Make functions globally accessible for onclick handlers
window.removeNotification = (notificationId: string) => window.notificationManager.removeNotification(notificationId);
