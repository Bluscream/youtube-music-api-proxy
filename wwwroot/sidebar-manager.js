"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SidebarManager = void 0;
const settings_1 = require("./settings");
class SidebarManager {
    constructor() {
        this.isMobile = false;
        this.currentState = 'expanded';
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
        this.isMobile = window.innerWidth <= settings_1.SIDEBAR_COLLAPSE_BREAKPOINT;
    }
    setupEventListeners() {
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.updateBreakpoint();
            if (wasMobile !== this.isMobile) {
                this.handleBreakpointChange();
            }
            this.updateLayout();
        });
        document.addEventListener('click', (event) => {
            if (this.isMobile && this.isMobileMenuOpen) {
                const sidebar = document.getElementById('sidebar');
                const mobileMenuToggle = document.getElementById('mobileMenuToggle');
                if (sidebar && mobileMenuToggle &&
                    !sidebar.contains(event.target) &&
                    !mobileMenuToggle.contains(event.target)) {
                    this.closeMobileMenu();
                }
            }
        });
        document.addEventListener('keydown', (event) => {
            if (this.isMobile)
                return;
            if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
                event.preventDefault();
                this.cycleState();
            }
        });
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('dblclick', (event) => {
                event.preventDefault();
                if (this.currentState === 'full') {
                    this.setState('expanded');
                }
                else {
                    this.setState('full');
                }
            });
        }
    }
    handleBreakpointChange() {
        if (this.isMobile) {
            this.currentState = 'collapsed';
            this.isMobileMenuOpen = false;
            this.saveState();
        }
        else {
            this.restoreState();
        }
    }
    toggle() {
        if (this.isMobile) {
            this.toggleMobileMenu();
        }
        else {
            this.cycleState();
        }
    }
    toggleMobileMenu() {
        this.isMobileMenuOpen = !this.isMobileMenuOpen;
        this.updateLayout();
        this.saveState();
    }
    closeMobileMenu() {
        this.isMobileMenuOpen = false;
        this.updateLayout();
        this.saveState();
    }
    cycleState() {
        const states = ['expanded', 'icon', 'collapsed', 'full'];
        const currentIndex = states.indexOf(this.currentState);
        const nextIndex = (currentIndex + 1) % states.length;
        this.setState(states[nextIndex]);
    }
    setState(state) {
        this.currentState = state;
        this.updateLayout();
        this.saveState();
    }
    updateLayout() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        const playerBar = document.querySelector('.player-bar');
        if (!sidebar || !mainContent || !playerBar)
            return;
        // Remove all state classes
        sidebar.className = 'sidebar';
        mainContent.className = 'main-content';
        playerBar.className = 'player-bar';
        // Add current state classes
        sidebar.classList.add(`sidebar-${this.currentState}`);
        mainContent.classList.add(`sidebar-${this.currentState}`);
        playerBar.classList.add(`sidebar-${this.currentState}`);
        // Handle mobile menu
        if (this.isMobile) {
            if (this.isMobileMenuOpen) {
                sidebar.classList.add('mobile-open');
                mainContent.classList.add('mobile-menu-open');
            }
            else {
                sidebar.classList.remove('mobile-open');
                mainContent.classList.remove('mobile-menu-open');
            }
        }
        // Update CSS breakpoints
        this.updateCSSBreakpoints();
    }
    updateCSSBreakpoints() {
        const root = document.documentElement;
        root.style.setProperty('--sidebar-collapse-breakpoint', `${settings_1.SIDEBAR_COLLAPSE_BREAKPOINT}px`);
    }
    saveState() {
        if (!this.isMobile) {
            localStorage.setItem('sidebarState', JSON.stringify({
                state: this.currentState,
                isMobile: this.isMobile
            }));
        }
    }
    restoreState() {
        if (this.isMobile) {
            this.currentState = 'collapsed';
            this.isMobileMenuOpen = false;
        }
        else {
            try {
                const savedState = localStorage.getItem('sidebarState');
                if (savedState) {
                    const state = JSON.parse(savedState);
                    if (!state.isMobile) {
                        this.currentState = state.state || 'expanded';
                    }
                }
            }
            catch (error) {
                console.error('Error restoring sidebar state:', error);
                this.currentState = 'expanded';
            }
        }
    }
    getCurrentState() {
        return this.currentState;
    }
    isMobileView() {
        return this.isMobile;
    }
    getMobileMenuOpen() {
        return this.isMobileMenuOpen;
    }
}
exports.SidebarManager = SidebarManager;
//# sourceMappingURL=sidebar-manager.js.map