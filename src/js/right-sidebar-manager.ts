import { TabType } from './types';

export class RightSidebarManager {
    private isCollapsed: boolean = false;
    private isMobileOpen: boolean = false;
    public sidebarWidth: number = 300;
    private isResizing: boolean = false;
    private startX: number = 0;
    private startWidth: number = 0;

    constructor() {
        this.init();
    }

    private init(): void {
        this.setupEventListeners();
        this.restoreState();
        this.updateSidebarWidth();
    }

    private setupEventListeners(): void {
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

    private startResize(e: MouseEvent | TouchEvent): void {
        this.isResizing = true;
        this.startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        this.startWidth = this.sidebarWidth;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }

    private handleResize(e: MouseEvent | TouchEvent): void {
        if (!this.isResizing) return;

        const currentX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const deltaX = this.startX - currentX;
        const newWidth = Math.max(200, Math.min(600, this.startWidth + deltaX));

        this.sidebarWidth = newWidth;
        this.updateSidebarWidth();
    }

    private stopResize(): void {
        if (!this.isResizing) return;

        this.isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        this.saveState();
    }

    public toggle(): void {
        if (this.isMobile()) {
            this.toggleMobile();
        } else {
            this.toggleDesktop();
        }
    }

    private toggleDesktop(): void {
        this.isCollapsed = !this.isCollapsed;
        this.updateSidebarWidth();
        this.saveState();
    }

    private toggleMobile(): void {
        this.isMobileOpen = !this.isMobileOpen;
        this.updateSidebarWidth();
        this.saveState();
    }

    public open(): void {
        if (this.isMobile()) {
            this.openMobile();
        } else {
            this.openDesktop();
        }
    }

    public close(): void {
        if (this.isMobile()) {
            this.closeMobile();
        } else {
            this.closeDesktop();
        }
    }

    private openDesktop(): void {
        this.isCollapsed = false;
        this.updateSidebarWidth();
        this.saveState();
    }

    private closeDesktop(): void {
        this.isCollapsed = true;
        this.updateSidebarWidth();
        this.saveState();
    }

    private openMobile(): void {
        this.isMobileOpen = true;
        this.updateSidebarWidth();
        this.saveState();
    }

    private closeMobile(): void {
        this.isMobileOpen = false;
        this.updateSidebarWidth();
        this.saveState();
    }

    public switchTab(tab: TabType): void {
        const mainPanel = document.getElementById('mainPanel');
        if (!mainPanel) return;

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

    public updateSidebarWidth(): void {
        const rightSidebar = document.getElementById('rightSidebar');
        const mainContent = document.getElementById('mainContent');
        const root = document.documentElement;

        if (!rightSidebar || !mainContent) return;

        if (this.isMobile()) {
            if (this.isMobileOpen) {
                rightSidebar.classList.add('mobile-open');
                mainContent.classList.add('right-sidebar-mobile-open');
                this.createMobileBackdrop();
            } else {
                rightSidebar.classList.remove('mobile-open');
                mainContent.classList.remove('right-sidebar-mobile-open');
                this.removeMobileBackdrop();
            }
        } else {
            if (this.isCollapsed) {
                rightSidebar.classList.add('collapsed');
                mainContent.classList.add('right-sidebar-collapsed');
                root.style.setProperty('--right-sidebar-width', '0px');
            } else {
                rightSidebar.classList.remove('collapsed');
                mainContent.classList.remove('right-sidebar-collapsed');
                root.style.setProperty('--right-sidebar-width', `${this.sidebarWidth}px`);
            }
        }
    }

    private createMobileBackdrop(): void {
        if (document.getElementById('rightSidebarBackdrop')) return;

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

    private removeMobileBackdrop(): void {
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

    private saveState(): void {
        if (!this.isMobile()) {
            localStorage.setItem('rightSidebarState', JSON.stringify({
                isCollapsed: this.isCollapsed,
                sidebarWidth: this.sidebarWidth
            }));
        }
    }

    private restoreState(): void {
        if (this.isMobile()) {
            this.isCollapsed = true;
            this.isMobileOpen = false;
        } else {
            try {
                const savedState = localStorage.getItem('rightSidebarState');
                if (savedState) {
                    const state = JSON.parse(savedState);
                    this.isCollapsed = state.isCollapsed || false;
                    this.sidebarWidth = state.sidebarWidth || 300;
                } else {
                    this.isCollapsed = false;
                    this.sidebarWidth = 300;
                }
            } catch (error) {
                console.error('Error restoring right sidebar state:', error);
                this.isCollapsed = false;
                this.sidebarWidth = 300;
            }
        }
    }

    private isMobile(): boolean {
        return window.innerWidth <= 800;
    }

    public getSidebarWidth(): number {
        return this.sidebarWidth;
    }

    public isCollapsedState(): boolean {
        return this.isCollapsed;
    }

    public isMobileOpenState(): boolean {
        return this.isMobileOpen;
    }
}
