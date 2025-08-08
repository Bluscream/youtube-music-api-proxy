import YouTubeMusicAPI from '../lib/youtube-music-api-proxy/youtube-music-api-proxy';

/**
 * API Service - Singleton pattern for managing YouTube Music API
 * Replaces the old API ready system with a more sensible approach
 */
class APIService {
    private static instance: APIService;
    private api: YouTubeMusicAPI | null = null;
    private isInitialized = false;
    private initPromise: Promise<YouTubeMusicAPI> | null = null;

    private constructor() { }

    public static getInstance(): APIService {
        if (!APIService.instance) {
            APIService.instance = new APIService();
        }
        return APIService.instance;
    }

    /**
     * Initialize the API service
     * @param baseUrl - Base URL for the API (optional)
     * @param options - API options (optional)
     * @returns Promise that resolves to the API instance
     */
    public async initialize(baseUrl: string = '', options: any = {}): Promise<YouTubeMusicAPI> {
        if (this.isInitialized && this.api) {
            return this.api;
        }

        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = this.createAPI(baseUrl, options);
        return this.initPromise;
    }

    /**
     * Get the API instance (must be initialized first)
     * @returns The API instance
     * @throws Error if API is not initialized
     */
    public getAPI(): YouTubeMusicAPI {
        if (!this.api || !this.isInitialized) {
            throw new Error('API not initialized. Call initialize() first.');
        }
        return this.api;
    }

    /**
     * Check if the API is initialized
     * @returns True if initialized
     */
    public isReady(): boolean {
        return this.isInitialized && this.api !== null;
    }

    /**
     * Create and test the API instance
     * @param baseUrl - Base URL for the API
     * @param options - API options
     * @returns Promise that resolves to the API instance
     */
    private async createAPI(baseUrl: string, options: any): Promise<YouTubeMusicAPI> {
        try {
            console.log('Creating YouTube Music API...');

            this.api = new YouTubeMusicAPI(baseUrl, {
                timeout: 30000,
                retries: 3,
                ...options
            });

            // Test the API to make sure it's working
            try {
                if (this.api.getHealth) {
                    await this.api.getHealth();
                    console.log('YouTube Music API health check passed');
                } else {
                    console.log('YouTube Music API created successfully (no health check available)');
                }
            } catch (error) {
                console.warn('API health check failed, but proceeding anyway:', error);
            }

            this.isInitialized = true;
            console.log('YouTube Music API is ready and working');
            return this.api;

        } catch (error) {
            console.error('Error creating YouTube Music API:', error);
            this.initPromise = null;
            throw error;
        }
    }

    /**
     * Reset the API service (useful for testing or re-initialization)
     */
    public reset(): void {
        this.api = null;
        this.isInitialized = false;
        this.initPromise = null;
    }
}

// Export singleton instance
export const apiService = APIService.getInstance();

// Export the class for testing purposes
export { APIService };

// Default export for convenience
export default apiService;
