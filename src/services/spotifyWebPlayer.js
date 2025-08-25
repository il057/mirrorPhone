import { SPOTIFY_CONFIG } from '../config/spotify.js';

class SpotifyWebPlayer {
        constructor() {
                this.player = null;
                this.deviceId = null;
                this.isReady = false;
                this.callbacks = {
                        onStateChange: [],
                        onReady: [],
                        onError: []
                };
        }

        // 初始化Web Playback SDK
        async initialize(accessToken) {
                return new Promise((resolve, reject) => {
                        // 检查是否已经加载了SDK
                        if (window.Spotify) {
                                this.createPlayer(accessToken, resolve, reject);
                                return;
                        }

                        // 检查SDK是否正在加载
                        if (window.spotifySDKLoading) {
                                // 等待SDK加载完成
                                const checkSDK = () => {
                                        if (window.Spotify) {
                                                this.createPlayer(accessToken, resolve, reject);
                                        } else {
                                                setTimeout(checkSDK, 100);
                                        }
                                };
                                checkSDK();
                                return;
                        }

                        // 标记SDK正在加载
                        window.spotifySDKLoading = true;

                        // 动态加载Spotify Web Playback SDK
                        const script = document.createElement('script');
                        script.src = 'https://sdk.scdn.co/spotify-player.js';
                        script.async = true;

                        // 设置全局回调函数
                        window.onSpotifyWebPlaybackSDKReady = () => {
                                window.spotifySDKLoading = false;
                                this.createPlayer(accessToken, resolve, reject);
                        };

                        script.onload = () => {
                                // Script loaded, but we need to wait for onSpotifyWebPlaybackSDKReady
                        };

                        script.onerror = () => {
                                window.spotifySDKLoading = false;
                                reject(new Error('Failed to load Spotify Web Playback SDK'));
                        };

                        document.head.appendChild(script);
                });
        }

        // 创建播放器实例
        createPlayer(accessToken, resolve, reject) {
                try {
                        this.player = new window.Spotify.Player({
                                name: 'MirrorPhone Web Player',
                                getOAuthToken: cb => { cb(accessToken); },
                                volume: 0.5
                        });

                        // 错误处理
                        this.player.addListener('initialization_error', ({ message }) => {
                                console.error('初始化错误:', message);
                                this.triggerCallback('onError', message);
                                reject(new Error(message));
                        });

                        this.player.addListener('authentication_error', ({ message }) => {
                                console.error('认证错误:', message);
                                this.triggerCallback('onError', message);
                                reject(new Error(message));
                        });

                        this.player.addListener('account_error', ({ message }) => {
                                console.error('账户错误:', message);
                                this.triggerCallback('onError', message);
                                reject(new Error(message));
                        });

                        this.player.addListener('playback_error', ({ message }) => {
                                console.error('播放错误:', message);
                                this.triggerCallback('onError', message);
                        });

                        // 播放器准备就绪
                        this.player.addListener('ready', ({ device_id }) => {
                                console.log('Spotify Web Player 准备就绪，设备ID:', device_id);
                                this.deviceId = device_id;
                                this.isReady = true;
                                this.triggerCallback('onReady', device_id);
                                resolve(device_id);
                        });

                        // 播放器未准备好
                        this.player.addListener('not_ready', ({ device_id }) => {
                                console.log('Spotify Web Player 未准备好，设备ID:', device_id);
                                this.isReady = false;
                        });

                        // 播放状态变化
                        this.player.addListener('player_state_changed', (state) => {
                                if (state) {
                                        this.triggerCallback('onStateChange', state);
                                }
                        });

                        // 连接播放器
                        this.player.connect().then(success => {
                                if (!success) {
                                        reject(new Error('Failed to connect to Spotify Web Player'));
                                }
                        });

                } catch (error) {
                        reject(error);
                }
        }

        // 注册回调函数
        on(event, callback) {
                if (this.callbacks[event]) {
                        this.callbacks[event].push(callback);
                }
        }

        // 移除回调函数
        off(event, callback) {
                if (this.callbacks[event]) {
                        const index = this.callbacks[event].indexOf(callback);
                        if (index > -1) {
                                this.callbacks[event].splice(index, 1);
                        }
                }
        }

        // 触发回调
        triggerCallback(event, data) {
                if (this.callbacks[event]) {
                        this.callbacks[event].forEach(callback => callback(data));
                }
        }

        // 获取当前播放状态
        async getCurrentState() {
                if (!this.player) return null;
                return this.player.getCurrentState();
        }

        // 播放控制方法
        async play() {
                if (!this.player) throw new Error('Player not initialized');
                return this.player.resume();
        }

        async pause() {
                if (!this.player) throw new Error('Player not initialized');
                return this.player.pause();
        }

        async togglePlay() {
                if (!this.player) throw new Error('Player not initialized');
                return this.player.togglePlay();
        }

        async previousTrack() {
                if (!this.player) throw new Error('Player not initialized');
                return this.player.previousTrack();
        }

        async nextTrack() {
                if (!this.player) throw new Error('Player not initialized');
                return this.player.nextTrack();
        }

        async seek(positionMs) {
                if (!this.player) throw new Error('Player not initialized');
                return this.player.seek(positionMs);
        }

        async setVolume(volume) {
                if (!this.player) throw new Error('Player not initialized');
                return this.player.setVolume(volume);
        }

        // 获取设备ID
        getDeviceId() {
                return this.deviceId;
        }

        // 检查是否准备就绪
        isPlayerReady() {
                return this.isReady;
        }

        // 断开连接
        disconnect() {
                if (this.player) {
                        this.player.disconnect();
                        this.player = null;
                        this.deviceId = null;
                        this.isReady = false;
                }
        }

        // 激活设备（将播放转移到此设备）
        async activateDevice(accessToken) {
                if (!this.deviceId) {
                        throw new Error('Device not ready');
                }

                try {
                        const response = await fetch('https://api.spotify.com/v1/me/player', {
                                method: 'PUT',
                                headers: {
                                        'Authorization': `Bearer ${accessToken}`,
                                        'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                        device_ids: [this.deviceId],
                                        play: false
                                })
                        });

                        if (!response.ok) {
                                throw new Error(`Failed to activate device: ${response.status}`);
                        }

                        console.log('设备已激活');
                        return true;
                } catch (error) {
                        console.error('激活设备失败:', error);
                        throw error;
                }
        }
}

export default new SpotifyWebPlayer();
