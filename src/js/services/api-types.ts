// TypeScript interfaces matching C# models from Controllers/ApiController.cs and .references/YouTubeMusicAPI

// Base interfaces
export interface NamedEntity {
    name: string;
    id: string;
}

export interface Thumbnail {
    url: string;
    width: number;
    height: number;
}

export interface Radio {
    browseId: string;
    name: string;
}

export interface PlayabilityStatus {
    status: string;
    reason?: string;
}

export interface PlaybackTracking {
    videostatsPlaybackUrl: string;
    videostatsDelayplayUrl: string;
    videostatsWatchtimeUrl: string;
    ptrackingUrl: string;
    qoeUrl: string;
    atrUrl: string;
    videostatsScheduledFlushWalltimeSeconds: number[];
    videostatsDefaultFlushIntervalSeconds: number;
}

// Search interfaces
export enum SearchCategory {
    Songs = 'Songs',
    Videos = 'Videos',
    Albums = 'Albums',
    CommunityPlaylists = 'CommunityPlaylists',
    Artists = 'Artists',
    Podcasts = 'Podcasts',
    Episodes = 'Episodes',
    Profiles = 'Profiles'
}

export interface SearchResult {
    name: string;
    id: string;
    thumbnails: Thumbnail[];
    category: SearchCategory;
}

export interface SongSearchResult extends SearchResult {
    artists: NamedEntity[];
    album: NamedEntity;
    duration: string; // TimeSpan as string
    isExplicit: boolean;
    playsInfo: string;
    radio?: Radio;
}

export interface VideoSearchResult extends SearchResult {
    artists: NamedEntity[];
    duration: string;
    isExplicit: boolean;
    playsInfo: string;
}

export interface AlbumSearchResult extends SearchResult {
    artists: NamedEntity[];
    year: string;
    isExplicit: boolean;
}

export interface ArtistSearchResult extends SearchResult {
    subscribers: string;
    songsCount: string;
}

export interface CommunityPlaylistSearchResult extends SearchResult {
    author: string;
    songsCount: string;
}

export interface PodcastSearchResult extends SearchResult {
    author: string;
}

export interface EpisodeSearchResult extends SearchResult {
    author: string;
    duration: string;
}

export interface ProfileSearchResult extends SearchResult {
    subscribers: string;
}

// Info interfaces
export interface SongVideoInfo {
    name: string;
    id: string;
    browseId: string;
    description: string;
    artists: NamedEntity[];
    album?: NamedEntity;
    duration: string;
    radio?: Radio;
    playabilityStatus: PlayabilityStatus;
    isRatingsAllowed: boolean;
    isPrivate: boolean;
    isUnlisted: boolean;
    isLiveContent: boolean;
    isFamiliyFriendly: boolean;
    isExplicit: boolean;
    viewsCount: number;
    publishedAt: string; // DateTime as string
    uploadedAt: string; // DateTime as string
    playbackTracking?: PlaybackTracking;
    thumbnails: Thumbnail[];
    tags: string[];
}

export interface AlbumInfo {
    name: string;
    id: string;
    browseId: string;
    description: string;
    artists: NamedEntity[];
    year: string;
    isExplicit: boolean;
    thumbnails: Thumbnail[];
    songs: AlbumSong[];
}

export interface AlbumSong {
    name: string;
    id: string;
    artists: NamedEntity[];
    duration: string;
    isExplicit: boolean;
    thumbnails: Thumbnail[];
}

export interface ArtistInfo {
    name: string;
    id: string;
    browseId: string;
    description: string;
    subscribers: string;
    thumbnails: Thumbnail[];
    songs: ArtistSong[];
    albums: ArtistAlbum[];
    featuredOn: ArtistFeaturedOn[];
}

export interface ArtistSong {
    name: string;
    id: string;
    album: NamedEntity;
    duration: string;
    isExplicit: boolean;
    thumbnails: Thumbnail[];
}

export interface ArtistAlbum {
    name: string;
    id: string;
    year: string;
    isExplicit: boolean;
    thumbnails: Thumbnail[];
}

export interface ArtistFeaturedOn {
    name: string;
    id: string;
    thumbnails: Thumbnail[];
}

// Streaming interfaces
export interface StreamInfo {
    itag: number;
    url: string;
    mimeType: string;
    bitrate: number;
    width?: number;
    height?: number;
    contentLength: number;
    quality: string;
    fps?: number;
    qualityLabel?: string;
    projectionType: string;
    averageBitrate?: number;
    audioQuality?: string;
    approxDurationMs: string;
    audioSampleRate?: string;
    audioChannels?: number;
    loudnessDb?: number;
}

export interface AudioStreamInfo extends StreamInfo {
    audioQuality: string;
    audioSampleRate: string;
    audioChannels: number;
    loudnessDb: number;
}

export interface VideoStreamInfo extends StreamInfo {
    width: number;
    height: number;
    fps: number;
    qualityLabel: string;
}

export interface StreamingData {
    streamInfo: StreamInfo[];
    isLiveContent: boolean;
    expiresIn: string; // TimeSpan as string
    hlsManifestUrl?: string;
}

// Library interfaces
export interface LibrarySong {
    name: string;
    id: string;
    artists: NamedEntity[];
    album: NamedEntity;
    duration: string;
    isExplicit: boolean;
    thumbnails: Thumbnail[];
}

export interface LibraryAlbum {
    name: string;
    id: string;
    artists: NamedEntity[];
    year: string;
    isExplicit: boolean;
    thumbnails: Thumbnail[];
}

export interface LibraryArtist {
    name: string;
    id: string;
    subscribers: string;
    thumbnails: Thumbnail[];
}

export interface LibrarySubscription {
    name: string;
    id: string;
    subscribers: string;
    thumbnails: Thumbnail[];
}

export interface LibraryPodcast {
    name: string;
    id: string;
    author: string;
    thumbnails: Thumbnail[];
}

export interface LibraryCommunityPlaylist {
    name: string;
    id: string;
    author: string;
    songsCount: string;
    thumbnails: Thumbnail[];
}

// Response interfaces
export interface ErrorResponse {
    error: string;
    details?: string;
}

export interface SearchResponse {
    results: SearchResult[];
    totalCount: number;
    query: string;
    category?: string;
}

export interface SongVideoInfoResponse extends SongVideoInfo {
    streamingData?: StreamingData;
    lyrics?: LyricsApiResponse;
}

export interface LibraryResponse {
    songs: LibrarySong[];
    albums: LibraryAlbum[];
    artists: LibraryArtist[];
    subscriptions: LibrarySubscription[];
    podcasts: LibraryPodcast[];
    playlists: LibraryCommunityPlaylist[];
}

export interface LibrarySongsResponse {
    songs: LibrarySong[];
    totalCount: number;
}

export interface LibraryAlbumsResponse {
    albums: LibraryAlbum[];
    totalCount: number;
}

export interface LibraryArtistsResponse {
    artists: LibraryArtist[];
    totalCount: number;
}

export interface LibrarySubscriptionsResponse {
    subscriptions: LibrarySubscription[];
    totalCount: number;
}

export interface LibraryPodcastsResponse {
    podcasts: LibraryPodcast[];
    totalCount: number;
}

export interface LibraryPlaylistsResponse {
    playlists: LibraryCommunityPlaylist[];
    totalCount: number;
}

export interface PlaylistResponse {
    id: string;
    browseId: string;
    playlist?: any;
    songs: any[];
    totalSongs: number;
}

export interface HealthResponse {
    status: string;
    version: string;
    name: string;
    timestamp: string; // DateTime as string
    runtime: RuntimeInfo;
    environment: EnvironmentInfo;
}

export interface RuntimeInfo {
    framework: string;
    os: string;
    uptimeSeconds: number;
    memoryUsageMB: number;
}

export interface EnvironmentInfo {
    environment: string;
    cookiesConfigured: boolean;
    poTokenServerConfigured: boolean;
    poTokenServer?: string;
    authStatus?: AuthStatus;
}

export interface AuthStatus {
    cookiesConfigured: boolean;
    poTokenServerConfigured: boolean;
    poTokenServerReachable: boolean;
    cookiesValid: boolean;
    cookieValidationResult?: CookieValidationResult;
    visitorData?: string;
    poToken?: string;
    contentBinding?: string;
    lastGenerated?: string; // DateTime as string
    errorMessage?: string;
}

export interface CookieValidationResult {
    isValid: boolean;
    missingCookies: string[];
    presentCookies: string[];
    summary: string;
}

// Lyrics interfaces (from .references/lyrics)
export interface LyricsData {
    id: string;
    videoId: string;
    songTitle: string;
    artistName: string;
    albumName: string;
    durationSeconds: number;
    plainLyric: string;
    syncedLyrics: string;
    richSyncLyrics: string;
    vote: number;
    contributor: string;
    contributorEmail: string;
}

export interface LyricsSuccessResponse {
    type: string;
    data: LyricsData[];
    success: boolean;
}

export interface LyricsErrorResponse {
    error: boolean;
    code: number;
    reason: string;
    timeout?: string; // TimeSpan as string
    videoId?: string;
    url?: string;
}

export interface LyricsProcessingResponse {
    code: number;
    message: string;
}

export interface LyricsApiResponse {
    data?: LyricsData[];
    error?: LyricsErrorResponse;
    processing?: LyricsProcessingResponse;
    success: boolean;
}

// PoToken interface
export interface PoTokenResponse {
    contentBinding?: string;
    poToken?: string;
    expiresAt?: string; // ISO 8601 format
}
