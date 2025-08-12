"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationManager = void 0;
const event_emitter_1 = require("../core/event-emitter");
// Notification Manager for handling app notifications
class NotificationManager extends event_emitter_1.EventEmitter {
    constructor() {
        super();
        this.notifications = new Map();
        this.container = null;
        this.autoRemoveTimeouts = new Map();
        this.createContainer();
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!NotificationManager.instance) {
            NotificationManager.instance = new NotificationManager();
        }
        return NotificationManager.instance;
    }
    /**
     * Create notification container
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'notificationContainer';
        this.container.className = 'notification-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(this.container);
    }
    /**
     * Show a notification
     */
    show(type, title, message, duration = 5000) {
        const id = this.generateId();
        const notification = {
            id,
            type,
            title,
            message,
            duration,
            timestamp: Date.now()
        };
        this.notifications.set(id, notification);
        this.createNotificationElement(notification);
        // Auto-remove after duration
        if (duration > 0) {
            const timeout = window.setTimeout(() => {
                this.remove(id);
            }, duration);
            this.autoRemoveTimeouts.set(id, timeout);
        }
        this.emit('notificationShown', notification);
        return id;
    }
    /**
     * Remove a notification
     */
    remove(id) {
        const notification = this.notifications.get(id);
        if (!notification)
            return;
        // Clear auto-remove timeout
        const timeout = this.autoRemoveTimeouts.get(id);
        if (timeout) {
            clearTimeout(timeout);
            this.autoRemoveTimeouts.delete(id);
        }
        // Remove from DOM
        const element = document.getElementById(`notification-${id}`);
        if (element) {
            element.classList.add('notification-fade-out');
            setTimeout(() => {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            }, 300);
        }
        this.notifications.delete(id);
        this.emit('notificationRemoved', notification);
    }
    /**
     * Remove all notifications
     */
    clear() {
        // Clear all timeouts
        this.autoRemoveTimeouts.forEach(timeout => clearTimeout(timeout));
        this.autoRemoveTimeouts.clear();
        // Remove all elements
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.notifications.clear();
        this.emit('notificationsCleared');
    }
    /**
     * Get all active notifications
     */
    getAll() {
        return Array.from(this.notifications.values());
    }
    /**
     * Get notification by ID
     */
    get(id) {
        return this.notifications.get(id);
    }
    /**
     * Show success notification
     */
    success(title, message, duration) {
        return this.show('success', title, message, duration);
    }
    /**
     * Show error notification
     */
    error(title, message, duration) {
        return this.show('error', title, message, duration);
    }
    /**
     * Show warning notification
     */
    warning(title, message, duration) {
        return this.show('warning', title, message, duration);
    }
    /**
     * Show info notification
     */
    info(title, message, duration) {
        return this.show('info', title, message, duration);
    }
    /**
     * Create notification element
     */
    createNotificationElement(notification) {
        if (!this.container)
            return;
        const element = document.createElement('div');
        element.id = `notification-${notification.id}`;
        element.className = `notification notification-${notification.type}`;
        element.style.cssText = `
            background: ${this.getBackgroundColor(notification.type)};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            margin-bottom: 10px;
            max-width: 400px;
            pointer-events: auto;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            border-left: 4px solid ${this.getBorderColor(notification.type)};
        `;
        element.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="flex: 1;">
                    <div style="font-weight: bold; margin-bottom: 5px; font-size: 14px;">
                        ${this.escapeHtml(notification.title)}
                    </div>
                    <div style="font-size: 13px; opacity: 0.9;">
                        ${this.escapeHtml(notification.message)}
                    </div>
                </div>
                <button onclick="window.notificationManager.remove('${notification.id}')" 
                        style="background: none; border: none; color: white; cursor: pointer; 
                               font-size: 18px; margin-left: 10px; opacity: 0.7; padding: 0;">
                    ×
                </button>
            </div>
        `;
        this.container.appendChild(element);
        // Animate in
        setTimeout(() => {
            element.style.transform = 'translateX(0)';
        }, 10);
    }
    /**
     * Get background color for notification type
     */
    getBackgroundColor(type) {
        switch (type) {
            case 'success': return '#4caf50';
            case 'error': return '#f44336';
            case 'warning': return '#ff9800';
            case 'info': return '#2196f3';
            default: return '#333';
        }
    }
    /**
     * Get border color for notification type
     */
    getBorderColor(type) {
        switch (type) {
            case 'success': return '#45a049';
            case 'error': return '#da190b';
            case 'warning': return '#e68900';
            case 'info': return '#0b7dda';
            default: return '#666';
        }
    }
    /**
     * Generate unique ID
     */
    generateId() {
        return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    /**
     * Get notification count
     */
    getCount() {
        return this.notifications.size;
    }
    /**
     * Check if has notifications
     */
    hasNotifications() {
        return this.notifications.size > 0;
    }
}
exports.NotificationManager = NotificationManager;
// Make it available globally for backward compatibility
window.notificationManager = NotificationManager.getInstance();
//# sourceMappingURL=notification-manager.js.map