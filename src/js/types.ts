// Type definitions for the YouTube Music API Proxy

export interface SongInfo {
    id: string;
    title: string;
    artist: string;
    thumbnail?: string;
    duration?: string;
    album?: string;
    year?: string;
    genre?: string;
    description?: string;
    lyrics?: string;
}

export interface PlaylistInfo {
    id: string;
    title: string;
    description?: string;
    thumbnail?: string;
    songCount?: number;
    songs?: SongInfo[];
}

export interface AlbumInfo {
    id: string;
    title: string;
    artist: string;
    thumbnail?: string;
    year?: string;
    genre?: string;
    songs?: SongInfo[];
}

export interface ArtistInfo {
    id: string;
    name: string;
    thumbnail?: string;
    description?: string;
    albums?: AlbumInfo[];
    songs?: SongInfo[];
}

export interface LibraryData {
    songs: SongInfo[];
    albums: AlbumInfo[];
    artists: ArtistInfo[];
    playlists: PlaylistInfo[];
}

export interface SearchResults {
    songs: SongInfo[];
    albums: AlbumInfo[];
    artists: ArtistInfo[];
    playlists: PlaylistInfo[];
}

export type RepeatMode = 'none' | 'one' | 'all';
export type TabType = 'info' | 'lyrics';
export type SidebarState = 'expanded' | 'collapsed' | 'icon' | 'full';

export interface AppSettings {
    repeat: RepeatMode;
    playlist: string | null;
    song: string | null;
    tab: TabType;
    split: number;
}

export interface SettingsKeys {
    PLAYLIST: 'playlist';
    SONG: 'song';
    REPEAT: 'repeat';
    TAB: 'tab';
    RIGHT_SIDEBAR_SPLITTER_POS: 'split';
}

export interface NotificationOptions {
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
}

export interface AudioState {
    currentAudio: HTMLAudioElement | null;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
}

export interface PlaylistState {
    currentPlaylistSongs: SongInfo[];
    currentSongIndex: number;
    playlists: PlaylistInfo[];
}

export interface UIState {
    isMobileMenuOpen: boolean;
    isSidebarCollapsed: boolean;
    isRightSidebarCollapsed: boolean;
    rightSidebarWidth: number;
    currentTab: TabType;
}
