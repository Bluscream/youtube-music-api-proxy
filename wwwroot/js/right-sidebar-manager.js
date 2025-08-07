import { SIDEBAR_COLLAPSE_BREAKPOINT, RIGHT_SIDEBAR_TABS, DEFAULTS } from './constants.js';

// Right Sidebar Manager
export class RightSidebarManager {
    constructor() {
        this.isCollapsed = false;
        this.currentTab = RIGHT_SIDEBAR_TABS.INFO;
        this.isMobile = false;
        this.isMobileOpen = false;
        this.sidebarWidth = DEFAULTS.RIGHT_SIDEBAR_WIDTH;
        this.minWidth = DEFAULTS.RIGHT_SIDEBAR_MIN_WIDTH;
        this.maxWidth = DEFAULTS.RIGHT_SIDEBAR_MAX_WIDTH;
        this.init();
    }

    init() {
        this.updateBreakpoint();
        this.setupEventListeners();
        this.restoreState();
        this.updateLayout();
    }

    updateBreakpoint() {
        this.isMobile = window.innerWidth <= SIDEBAR_COLLAPSE_BREAKPOINT;
        this.updateWidthConstraints();
    }

    updateWidthConstraints() {
        if (window.innerWidth <= 1000) {
            this.minWidth = 200;
            this.maxWidth = 400;
        } else if (window.innerWidth <= 1200) {
            this.minWidth = 200;
            this.maxWidth = 500;
        } else {
            this.minWidth = 200;
            this.maxWidth = 600;
        }

        // Ensure current width is within constraints
        this.sidebarWidth = Math.max(this.minWidth, Math.min(this.maxWidth, this.sidebarWidth));
    }

    setupEventListeners() {
        // Window resize handler
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.updateBreakpoint();

            if (wasMobile !== this.isMobile) {
                this.handleBreakpointChange();
            }

            this.updateLayout();
        });

        // Close mobile sidebar when clicking outside
        document.addEventListener('click', (event) => {
            if (this.isMobile && this.isMobileOpen) {
                const rightSidebar = document.getElementById('rightSidebar');
                if (rightSidebar && !rightSidebar.contains(event.target)) {
                    this.closeMobileSidebar();
                }
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            if (this.isMobile) return;

            // Ctrl/Cmd + Shift + R to toggle right sidebar
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'R') {
                event.preventDefault();
                this.toggle();
            }

            // Ctrl/Cmd + Shift + 1 for Info tab
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === '1') {
                event.preventDefault();
                this.switchTab(RIGHT_SIDEBAR_TABS.INFO);
            }

            // Ctrl/Cmd + Shift + 2 for Lyrics tab
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === '2') {
                event.preventDefault();
                this.switchTab(RIGHT_SIDEBAR_TABS.LYRICS);
            }
        });

        // Setup resize handle functionality
        this.setupResizeHandle();
    }

    setupResizeHandle() {
        const resizeHandle = document.getElementById('rightSidebarResizeHandle');
        const rightSidebar = document.getElementById('rightSidebar');

        if (!resizeHandle || !rightSidebar) return;

        let isResizing = false;
        let startX = 0;
        let startWidth = 0;

        const startResize = (e) => {
            if (this.isMobile || this.isCollapsed) return;

            isResizing = true;
            startX = e.clientX || e.touches[0].clientX;
            startWidth = this.sidebarWidth;

            resizeHandle.classList.add('resizing');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';

            e.preventDefault();
        };

        const doResize = (e) => {
            if (!isResizing) return;

            const currentX = e.clientX || e.touches[0].clientX;
            const deltaX = startX - currentX;
            let newWidth = startWidth + deltaX;

            // Apply min/max constraints
            newWidth = Math.max(this.minWidth, Math.min(this.maxWidth, newWidth));

            this.sidebarWidth = newWidth;
            this.updateSidebarWidth();

            e.preventDefault();
        };

        const stopResize = () => {
            if (!isResizing) return;

            isResizing = false;
            resizeHandle.classList.remove('resizing');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';

            // Save the new width
            this.saveState();
        };

        // Mouse events
        resizeHandle.addEventListener('mousedown', startResize);
        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);

        // Touch events for mobile
        resizeHandle.addEventListener('touchstart', startResize);
        document.addEventListener('touchmove', doResize);
        document.addEventListener('touchend', stopResize);
    }

    updateSidebarWidth() {
        const rightSidebar = document.getElementById('rightSidebar');
        if (rightSidebar) {
            rightSidebar.style.width = `${this.sidebarWidth}px`;
            document.documentElement.style.setProperty('--right-sidebar-width', `${this.sidebarWidth}px`);
        }
    }

    handleBreakpointChange() {
        if (this.isMobile) {
            // Transitioning to mobile - collapse sidebar
            this.isCollapsed = true;
            this.isMobileOpen = false;
            this.saveState();
        } else {
            // Transitioning to desktop - restore saved state
            this.restoreState();
        }
    }

    toggle() {
        if (this.isMobile) {
            this.toggleMobileSidebar();
        } else {
            this.isCollapsed = !this.isCollapsed;
            this.saveState();
            this.updateLayout();
        }
    }

    toggleMobileSidebar() {
        this.isMobileOpen = !this.isMobileOpen;
        this.updateLayout();
    }

    closeMobileSidebar() {
        this.isMobileOpen = false;
        this.updateLayout();
    }

    switchTab(tabName) {
        if (Object.values(RIGHT_SIDEBAR_TABS).includes(tabName)) {
            this.currentTab = tabName;
            this.saveState();
            this.updateLayout();
        }
    }

    updateLayout() {
        const rightSidebar = document.getElementById('rightSidebar');
        const mainContent = document.getElementById('mainContent');
        const playerBar = document.querySelector('.player-bar');
        const rightSidebarToggle = document.getElementById('rightSidebarToggle');
        const rightSidebarMobileToggle = document.getElementById('rightSidebarMobileToggle');

        if (!rightSidebar) return;

        // Remove all state classes
        rightSidebar.classList.remove('collapsed', 'mobile-open');
        if (mainContent) {
            mainContent.classList.remove('right-sidebar-collapsed');
        }
        if (playerBar) {
            playerBar.classList.remove('right-sidebar-collapsed');
        }

        // Update sidebar width
        this.updateSidebarWidth();

        if (this.isMobile) {
            // Mobile layout
            if (rightSidebarToggle) {
                rightSidebarToggle.style.display = 'none';
            }
            if (rightSidebarMobileToggle) {
                rightSidebarMobileToggle.style.display = 'flex';
            }

            if (this.isMobileOpen) {
                rightSidebar.classList.add('mobile-open');
                this.addMobileBackdrop();
            } else {
                rightSidebar.classList.add('collapsed');
                this.removeMobileBackdrop();
            }

            // Mobile sidebar should not affect main content layout
            if (mainContent) {
                mainContent.classList.remove('right-sidebar-collapsed');
            }
            if (playerBar) {
                playerBar.classList.remove('right-sidebar-collapsed');
            }
        } else {
            // Desktop layout
            if (rightSidebarToggle) {
                rightSidebarToggle.style.display = 'flex';
            }
            if (rightSidebarMobileToggle) {
                rightSidebarMobileToggle.style.display = 'none';
            }
            this.removeMobileBackdrop();

            if (this.isCollapsed) {
                rightSidebar.classList.add('collapsed');
                if (mainContent) {
                    mainContent.classList.add('right-sidebar-collapsed');
                }
                if (playerBar) {
                    playerBar.classList.add('right-sidebar-collapsed');
                }
            }

            this.updateToggleButton();
        }

        this.updateTabs();
    }

    updateToggleButton() {
        const rightSidebarToggle = document.getElementById('rightSidebarToggle');
        if (!rightSidebarToggle) return;

        if (this.isCollapsed) {
            rightSidebarToggle.textContent = '◀';
            rightSidebarToggle.title = 'Expand right sidebar';
        } else {
            rightSidebarToggle.textContent = '▶';
            rightSidebarToggle.title = 'Collapse right sidebar';
        }
    }

    updateTabs() {
        const infoTab = document.getElementById('infoTab');
        const lyricsTab = document.getElementById('lyricsTab');
        const infoPanel = document.getElementById('infoPanel');
        const lyricsPanel = document.getElementById('lyricsPanel');

        // Update tab states
        if (infoTab) {
            infoTab.classList.toggle('active', this.currentTab === RIGHT_SIDEBAR_TABS.INFO);
        }
        if (lyricsTab) {
            lyricsTab.classList.toggle('active', this.currentTab === RIGHT_SIDEBAR_TABS.LYRICS);
        }

        // Update panel states
        if (infoPanel) {
            infoPanel.classList.toggle('active', this.currentTab === RIGHT_SIDEBAR_TABS.INFO);
        }
        if (lyricsPanel) {
            lyricsPanel.classList.toggle('active', this.currentTab === RIGHT_SIDEBAR_TABS.LYRICS);
        }
    }

    addMobileBackdrop() {
        if (!document.getElementById('rightSidebarBackdrop')) {
            const backdrop = document.createElement('div');
            backdrop.id = 'rightSidebarBackdrop';
            backdrop.className = 'right-sidebar-backdrop';
            document.body.appendChild(backdrop);

            // Animate backdrop in
            setTimeout(() => {
                backdrop.classList.add('active');
            }, 10);

            // Close sidebar when backdrop is clicked
            backdrop.addEventListener('click', () => {
                this.closeMobileSidebar();
            });
        }
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
        if (!this.isMobile) {
            localStorage.setItem('rightSidebarState', JSON.stringify({
                isCollapsed: this.isCollapsed,
                currentTab: this.currentTab,
                sidebarWidth: this.sidebarWidth
            }));
        }
    }

    restoreState() {
        if (this.isMobile) {
            // Mobile always starts with collapsed sidebar
            this.isCollapsed = true;
            this.isMobileOpen = false;
        } else {
            // Desktop restores saved state
            try {
                const savedState = localStorage.getItem('rightSidebarState');
                if (savedState) {
                    const state = JSON.parse(savedState);
                    this.isCollapsed = state.isCollapsed || false;
                    this.currentTab = state.currentTab || RIGHT_SIDEBAR_TABS.INFO;
                    this.sidebarWidth = state.sidebarWidth || DEFAULTS.RIGHT_SIDEBAR_WIDTH;
                } else {
                    this.isCollapsed = false; // Default to expanded on desktop
                    this.currentTab = RIGHT_SIDEBAR_TABS.INFO;
                    this.sidebarWidth = DEFAULTS.RIGHT_SIDEBAR_WIDTH;
                }
            } catch (error) {
                console.error('Error restoring right sidebar state:', error);
                this.isCollapsed = false;
                this.currentTab = RIGHT_SIDEBAR_TABS.INFO;
                this.sidebarWidth = DEFAULTS.RIGHT_SIDEBAR_WIDTH;
            }
        }
    }
}

// Create global instance
window.rightSidebarManager = new RightSidebarManager();

// Global functions for onclick handlers
window.toggleRightSidebar = () => window.rightSidebarManager.toggle();
window.switchRightSidebarTab = (tabName) => window.rightSidebarManager.switchTab(tabName);
