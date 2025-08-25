import { SPOTIFY_CONFIG, SPOTIFY_AUTH_URL, SPOTIFY_API_BASE } from '../config/spotify.js';
import spotifyWebPlayer from './spotifyWebPlayer.js';

// PKCE 辅助函数
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

class SpotifyService {
  constructor() {
    this.accessToken = localStorage.getItem('spotify_access_token');
    this.refreshToken = localStorage.getItem('spotify_refresh_token');
    this.tokenExpiry = localStorage.getItem('spotify_token_expiry');
    this.codeVerifier = localStorage.getItem('spotify_code_verifier');
    this.webPlayerReady = false;
  }

  // 初始化Web播放器
  async initializeWebPlayer() {
    if (!this.accessToken || this.webPlayerReady) {
      return;
    }

    try {
      const deviceId = await spotifyWebPlayer.initialize(this.accessToken);
      console.log('Web播放器初始化成功，设备ID:', deviceId);
      
      // 激活设备
      await spotifyWebPlayer.activateDevice(this.accessToken);
      this.webPlayerReady = true;
      
      return deviceId;
    } catch (error) {
      console.error('Web播放器初始化失败:', error);
      throw error;
    }
  }

  // 获取Web播放器实例
  getWebPlayer() {
    return spotifyWebPlayer;
  }

  // 生成登录 URL
  async getAuthUrl() {
    if (!SPOTIFY_CONFIG.CLIENT_ID) {
      throw new Error('Spotify Client ID 未配置');
    }

    // 生成 PKCE 参数
    this.codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(this.codeVerifier);
    
    // 保存 code_verifier 供回调时使用
    localStorage.setItem('spotify_code_verifier', this.codeVerifier);

    const params = new URLSearchParams({
      client_id: SPOTIFY_CONFIG.CLIENT_ID,
      response_type: 'code',
      redirect_uri: SPOTIFY_CONFIG.REDIRECT_URI,
      scope: SPOTIFY_CONFIG.SCOPES,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      show_dialog: 'true'
    });

    return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
  }

  // 处理授权回调
  async handleAuthCallback(code) {
    try {
      // 获取保存的 code_verifier
      const savedCodeVerifier = localStorage.getItem('spotify_code_verifier');
      if (!savedCodeVerifier) {
        throw new Error('缺少 code_verifier');
      }

      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: SPOTIFY_CONFIG.REDIRECT_URI,
          client_id: SPOTIFY_CONFIG.CLIENT_ID,
          code_verifier: savedCodeVerifier,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Token request failed:', errorData);
        throw new Error(`获取访问令牌失败: ${response.status}`);
      }

      const data = await response.json();
      this.saveTokens(data);
      
      // 清除 code_verifier
      localStorage.removeItem('spotify_code_verifier');
      
      return data;
    } catch (error) {
      console.error('授权回调处理失败:', error);
      throw error;
    }
  }

  // 保存令牌
  saveTokens(tokenData) {
    this.accessToken = tokenData.access_token;
    this.refreshToken = tokenData.refresh_token;
    this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000);

    localStorage.setItem('spotify_access_token', this.accessToken);
    localStorage.setItem('spotify_refresh_token', this.refreshToken);
    localStorage.setItem('spotify_token_expiry', this.tokenExpiry);
  }

  // 检查是否已登录
  isLoggedIn() {
    return this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry;
  }

  // 退出登录
  logout() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.codeVerifier = null;

    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_token_expiry');
    localStorage.removeItem('spotify_code_verifier');
  }

  // 发起API请求
  async apiRequest(endpoint, options = {}) {
    if (!this.isLoggedIn()) {
      throw new Error('未登录 Spotify');
    }

    const url = `${SPOTIFY_API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // 令牌过期，尝试刷新
        await this.refreshAccessToken();
        // 重试请求
        return this.apiRequest(endpoint, options);
      }
      throw new Error(`API 请求失败: ${response.status}`);
    }

    // 检查响应内容类型和长度
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    
    // 如果是PUT/POST请求且没有内容，返回空对象
    if ((options.method === 'PUT' || options.method === 'POST') && 
        (contentLength === '0' || !contentType?.includes('application/json'))) {
      return {};
    }

    // 检查是否有JSON内容
    if (!contentType?.includes('application/json')) {
      const text = await response.text();
      if (!text.trim()) {
        return {};
      }
      throw new Error('响应不是JSON格式');
    }

    try {
      const text = await response.text();
      if (!text.trim()) {
        return {};
      }
      return JSON.parse(text);
    } catch (error) {
      console.error('JSON解析失败:', error);
      throw new Error('响应数据格式错误');
    }
  }

  // 刷新访问令牌
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('没有刷新令牌');
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: SPOTIFY_CONFIG.CLIENT_ID,
        }),
      });

      if (!response.ok) {
        throw new Error('刷新令牌失败');
      }

      const data = await response.json();
      this.saveTokens({
        ...data,
        refresh_token: this.refreshToken // 保持原有的刷新令牌
      });
    } catch (error) {
      console.error('刷新令牌失败:', error);
      this.logout();
      throw error;
    }
  }

  // 获取用户信息
  async getCurrentUser() {
    return this.apiRequest('/me');
  }

  // 获取用户的播放列表
  async getUserPlaylists(limit = 20) {
    return this.apiRequest(`/me/playlists?limit=${limit}`);
  }

  // 获取当前播放信息
  async getCurrentPlayback() {
    return this.apiRequest('/me/player');
  }

  // 获取用户的设备列表
  async getDevices() {
    return this.apiRequest('/me/player/devices');
  }

  // 获取播放列表详情
  async getPlaylistTracks(playlistId, limit = 50) {
    return this.apiRequest(`/playlists/${playlistId}/tracks?limit=${limit}`);
  }

  // 播放指定歌曲
  async playTrack(trackUri, deviceId = null) {
    // 优先使用Web播放器
    const webDeviceId = spotifyWebPlayer.getDeviceId();
    if (webDeviceId && spotifyWebPlayer.isPlayerReady()) {
      const targetDeviceId = deviceId || webDeviceId;
      const body = { uris: [trackUri] };
      
      return this.apiRequest(`/me/player/play?device_id=${targetDeviceId}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      });
    }

    // 回退到检查其他设备
    const devices = await this.getDevices();
    const activeDevice = devices.devices?.find(d => d.is_active);
    
    if (!activeDevice && !deviceId) {
      throw new Error('没有找到活跃的播放设备，请先初始化播放器或在Spotify应用中开始播放');
    }

    const body = { uris: [trackUri] };
    const targetDeviceId = deviceId || activeDevice?.id;
    const endpoint = targetDeviceId ? `/me/player/play?device_id=${targetDeviceId}` : '/me/player/play';
    
    return this.apiRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  // 播放播放列表
  async playPlaylist(playlistUri, deviceId = null) {
    // 优先使用Web播放器
    const webDeviceId = spotifyWebPlayer.getDeviceId();
    if (webDeviceId && spotifyWebPlayer.isPlayerReady()) {
      const targetDeviceId = deviceId || webDeviceId;
      const body = { context_uri: playlistUri };
      
      return this.apiRequest(`/me/player/play?device_id=${targetDeviceId}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      });
    }

    // 回退到检查其他设备
    const devices = await this.getDevices();
    const activeDevice = devices.devices?.find(d => d.is_active);
    
    if (!activeDevice && !deviceId) {
      throw new Error('没有找到活跃的播放设备，请先初始化播放器或在Spotify应用中开始播放');
    }

    const body = { context_uri: playlistUri };
    const targetDeviceId = deviceId || activeDevice?.id;
    const endpoint = targetDeviceId ? `/me/player/play?device_id=${targetDeviceId}` : '/me/player/play';
    
    return this.apiRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  // 暂停播放（优先使用Web播放器）
  async pausePlayback() {
    if (spotifyWebPlayer.isPlayerReady()) {
      return spotifyWebPlayer.pause();
    }
    return this.apiRequest('/me/player/pause', { method: 'PUT' });
  }

  // 恢复播放（优先使用Web播放器）
  async resumePlayback() {
    if (spotifyWebPlayer.isPlayerReady()) {
      return spotifyWebPlayer.play();
    }
    return this.apiRequest('/me/player/play', { method: 'PUT' });
  }
}

export default new SpotifyService();
