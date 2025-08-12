import { SidebarState } from './types';
import { SIDEBAR_COLLAPSE_BREAKPOINT } from './settings';

export class SidebarManager {
    private isMobile: boolean = false;
    private currentState: SidebarState = 'expanded';
    private isMobileMenuOpen: boolean = false;

    constructor() {
        this.init();
    }

    private init(): void {
        this.updateBreakpoint();
        this.setupEventListeners();
        this.restoreState();
        this.updateLayout();
    }

    private updateBreakpoint(): void {
        this.isMobile = window.innerWidth <= SIDEBAR_COLLAPSE_BREAKPOINT;
    }

    private setupEventListeners(): void {
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
                    !sidebar.contains(event.target as Node) &&
                    !mobileMenuToggle.contains(event.target as Node)) {
                    this.closeMobileMenu();
                }
            }
        });

        document.addEventListener('keydown', (event) => {
            if (this.isMobile) return;
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
                } else {
                    this.setState('full');
                }
            });
        }
    }

    private handleBreakpointChange(): void {
        if (this.isMobile) {
            this.currentState = 'collapsed';
            this.isMobileMenuOpen = false;
            this.saveState();
        } else {
            this.restoreState();
        }
    }

    public toggle(): void {
        if (this.isMobile) {
            this.toggleMobileMenu();
        } else {
            this.cycleState();
        }
    }

    private toggleMobileMenu(): void {
        this.isMobileMenuOpen = !this.isMobileMenuOpen;
        this.updateLayout();
        this.saveState();
    }

    private closeMobileMenu(): void {
        this.isMobileMenuOpen = false;
        this.updateLayout();
        this.saveState();
    }

    private cycleState(): void {
        const states: SidebarState[] = ['expanded', 'icon', 'collapsed', 'full'];
        const currentIndex = states.indexOf(this.currentState);
        const nextIndex = (currentIndex + 1) % states.length;
        this.setState(states[nextIndex]);
    }

    public setState(state: SidebarState): void {
        this.currentState = state;
        this.updateLayout();
        this.saveState();
    }

    private updateLayout(): void {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        const playerBar = document.querySelector('.player-bar') as HTMLElement;

        if (!sidebar || !mainContent || !playerBar) return;

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
            } else {
                sidebar.classList.remove('mobile-open');
                mainContent.classList.remove('mobile-menu-open');
            }
        }

        // Update CSS breakpoints
        this.updateCSSBreakpoints();
    }

    private updateCSSBreakpoints(): void {
        const root = document.documentElement;
        root.style.setProperty('--sidebar-collapse-breakpoint', `${SIDEBAR_COLLAPSE_BREAKPOINT}px`);
    }

    private saveState(): void {
        if (!this.isMobile) {
            localStorage.setItem('sidebarState', JSON.stringify({
                state: this.currentState,
                isMobile: this.isMobile
            }));
        }
    }

    private restoreState(): void {
        if (this.isMobile) {
            this.currentState = 'collapsed';
            this.isMobileMenuOpen = false;
        } else {
            try {
                const savedState = localStorage.getItem('sidebarState');
                if (savedState) {
                    const state = JSON.parse(savedState);
                    if (!state.isMobile) {
                        this.currentState = state.state || 'expanded';
                    }
                }
            } catch (error) {
                console.error('Error restoring sidebar state:', error);
                this.currentState = 'expanded';
            }
        }
    }

    public getCurrentState(): SidebarState {
        return this.currentState;
    }

    public isMobileView(): boolean {
        return this.isMobile;
    }

    public getMobileMenuOpen(): boolean {
        return this.isMobileMenuOpen;
    }
}
