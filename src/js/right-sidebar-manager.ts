import { DEFAULTS, RIGHT_SIDEBAR_TABS, RightSidebarTab } from './constants';

// Right Sidebar Manager
export class RightSidebarManager {
    private isVisible: boolean = false;
    private currentTab: RightSidebarTab = RIGHT_SIDEBAR_TABS.INFO;
    private currentWidth: number = DEFAULTS.RIGHT_SIDEBAR_WIDTH;
    private isResizing: boolean = false;
    private startX: number = 0;
    private startWidth: number = 0;

    constructor() {
        this.init();
    }

    init(): void {
        this.setupEventListeners();
        this.restoreState();
        this.updateLayout();
    }

    setupEventListeners(): void {
        // Resize handle
        const resizeHandle = document.getElementById('rightSidebarResizeHandle');
        if (resizeHandle) {
            resizeHandle.addEventListener('mousedown', (e: MouseEvent) => {
                this.startResize(e);
            });
        }

        // Tab switching
        const infoTab = document.getElementById('infoTab');
        const lyricsTab = document.getElementById('lyricsTab');

        if (infoTab) {
            infoTab.addEventListener('click', () => this.switchTab(RIGHT_SIDEBAR_TABS.INFO));
        }
        if (lyricsTab) {
            lyricsTab.addEventListener('click', () => this.switchTab(RIGHT_SIDEBAR_TABS.LYRICS));
        }

        // Close button
        const closeButton = document.getElementById('rightSidebarClose');
        if (closeButton) {
            closeButton.addEventListener('click', () => this.hide());
        }

        // Global resize events
        document.addEventListener('mousemove', (e: MouseEvent) => {
            if (this.isResizing) {
                this.handleResize(e);
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.isResizing) {
                this.stopResize();
            }
        });
    }

    startResize(e: MouseEvent): void {
        this.isResizing = true;
        this.startX = e.clientX;
        this.startWidth = this.currentWidth;
        document.body.style.cursor = 'col-resize';
        e.preventDefault();
    }

    handleResize(e: MouseEvent): void {
        if (!this.isResizing) return;

        const deltaX = this.startX - e.clientX;
        const newWidth = Math.max(
            DEFAULTS.RIGHT_SIDEBAR_MIN_WIDTH,
            Math.min(DEFAULTS.RIGHT_SIDEBAR_MAX_WIDTH, this.startWidth + deltaX)
        );

        this.currentWidth = newWidth;
        this.updateLayout();
    }

    stopResize(): void {
        this.isResizing = false;
        document.body.style.cursor = '';
        this.saveState();
    }

    switchTab(tab: RightSidebarTab): void {
        this.currentTab = tab;
        this.updateTabContent();
        this.saveState();
    }

    updateTabContent(): void {
        const infoContent = document.getElementById('infoContent');
        const lyricsContent = document.getElementById('lyricsContent');
        const infoTab = document.getElementById('infoTab');
        const lyricsTab = document.getElementById('lyricsTab');

        // Update tab buttons
        if (infoTab) infoTab.classList.toggle('active', this.currentTab === RIGHT_SIDEBAR_TABS.INFO);
        if (lyricsTab) lyricsTab.classList.toggle('active', this.currentTab === RIGHT_SIDEBAR_TABS.LYRICS);

        // Update content visibility
        if (infoContent) infoContent.style.display = this.currentTab === RIGHT_SIDEBAR_TABS.INFO ? 'block' : 'none';
        if (lyricsContent) lyricsContent.style.display = this.currentTab === RIGHT_SIDEBAR_TABS.LYRICS ? 'block' : 'none';
    }

    show(): void {
        this.isVisible = true;
        this.updateLayout();
        this.saveState();
    }

    hide(): void {
        this.isVisible = false;
        this.updateLayout();
        this.saveState();
    }

    toggle(): void {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    updateLayout(): void {
        const rightSidebar = document.getElementById('rightSidebar');
        const mainContent = document.getElementById('mainContent');
        const playerBar = document.querySelector('.player-bar');

        if (!rightSidebar || !mainContent) return;

        if (this.isVisible) {
            rightSidebar.style.width = `${this.currentWidth}px`;
            rightSidebar.style.display = 'block';
            mainContent.style.marginRight = `${this.currentWidth}px`;
            if (playerBar) {
                (playerBar as HTMLElement).style.marginRight = `${this.currentWidth}px`;
            }
        } else {
            rightSidebar.style.display = 'none';
            mainContent.style.marginRight = '0';
            if (playerBar) {
                (playerBar as HTMLElement).style.marginRight = '0';
            }
        }
    }

    updateInfoPanel(songInfo: any): void {
        const infoContent = document.getElementById('infoContent');
        if (!infoContent || !songInfo) return;

        const title = songInfo.name || songInfo.title || 'Unknown Title';
        const artist = songInfo.artists && songInfo.artists.length > 0 ? songInfo.artists[0].name : 'Unknown Artist';
        const album = songInfo.album || 'Unknown Album';
        const duration = songInfo.duration || 'Unknown';
        const thumbnail = songInfo.thumbnails && songInfo.thumbnails.length > 0 ? songInfo.thumbnails[0].url : '';

        infoContent.innerHTML = `
            <div class="song-info">
                <img src="${thumbnail}" alt="${title}" class="song-thumbnail">
                <h3>${title}</h3>
                <p class="artist">${artist}</p>
                <p class="album">${album}</p>
                <p class="duration">${duration}</p>
            </div>
        `;

        this.show();
    }

    updateLyricsPanel(lyrics: string): void {
        const lyricsContent = document.getElementById('lyricsContent');
        if (!lyricsContent) return;

        lyricsContent.innerHTML = `
            <div class="lyrics-content">
                <pre>${lyrics || 'No lyrics available'}</pre>
            </div>
        `;

        this.switchTab(RIGHT_SIDEBAR_TABS.LYRICS);
        this.show();
    }

    clearInfoPanel(): void {
        const infoContent = document.getElementById('infoContent');
        const lyricsContent = document.getElementById('lyricsContent');

        if (infoContent) infoContent.innerHTML = '';
        if (lyricsContent) lyricsContent.innerHTML = '';

        this.hide();
    }

    saveState(): void {
        localStorage.setItem('rightSidebarState', JSON.stringify({
            isVisible: this.isVisible,
            currentTab: this.currentTab,
            currentWidth: this.currentWidth
        }));
    }

    restoreState(): void {
        try {
            const savedState = localStorage.getItem('rightSidebarState');
            if (savedState) {
                const state = JSON.parse(savedState);
                this.isVisible = state.isVisible || false;
                this.currentTab = state.currentTab || RIGHT_SIDEBAR_TABS.INFO;
                this.currentWidth = state.currentWidth || DEFAULTS.RIGHT_SIDEBAR_WIDTH;
            }
        } catch (error) {
            console.error('Error restoring right sidebar state:', error);
        }
    }
}

// Create global instance
window.rightSidebarManager = new RightSidebarManager();

// Global functions for onclick handlers
window.toggleRightSidebar = () => window.rightSidebarManager.toggle();
window.showRightSidebar = () => window.rightSidebarManager.show();
window.hideRightSidebar = () => window.rightSidebarManager.hide();
window.clearInfoPanel = () => window.rightSidebarManager.clearInfoPanel();
