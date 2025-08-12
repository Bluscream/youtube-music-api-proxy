// Type definitions for the YouTube Music API Proxy
// Re-export types from API service for convenience
export type {
    // Base types
    NamedEntity,
    Thumbnail,
    Radio,
    PlayabilityStatus,
    PlaybackTracking,

    // Search types
    SearchResult,
    SongSearchResult,
    VideoSearchResult,
    AlbumSearchResult,
    ArtistSearchResult,
    CommunityPlaylistSearchResult,
    PodcastSearchResult,
    EpisodeSearchResult,
    ProfileSearchResult,

    // Info types
    SongVideoInfo,
    AlbumInfo,
    ArtistInfo,
    AlbumSong,
    ArtistSong,
    ArtistAlbum,
    ArtistFeaturedOn,

    // Streaming types
    StreamInfo,
    AudioStreamInfo,
    VideoStreamInfo,
    StreamingData,

    // Library types
    LibrarySong,
    LibraryAlbum,
    LibraryArtist,
    LibrarySubscription,
    LibraryPodcast,
    LibraryCommunityPlaylist,

    // Response types
    ErrorResponse,
    SearchResponse,
    SongVideoInfoResponse,
    LibraryResponse,
    LibrarySongsResponse,
    LibraryAlbumsResponse,
    LibraryArtistsResponse,
    LibrarySubscriptionsResponse,
    LibraryPodcastsResponse,
    LibraryPlaylistsResponse,
    PlaylistResponse,
    HealthResponse,
    RuntimeInfo,
    EnvironmentInfo,

    // Lyrics types
    LyricsData,
    LyricsSuccessResponse,
    LyricsErrorResponse,
    LyricsProcessingResponse,
    LyricsApiResponse,

    // PoToken types
    PoTokenResponse
} from './services/api-types';

// Re-export enums
export { SearchCategory } from './services/api-types';

// Application-specific types
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
    currentPlaylistSongs: SongSearchResult[];
    currentSongIndex: number;
    playlists: PlaylistResponse[];
}

export interface UIState {
    isMobileMenuOpen: boolean;
    isSidebarCollapsed: boolean;
    isRightSidebarCollapsed: boolean;
    rightSidebarWidth: number;
    currentTab: TabType;
}

// Legacy type aliases for backward compatibility
import type { SongSearchResult, PlaylistResponse, LibraryResponse, SearchResponse } from './services/api-types';
export type SongInfo = SongSearchResult;
export type PlaylistInfo = PlaylistResponse;
export type LibraryData = LibraryResponse;
export type SearchResults = SearchResponse;
