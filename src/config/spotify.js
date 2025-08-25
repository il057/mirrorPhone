// Spotify API 配置
export const SPOTIFY_CONFIG = {
        CLIENT_ID: 'd060cc92cb3346e8a1e2327b3826f35c',
        REDIRECT_URI: window.location.origin + '/music',
        // REDIRECT_URI: 'http://127.0.0.1:5173/music',
        SCOPES: [
                'user-read-private',
                'user-read-email',
                'user-read-playback-state',
                'user-modify-playback-state',
                'user-read-currently-playing',
                'user-library-read',
                'user-library-modify',
                'playlist-read-private',
                'playlist-read-collaborative',
                'playlist-modify-private',
                'playlist-modify-public',
                'streaming'
        ].join(' ')
};

// Spotify Web API 基础 URL
export const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

// Spotify 授权 URL
export const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
