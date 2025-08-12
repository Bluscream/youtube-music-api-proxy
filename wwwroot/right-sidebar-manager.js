"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RightSidebarManager = void 0;
class RightSidebarManager {
    constructor() {
        this.isCollapsed = false;
        this.isMobileOpen = false;
        this.sidebarWidth = 300;
        this.isResizing = false;
        this.startX = 0;
        this.startWidth = 0;
        this.init();
    }
    init() {
        this.setupEventListeners();
        this.restoreState();
        this.updateSidebarWidth();
    }
    setupEventListeners() {
        const resizeHandle = document.getElementById('rightSidebarResizeHandle');
        if (resizeHandle) {
            resizeHandle.addEventListener('mousedown', (e) => this.startResize(e));
            resizeHandle.addEventListener('touchstart', (e) => this.startResize(e));
        }
        document.addEventListener('mousemove', (e) => this.handleResize(e));
        document.addEventListener('touchmove', (e) => this.handleResize(e));
        document.addEventListener('mouseup', () => this.stopResize());
        document.addEventListener('touchend', () => this.stopResize());
        // Mobile backdrop click handler
        document.addEventListener('click', (e) => {
            const backdrop = document.getElementById('rightSidebarBackdrop');
            if (backdrop && e.target === backdrop) {
                this.closeMobile();
            }
        });
    }
    startResize(e) {
        this.isResizing = true;
        this.startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        this.startWidth = this.sidebarWidth;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }
    handleResize(e) {
        if (!this.isResizing)
            return;
        const currentX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const deltaX = this.startX - currentX;
        const newWidth = Math.max(200, Math.min(600, this.startWidth + deltaX));
        this.sidebarWidth = newWidth;
        this.updateSidebarWidth();
    }
    stopResize() {
        if (!this.isResizing)
            return;
        this.isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        this.saveState();
    }
    toggle() {
        if (this.isMobile()) {
            this.toggleMobile();
        }
        else {
            this.toggleDesktop();
        }
    }
    toggleDesktop() {
        this.isCollapsed = !this.isCollapsed;
        this.updateSidebarWidth();
        this.saveState();
    }
    toggleMobile() {
        this.isMobileOpen = !this.isMobileOpen;
        this.updateSidebarWidth();
        this.saveState();
    }
    open() {
        if (this.isMobile()) {
            this.openMobile();
        }
        else {
            this.openDesktop();
        }
    }
    close() {
        if (this.isMobile()) {
            this.closeMobile();
        }
        else {
            this.closeDesktop();
        }
    }
    openDesktop() {
        this.isCollapsed = false;
        this.updateSidebarWidth();
        this.saveState();
    }
    closeDesktop() {
        this.isCollapsed = true;
        this.updateSidebarWidth();
        this.saveState();
    }
    openMobile() {
        this.isMobileOpen = true;
        this.updateSidebarWidth();
        this.saveState();
    }
    closeMobile() {
        this.isMobileOpen = false;
        this.updateSidebarWidth();
        this.saveState();
    }
    switchTab(tab) {
        const mainPanel = document.getElementById('mainPanel');
        if (!mainPanel)
            return;
        // Remove active class from all panels
        const panels = mainPanel.querySelectorAll('.right-sidebar-panel');
        panels.forEach(panel => panel.classList.remove('active'));
        // Add active class to target panel
        const targetPanel = mainPanel.querySelector(`#${tab}Panel`);
        if (targetPanel) {
            targetPanel.classList.add('active');
        }
        // Update tab buttons if they exist
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.classList.remove('active');
            if (button.getAttribute('data-tab') === tab) {
                button.classList.add('active');
            }
        });
    }
    updateSidebarWidth() {
        const rightSidebar = document.getElementById('rightSidebar');
        const mainContent = document.getElementById('mainContent');
        const root = document.documentElement;
        if (!rightSidebar || !mainContent)
            return;
        if (this.isMobile()) {
            if (this.isMobileOpen) {
                rightSidebar.classList.add('mobile-open');
                mainContent.classList.add('right-sidebar-mobile-open');
                this.createMobileBackdrop();
            }
            else {
                rightSidebar.classList.remove('mobile-open');
                mainContent.classList.remove('right-sidebar-mobile-open');
                this.removeMobileBackdrop();
            }
        }
        else {
            if (this.isCollapsed) {
                rightSidebar.classList.add('collapsed');
                mainContent.classList.add('right-sidebar-collapsed');
                root.style.setProperty('--right-sidebar-width', '0px');
            }
            else {
                rightSidebar.classList.remove('collapsed');
                mainContent.classList.remove('right-sidebar-collapsed');
                root.style.setProperty('--right-sidebar-width', `${this.sidebarWidth}px`);
            }
        }
    }
    createMobileBackdrop() {
        if (document.getElementById('rightSidebarBackdrop'))
            return;
        const backdrop = document.createElement('div');
        backdrop.id = 'rightSidebarBackdrop';
        backdrop.className = 'right-sidebar-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 998;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(backdrop);
        setTimeout(() => backdrop.classList.add('active'), 10);
    }
    removeMobileBackdrop() {
        const backdrop = document.getElementById('rightSidebarBackdrop');
        if (backdrop) {
            backdrop.classList.remove('active');
            setTimeout(() => {
                if (backdrop.parentNode) {
                    backdrop.parentNode.removeChild(backdrop);
                }
            }, 300);
        }
    }
    saveState() {
        if (!this.isMobile()) {
            localStorage.setItem('rightSidebarState', JSON.stringify({
                isCollapsed: this.isCollapsed,
                sidebarWidth: this.sidebarWidth
            }));
        }
    }
    restoreState() {
        if (this.isMobile()) {
            this.isCollapsed = true;
            this.isMobileOpen = false;
        }
        else {
            try {
                const savedState = localStorage.getItem('rightSidebarState');
                if (savedState) {
                    const state = JSON.parse(savedState);
                    this.isCollapsed = state.isCollapsed || false;
                    this.sidebarWidth = state.sidebarWidth || 300;
                }
                else {
                    this.isCollapsed = false;
                    this.sidebarWidth = 300;
                }
            }
            catch (error) {
                console.error('Error restoring right sidebar state:', error);
                this.isCollapsed = false;
                this.sidebarWidth = 300;
            }
        }
    }
    isMobile() {
        return window.innerWidth <= 800;
    }
    getSidebarWidth() {
        return this.sidebarWidth;
    }
    isCollapsedState() {
        return this.isCollapsed;
    }
    isMobileOpenState() {
        return this.isMobileOpen;
    }
}
exports.RightSidebarManager = RightSidebarManager;
//# sourceMappingURL=right-sidebar-manager.js.map