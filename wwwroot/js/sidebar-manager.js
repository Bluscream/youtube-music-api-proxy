import { SIDEBAR_COLLAPSE_BREAKPOINT, SIDEBAR_STATES } from './constants.js';

// Sidebar state management
export class SidebarManager {
    constructor() {
        this.isMobile = false;
        this.currentState = SIDEBAR_STATES.EXPANDED; // 'full', 'expanded', 'icon', 'collapsed'
        this.isMobileMenuOpen = false;
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
    }

    setupEventListeners() {
        // Window resize handler
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.updateBreakpoint();

            // Handle transition from mobile to desktop or vice versa
            if (wasMobile !== this.isMobile) {
                this.handleBreakpointChange();
            }

            this.updateLayout();
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (event) => {
            if (this.isMobile && this.isMobileMenuOpen) {
                const sidebar = document.getElementById('sidebar');
                const mobileMenuToggle = document.getElementById('mobileMenuToggle');

                if (!sidebar.contains(event.target) && !mobileMenuToggle.contains(event.target)) {
                    this.closeMobileMenu();
                }
            }
        });

        // Keyboard shortcuts for desktop
        document.addEventListener('keydown', (event) => {
            if (this.isMobile) return;

            if ((event.ctrlKey || event.metaKey) && event.key === 'b') { // Ctrl/Cmd + B to cycle through states
                event.preventDefault();
                this.cycleState();
            }
        });

        // Double-click sidebar toggle to enter full screen
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('dblclick', (event) => {
                event.preventDefault();
                if (this.currentState === SIDEBAR_STATES.FULL) {
                    this.setState(SIDEBAR_STATES.EXPANDED);
                } else {
                    this.setState(SIDEBAR_STATES.FULL);
                }
            });
        }
    }

    handleBreakpointChange() {
        if (this.isMobile) {
            // Transitioning to mobile - use collapsed state
            this.currentState = SIDEBAR_STATES.COLLAPSED;
            this.isMobileMenuOpen = false;
            this.saveState();
        } else {
            // Transitioning to desktop - restore saved state
            this.restoreState();
        }
    }

    toggle() {
        if (this.isMobile) {
            this.toggleMobileMenu();
        } else {
            this.cycleState();
        }
    }

    cycleState() {
        const states = [SIDEBAR_STATES.EXPANDED, SIDEBAR_STATES.ICON, SIDEBAR_STATES.COLLAPSED];
        const currentIndex = states.indexOf(this.currentState);
        const nextIndex = (currentIndex + 1) % states.length;
        this.currentState = states[nextIndex];
        this.saveState();
        this.updateLayout();
    }

    setState(state) {
        if (Object.values(SIDEBAR_STATES).includes(state)) {
            this.currentState = state;
            this.saveState();
            this.updateLayout();
        }
    }

    toggleMobileMenu() {
        this.isMobileMenuOpen = !this.isMobileMenuOpen;
        this.saveState();
        this.updateLayout();
    }

    closeMobileMenu() {
        this.isMobileMenuOpen = false;
        this.saveState();
        this.updateLayout();
    }

    updateLayout() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        const sidebarToggle = document.getElementById('sidebarToggle');
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const hamburgerMenu = document.getElementById('hamburgerMenu');
        const playerBar = document.querySelector('.player-bar');

        if (!sidebar || !mainContent) {
            console.error('Required DOM elements not found for sidebar layout update');
            return;
        }

        // Remove all state classes
        sidebar.classList.remove('full', 'expanded', 'icon', 'collapsed', 'mobile-open');
        mainContent.classList.remove('sidebar-full', 'sidebar-expanded', 'sidebar-icon', 'sidebar-collapsed');
        if (playerBar) {
            playerBar.classList.remove('sidebar-full', 'sidebar-expanded', 'sidebar-icon', 'sidebar-collapsed');
        }

        if (this.isMobile) {
            // Mobile layout
            if (sidebarToggle) sidebarToggle.style.display = 'none';
            if (mobileMenuToggle) mobileMenuToggle.style.display = 'flex';
            if (hamburgerMenu) hamburgerMenu.style.display = 'none';

            if (this.isMobileMenuOpen) {
                sidebar.classList.add('mobile-open');
                mobileMenuToggle.textContent = '✕';
                this.addMobileBackdrop();
            } else {
                sidebar.classList.add('collapsed');
                mobileMenuToggle.textContent = '☰';
                this.removeMobileBackdrop();
            }

            // Mobile sidebar should not affect main content layout
            mainContent.classList.remove('sidebar-collapsed');
            if (playerBar) {
                playerBar.classList.remove('sidebar-collapsed');
            }
        } else {
            // Desktop layout
            if (sidebarToggle) sidebarToggle.style.display = 'flex';
            if (mobileMenuToggle) mobileMenuToggle.style.display = 'none';
            this.removeMobileBackdrop();

            // Apply current state
            sidebar.classList.add(this.currentState);
            mainContent.classList.add(`sidebar-${this.currentState}`);
            if (playerBar) {
                playerBar.classList.add(`sidebar-${this.currentState}`);
            }

            // Update hamburger menu visibility
            if (hamburgerMenu) {
                hamburgerMenu.style.display = this.currentState === 'collapsed' ? 'block' : 'none';
            }

            // Update toggle button
            this.updateToggleButton();
        }
    }

    updateToggleButton() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (!sidebarToggle) return;

        const buttonConfig = {
            full: { text: '✕', title: 'Exit full screen', left: '20px' },
            expanded: { text: '◀', title: 'Collapse to icons', left: '260px' },
            icon: { text: '◀', title: 'Collapse sidebar', left: '80px' },
            collapsed: { text: '▶', title: 'Expand sidebar', left: '20px' }
        };

        const config = buttonConfig[this.currentState];
        if (config) {
            sidebarToggle.textContent = config.text;
            sidebarToggle.title = config.title;
            sidebarToggle.style.left = config.left;
        }
    }

    addMobileBackdrop() {
        if (!document.getElementById('mobileMenuBackdrop')) {
            const backdrop = document.createElement('div');
            backdrop.id = 'mobileMenuBackdrop';
            backdrop.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 199;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(backdrop);

            // Animate backdrop in
            setTimeout(() => {
                backdrop.style.opacity = '1';
            }, 10);

            // Close menu when backdrop is clicked
            backdrop.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        }
    }

    removeMobileBackdrop() {
        const backdrop = document.getElementById('mobileMenuBackdrop');
        if (backdrop) {
            backdrop.style.opacity = '0';
            setTimeout(() => {
                if (backdrop.parentNode) {
                    backdrop.parentNode.removeChild(backdrop);
                }
            }, 300);
        }
    }

    saveState() {
        if (!this.isMobile) {
            localStorage.setItem('sidebarState', JSON.stringify({
                state: this.currentState
            }));
        } else {
            // Save mobile state
            localStorage.setItem('sidebarState', JSON.stringify({
                state: this.currentState,
                isMobileMenuOpen: this.isMobileMenuOpen
            }));
        }
    }

    restoreState() {
        try {
            const savedState = localStorage.getItem('sidebarState');
            if (savedState) {
                const state = JSON.parse(savedState);
                this.currentState = state.state || SIDEBAR_STATES.EXPANDED;
                this.isMobileMenuOpen = state.isMobileMenuOpen || false;
            } else {
                // Default states
                this.currentState = SIDEBAR_STATES.EXPANDED;
                this.isMobileMenuOpen = false;
            }
        } catch (error) {
            console.error('Error restoring sidebar state:', error);
            this.currentState = SIDEBAR_STATES.EXPANDED;
            this.isMobileMenuOpen = false;
        }

        // Override for mobile if transitioning to mobile
        if (this.isMobile) {
            this.currentState = SIDEBAR_STATES.COLLAPSED;
            // Keep the mobile menu state from saved data
        }
    }
}

// Create global instance
window.sidebarManager = new SidebarManager();

// Global toggle function for onclick handlers
window.toggleSidebar = () => window.sidebarManager.toggle();

// Add functions to directly set sidebar states
window.setSidebarFull = () => window.sidebarManager.setState(SIDEBAR_STATES.FULL);
window.setSidebarExpanded = () => window.sidebarManager.setState(SIDEBAR_STATES.EXPANDED);
window.setSidebarIcon = () => window.sidebarManager.setState(SIDEBAR_STATES.ICON);
window.setSidebarCollapsed = () => window.sidebarManager.setState(SIDEBAR_STATES.COLLAPSED);
