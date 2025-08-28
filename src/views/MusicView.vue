<template>
        <div class="page-container">
                <Header title="音乐" />

                <main class="music-content content">
                        <!-- 未登录状态 -->
                        <div v-if="!isLoggedIn" class="login-section">
                                <div class="spotify-logo">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                fill="#1DB954" class="bi bi-spotify" viewBox="0 0 16 16">
                                                <path
                                                        d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0m3.669 11.538a.5.5 0 0 1-.686.165c-1.879-1.147-4.243-1.407-7.028-.77a.499.499 0 0 1-.222-.973c3.048-.696 5.662-.397 7.77.892a.5.5 0 0 1 .166.686m.979-2.178a.624.624 0 0 1-.858.205c-2.15-1.321-5.428-1.704-7.972-.932a.625.625 0 0 1-.362-1.194c2.905-.881 6.517-.454 8.986 1.063a.624.624 0 0 1 .206.858m.084-2.268C10.154 5.56 5.9 5.419 3.438 6.166a.748.748 0 1 1-.434-1.432c2.825-.857 7.523-.692 10.492 1.07a.747.747 0 1 1-.764 1.288" />
                                        </svg>
                                </div>

                                <h2 class="welcome-title">连接到 Spotify</h2>
                                <p class="welcome-description">
                                        登录您的 Spotify 账户来播放音乐、管理播放列表和控制播放设备。
                                </p>

                                <button @click="loginToSpotify" :disabled="isLoading || !hasClientId"
                                        class="login-button">
                                        <span v-if="isLoading" class="loading-spinner"></span>
                                        <span v-else-if="!hasClientId">需要配置 Client ID</span>
                                        <span v-else>登录 Spotify</span>
                                </button>

                                <div v-if="!hasClientId" class="client-id-warning">
                                        <p>请先在配置文件中添加 Spotify Client ID</p>
                                </div>
                        </div>

                        <!-- 已登录状态 -->
                        <div v-else class="main-content">
                                <!-- 用户信息 -->
                                <div v-if="userProfile" class="user-section">
                                        <div class="user-info">
                                                <div class="user-avatar">
                                                        <img v-if="userProfile.images && userProfile.images[0]"
                                                                :src="userProfile.images[0].url"
                                                                :alt="userProfile.display_name">
                                                        <div v-else class="avatar-placeholder">
                                                                {{ userProfile.display_name?.[0]?.toUpperCase() || 'U'
                                                                }}
                                                        </div>
                                                </div>
                                                <div class="user-details">
                                                        <h3>{{ userProfile.display_name || '用户' }}</h3>
                                                        <p>{{ userProfile.followers?.total || 0 }} 关注者</p>
                                                </div>
                                        </div>
                                        <!-- 一起听状态显示（右上角） -->
                                        <div v-if="globalListenTogetherText" class="listen-together-status">
                                                {{ globalListenTogetherText }}
                                        </div>
                                        <!-- Web播放器初始化按钮 -->
                                        <div class="player-controls">
                                                <button v-if="!webPlayerReady" @click="initializePlayer"
                                                        :disabled="isInitializingPlayer" class="init-player-btn">
                                                        <span v-if="isInitializingPlayer"
                                                                class="loading-spinner"></span>
                                                        <span v-else>创建播放设备</span>
                                                </button>
                                                <span v-else class="player-status">播放设备已就绪</span>
                                        </div>
                                </div>

                                <!-- Spotify播放器组件 -->
                                <div v-if="webPlayerReady" class="player-section">
                                        <SpotifyPlayer :mini="false" :showPlaylistSelector="true" :autoRefresh="true"
                                                @trackChange="handleTrackChange" @playbackChange="handlePlaybackChange"
                                                @error="handlePlayerError" ref="spotifyPlayer" />
                                </div>

                                <!-- 播放列表 -->
                                <div v-if="playlists && playlists.length > 0" class="playlists-section">
                                        <h4>我的播放列表</h4>
                                        <div class="playlists-grid">
                                                <div v-for="playlist in playlists" :key="playlist.id"
                                                        class="playlist-item" @click="openPlaylist(playlist)">
                                                        <div class="playlist-image">
                                                                <img v-if="playlist.images && playlist.images[0]"
                                                                        :src="playlist.images[0].url"
                                                                        :alt="playlist.name">
                                                                <div v-else class="playlist-placeholder">🎵</div>
                                                        </div>
                                                        <div class="playlist-info">
                                                                <div class="playlist-name">{{ playlist.name }}</div>
                                                                <div class="playlist-tracks">{{ playlist.tracks?.total
                                                                        || 0 }} 首歌曲</div>
                                                        </div>
                                                </div>
                                        </div>
                                </div>

                                <!-- 退出登录按钮 -->
                                <div class="logout-section">
                                        <button @click="logout" class="logout-button">
                                                退出登录
                                        </button>
                                </div>
                        </div>

                        <!-- 错误提示 -->
                        <div v-if="error" class="error-message">
                                <p>{{ error }}</p>
                                <button @click="clearError" class="clear-error-btn">知道了</button>
                        </div>
                </main>

                <!-- 播放列表详情弹窗 -->
                <div v-if="showPlaylistModal" class="modal-overlay" @click="closePlaylist">
                        <div class="playlist-modal" @click.stop>
                                <div class="playlist-header">
                                        <button @click="closePlaylist" class="close-btn">×</button>
                                        <div v-if="selectedPlaylist" class="playlist-details">
                                                <div class="playlist-cover">
                                                        <img v-if="selectedPlaylist.images && selectedPlaylist.images[0]"
                                                                :src="selectedPlaylist.images[0].url"
                                                                :alt="selectedPlaylist.name">
                                                        <div v-else class="cover-placeholder">🎵</div>
                                                </div>
                                                <h3>{{ selectedPlaylist.name }}</h3>
                                                <p>{{ selectedPlaylist.tracks?.total || 0 }} 首歌曲</p>
                                                <button @click="playPlaylist(selectedPlaylist)"
                                                        class="play-playlist-btn">
                                                        播放播放列表
                                                </button>
                                        </div>
                                </div>

                                <div class="tracks-list">
                                        <div v-if="isLoadingTracks" class="loading-tracks">
                                                <div class="loading-spinner"></div>
                                                <p>加载歌曲中...</p>
                                        </div>
                                        <div v-else-if="playlistTracks.length > 0" class="tracks-container">
                                                <div v-for="(item, index) in playlistTracks"
                                                        :key="item.track?.id || index" class="track-item"
                                                        @click="playTrack(item.track)">
                                                        <div class="track-number">{{ index + 1 }}</div>
                                                        <div class="track-image">
                                                                <img v-if="item.track?.album?.images?.[0]"
                                                                        :src="item.track.album.images[0].url"
                                                                        :alt="item.track.name">
                                                                <div v-else class="track-placeholder">🎵</div>
                                                        </div>
                                                        <div class="track-info">
                                                                <div class="track-name">{{ item.track?.name || '未知歌曲' }}
                                                                </div>
                                                                <div class="track-artist">
                                                                        {{item.track?.artists?.map(a => a.name).join(', ') || '未知艺术家' }}
                                                                </div>
                                                        </div>
                                                </div>
                                        </div>
                                </div>
                        </div>

                        <!-- 错误提示 -->
                        <div v-if="error" class="error-message">
                                <p>{{ error }}</p>
                                <button @click="clearError" class="clear-error-btn">知道了</button>
                        </div>
                </div>

                <!-- 播放列表详情弹窗 -->
                <div v-if="showPlaylistModal" class="modal-overlay" @click="closePlaylist">
                        <div class="playlist-modal" @click.stop>
                                <div class="playlist-header">
                                        <button @click="closePlaylist" class="close-btn">×</button>
                                        <div v-if="selectedPlaylist" class="playlist-details">
                                                <div class="playlist-cover">
                                                        <img v-if="selectedPlaylist.images && selectedPlaylist.images[0]"
                                                                :src="selectedPlaylist.images[0].url"
                                                                :alt="selectedPlaylist.name">
                                                        <div v-else class="cover-placeholder">🎵</div>
                                                </div>
                                                <h3>{{ selectedPlaylist.name }}</h3>
                                                <p>{{ selectedPlaylist.tracks?.total || 0 }} 首歌曲</p>
                                                <button @click="playPlaylist(selectedPlaylist)"
                                                        class="play-playlist-btn">
                                                        播放播放列表
                                                </button>
                                        </div>
                                </div>

                                <div class="tracks-list">
                                        <div v-if="isLoadingTracks" class="loading-tracks">
                                                <div class="loading-spinner"></div>
                                                <p>加载歌曲中...</p>
                                        </div>
                                        <div v-else-if="playlistTracks.length > 0" class="tracks-container">
                                                <div v-for="(item, index) in playlistTracks"
                                                        :key="item.track?.id || index" class="track-item"
                                                        @click="playTrack(item.track)">
                                                        <div class="track-number">{{ index + 1 }}</div>
                                                        <div class="track-image">
                                                                <img v-if="item.track?.album?.images?.[0]"
                                                                        :src="item.track.album.images[0].url"
                                                                        :alt="item.track.name">
                                                                <div v-else class="track-placeholder">🎵</div>
                                                        </div>
                                                        <div class="track-info">
                                                                <div class="track-name">{{ item.track?.name || '未知歌曲' }}
                                                                </div>
                                                                <div class="track-artist">
                                                                        {{ item.track?.artists?.map(a => a.name).join(', ') || '未知艺术家' }}
                                                                </div>
                                                        </div>
                                                        <div class="track-duration">
                                                                {{ formatDuration(item.track?.duration_ms) }}
                                                        </div>
                                                </div>
                                        </div>
                                        <div v-else class="no-tracks">
                                                <p>暂无歌曲</p>
                                        </div>
                                </div>
                        </div>
                </div>
        </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Header from '../components/layout/Header.vue';
import SpotifyPlayer from '../components/ui/SpotifyPlayer.vue';
import spotifyService from '../services/spotifyService.js';
import * as listenTogetherService from '../services/listenTogetherService.js';
import { formatDuration } from '../utils/datetime.js';
import { SPOTIFY_CONFIG } from '../config/spotify.js';

const router = useRouter();
const route = useRoute();

// 响应式数据
const isLoggedIn = ref(false);
const isLoading = ref(false);
const error = ref('');
const userProfile = ref(null);
const playlists = ref([]);
const webPlayerReady = ref(false);
const isInitializingPlayer = ref(false);

// 一起听会话状态
const globalListenTogetherInfo = ref(null);

// 播放列表详情相关
const showPlaylistModal = ref(false);
const selectedPlaylist = ref(null);
const playlistTracks = ref([]);
const isLoadingTracks = ref(false);

// 计算属性
const hasClientId = computed(() => !!SPOTIFY_CONFIG.CLIENT_ID);

// 全局一起听状态显示文本
const globalListenTogetherText = computed(() => {
        if (!globalListenTogetherInfo.value) return '';
        return `和${globalListenTogetherInfo.value.partner}一起听了${formatDuration(globalListenTogetherInfo.value.totalDuration)}`;
});

// 方法
const loginToSpotify = async () => {
        if (!SPOTIFY_CONFIG.CLIENT_ID) {
                error.value = '请先配置 Spotify Client ID';
                return;
        }

        try {
                isLoading.value = true;
                const authUrl = await spotifyService.getAuthUrl();
                window.location.href = authUrl;
        } catch (err) {
                error.value = err.message;
                isLoading.value = false;
        }
};

const logout = () => {
        spotifyService.logout();
        spotifyService.getWebPlayer().disconnect();
        isLoggedIn.value = false;
        userProfile.value = null;
        playlists.value = [];
        webPlayerReady.value = false;
};

const clearError = () => {
        error.value = '';
};

// 更新一起听信息
const updateListenTogetherInfo = async () => {
        try {
                const sessionInfo = await listenTogetherService.getCurrentListenTogetherSessionInfo();
                if (sessionInfo) {
                        const totalDuration = await listenTogetherService.getTotalListenTogetherDurationWithCurrent(sessionInfo.actorId);
                        globalListenTogetherInfo.value = {
                                partner: sessionInfo.partner,
                                partnerId: sessionInfo.actorId,
                                totalDuration
                        };
                } else {
                        globalListenTogetherInfo.value = null;
                }
        } catch (error) {
                console.error('获取一起听信息失败:', error);
                globalListenTogetherInfo.value = null;
        }
};

// 初始化Web播放器
const initializePlayer = async () => {
        isInitializingPlayer.value = true;
        try {
                await spotifyService.initializeWebPlayer();
                webPlayerReady.value = true;
        } catch (err) {
                error.value = '初始化播放器失败: ' + err.message;
        } finally {
                isInitializingPlayer.value = false;
        }
};

// 播放器事件处理
const handleTrackChange = (track) => {
        console.log('Track changed:', track);
};

const handlePlaybackChange = (state) => {
        console.log('Playback changed:', state);
};

const handlePlayerError = (errorMsg) => {
        error.value = errorMsg;
};

// 播放列表相关方法
const openPlaylist = async (playlist) => {
        selectedPlaylist.value = playlist;
        showPlaylistModal.value = true;
        isLoadingTracks.value = true;
        playlistTracks.value = [];
        
        try {
                const response = await spotifyService.getPlaylistTracks(playlist.id);
                playlistTracks.value = response.items || [];
        } catch (err) {
                error.value = '加载播放列表失败: ' + err.message;
        } finally {
                isLoadingTracks.value = false;
        }
};

const closePlaylist = () => {
        showPlaylistModal.value = false;
        selectedPlaylist.value = null;
        playlistTracks.value = [];
};

const playPlaylist = async (playlist) => {
        try {
                await spotifyService.playPlaylist(playlist.uri);
                closePlaylist();
        } catch (err) {
                if (err.message.includes('没有找到活跃的播放设备')) {
                        error.value = '请先初始化播放器或在Spotify应用中开始播放';
                } else {
                        error.value = '播放播放列表失败: ' + err.message;
                }
        }
};

const playTrack = async (track) => {
        if (!track || !track.uri) {
                error.value = '无法播放此歌曲';
                return;
        }
        
        try {
                await spotifyService.playTrack(track.uri);
                closePlaylist();
        } catch (err) {
                if (err.message.includes('没有找到活跃的播放设备')) {
                        error.value = '请先初始化播放器或在Spotify应用中开始播放';
                } else {
                        error.value = '播放歌曲失败: ' + err.message;
                }
        }
};

// 数据加载方法
const loadUserProfile = async () => {
        try {
                userProfile.value = await spotifyService.getCurrentUser();
        } catch (err) {
                console.error('加载用户信息失败:', err);
        }
};

const loadPlaylists = async () => {
        try {
                const response = await spotifyService.getUserPlaylists();
                playlists.value = response.items || [];
        } catch (err) {
                console.error('加载播放列表失败:', err);
        }
};

const loadUserData = async () => {
        isLoading.value = true;
        try {
                await Promise.all([
                        loadUserProfile(),
                        loadPlaylists()
                ]);
        } catch (err) {
                error.value = '加载数据失败: ' + err.message;
        } finally {
                isLoading.value = false;
        }
};

// 处理授权回调
const handleAuthCallback = async () => {
        const code = route.query.code;
        const error_param = route.query.error;

        if (error_param) {
                error.value = '授权失败: ' + error_param;
                router.replace('/music');
                return;
        }

        if (code) {
                isLoading.value = true;
                try {
                        await spotifyService.handleAuthCallback(code);
                        isLoggedIn.value = true;
                        router.replace('/music');
                        await loadUserData();
                } catch (err) {
                        error.value = '授权处理失败: ' + err.message;
                } finally {
                        isLoading.value = false;
                }
        }
};

// 生命周期
onMounted(async () => {
        isLoggedIn.value = spotifyService.isLoggedIn();
        
        if (route.query.code || route.query.error) {
                await handleAuthCallback();
        } else if (isLoggedIn.value) {
                await loadUserData();
                await updateListenTogetherInfo();
                
                // 定期更新一起听信息（每60秒）
                setInterval(updateListenTogetherInfo, 60000);
        }
});
</script><style scoped>
.music-view {
        min-height: 100vh;
        background: var(--bg-primary);
        display: flex;
        flex-direction: column;
}

.music-content {
        flex: 1;
        padding: 20px;
        padding-top: calc(var(--header-height) + 20px);
        padding-bottom: calc(20px + var(--safe-bottom));
        overflow-y: auto;
        overflow-x: hidden;
}

/* 隐藏滚动条 */
.music-content::-webkit-scrollbar {
        display: none;
}

.music-content {
        -ms-overflow-style: none; /* IE and Edge */
        scrollbar-width: none; /* Firefox */
}

/* 登录界面样式 */
.login-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 60vh;
        text-align: center;
        padding: 40px 20px;
}

.spotify-logo {
        margin-bottom: 30px;
        animation: pulse 2s infinite ease-in-out;
}

@keyframes pulse {

        0%,
        100% {
                transform: scale(1);
        }

        50% {
                transform: scale(1.05);
        }
}

.welcome-title {
        font-size: 28px;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 16px;
}

.welcome-description {
        font-size: 16px;
        color: var(--text-secondary);
        line-height: 1.5;
        margin-bottom: 40px;
        max-width: 320px;
}

.login-button {
        background: #1DB954;
        color: white;
        border: none;
        border-radius: 50px;
        padding: 16px 32px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 180px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
}

.login-button:hover:not(:disabled) {
        background: #1ed760;
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(29, 185, 84, 0.3);
}

.login-button:disabled {
        background: var(--bg-secondary);
        color: var(--text-secondary);
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
}

.loading-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid transparent;
        border-top: 2px solid currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
}

@keyframes spin {
        to {
                transform: rotate(360deg);
        }
}

.client-id-warning {
        margin-top: 20px;
        padding: 16px;
        background: rgba(255, 193, 7, 0.1);
        border: 1px solid rgba(255, 193, 7, 0.3);
        border-radius: 8px;
        color: #ffc107;
}

/* 主内容样式 */
.main-content {
        max-width: 800px;
        margin: 0 auto;
        width: 100%;
}

.user-section {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: var(--bg-card);
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 24px;
        flex-wrap: wrap;
        gap: 16px;
        position: relative;
}

.listen-together-status {
        position: absolute;
        top: 16px;
        right: 20px;
        background: var(--accent-primary);
        color: white;
        padding: 6px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(29, 185, 84, 0.3);
}

.user-info {
        display: flex;
        align-items: center;
        gap: 16px;
        flex: 1;
        min-width: 200px;
}

.user-avatar {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        overflow: hidden;
        background: var(--accent-primary);
        flex-shrink: 0;
}

.user-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
}

.avatar-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        font-weight: 600;
        color: white;
}

.user-details h3 {
        margin: 0 0 4px 0;
        font-size: 18px;
        color: var(--text-primary);
}

.user-details p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 14px;
}

.player-controls {
        display: flex;
        align-items: center;
        gap: 12px;
}

.init-player-btn {
        background: var(--accent-primary);
        color: white;
        border: none;
        border-radius: 25px;
        padding: 12px 20px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 8px;
}

.init-player-btn:hover:not(:disabled) {
        background: var(--accent-darker);
        transform: translateY(-1px);
}

.init-player-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
}

.player-status {
        color: var(--accent-primary);
        font-size: 14px;
        font-weight: 500;
}

.player-section {
        background: var(--bg-card);
        border-radius: 16px;
        margin-bottom: 24px;
}

/* 播放列表网格样式 */
.playlists-section {
        background: var(--bg-card);
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 24px;
}

.playlists-section h4 {
        margin: 0 0 16px 0;
        color: var(--text-primary);
        font-size: 16px;
}

.playlists-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 16px;
        overflow: hidden; /* 防止横向滚动 */
}

.playlist-item {
        background: var(--bg-secondary);
        border-radius: 12px;
        padding: 16px;
        transition: all 0.2s ease;
        cursor: pointer;
        overflow: hidden; /* 确保内容不溢出 */
}

.playlist-item:hover {
        background: var(--bg-primary);
        transform: translateY(-2px);
}

.playlist-image {
        width: 100%;
        aspect-ratio: 1;
        border-radius: 8px;
        overflow: hidden;
        background: var(--bg-primary);
        margin-bottom: 12px;
}

.playlist-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
}

.playlist-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: var(--text-secondary);
}

.playlist-info {
        display: flex;
        flex-direction: column;
        min-width: 0; /* 关键：允许容器收缩 */
        overflow: hidden; /* 确保溢出隐藏 */
}

.playlist-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary);
        margin-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 100%; /* 确保宽度限制 */
}

.playlist-tracks {
        font-size: 12px;
        color: var(--text-secondary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 100%; /* 确保宽度限制 */
}

/* 退出登录区域 */
.logout-section {
        background: var(--bg-card);
        border-radius: 16px;
        padding: 20px;
        text-align: center;
}

.logout-button {
        background: var(--accent-primary);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 12px 24px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        width: 100%;
}

.logout-button:hover {
        background: var(--accent-darker);
}

/* 正在播放样式 */
.now-playing {
        background: var(--bg-card);
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 24px;
}

.now-playing h4 {
        margin: 0 0 16px 0;
        color: var(--text-primary);
        font-size: 16px;
}

.track-info {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;
}

.track-image {
        width: 80px;
        height: 80px;
        border-radius: 8px;
        overflow: hidden;
        background: var(--bg-secondary);
}

.track-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
}

.track-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
}

.track-name {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 4px;
}

.track-artist {
        font-size: 14px;
        color: var(--text-secondary);
        margin-bottom: 2px;
}

.track-album {
        font-size: 12px;
        color: var(--text-secondary);
}

.playback-controls {
        display: flex;
        justify-content: center;
}

.play-pause-btn {
        background: var(--accent-primary);
        color: white;
        border: none;
        border-radius: 50%;
        width: 48px;
        height: 48px;
        font-size: 18px;
        cursor: pointer;
        transition: all 0.2s ease;
}

.play-pause-btn:hover {
        background: var(--accent-darker);
        transform: scale(1.05);
}

/* 设备警告样式 */
.device-warning {
        background: rgba(255, 193, 7, 0.1);
        border: 1px solid rgba(255, 193, 7, 0.3);
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 24px;
        text-align: center;
}

.warning-content h4 {
        margin: 0 0 12px 0;
        color: #ffc107;
        font-size: 16px;
}

.warning-content p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 14px;
        line-height: 1.5;
}

/* 设备列表样式 */
.devices-section {
        background: var(--bg-card);
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 24px;
}

.devices-section h4 {
        margin: 0 0 16px 0;
        color: var(--text-primary);
        font-size: 16px;
}

.devices-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
}

.device-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background: var(--bg-secondary);
        border-radius: 8px;
        transition: all 0.2s ease;
}

.device-item.active {
        background: rgba(29, 185, 84, 0.1);
        border: 1px solid var(--accent-primary);
}

.device-info {
        display: flex;
        flex-direction: column;
}

.device-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary);
}

.device-type {
        font-size: 12px;
        color: var(--text-secondary);
}

.device-status {
        font-size: 12px;
        color: var(--accent-primary);
        font-weight: 500;
}

/* 错误提示样式 */
.error-message {
        background: rgba(220, 38, 38, 0.1);
        border: 1px solid rgba(220, 38, 38, 0.3);
        border-radius: 12px;
        padding: 16px;
        margin-top: 20px;
        text-align: center;
}

.error-message p {
        color: #dc2626;
        margin: 0 0 12px 0;
        font-size: 14px;
}

.clear-error-btn {
        background: #dc2626;
        color: white;
        border: none;
        border-radius: 6px;
        padding: 8px 16px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
}

.clear-error-btn:hover {
        background: #b91c1c;
}

/* 播放列表弹窗样式 */
.modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(5px);
}

.playlist-modal {
        background: var(--bg-card);
        border-radius: 16px;
        width: 90%;
        max-width: 600px;
        max-height: 80vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
}

.playlist-header {
        position: relative;
        padding: 24px;
        border-bottom: 1px solid var(--border-color);
        text-align: center;
}

.close-btn {
        position: absolute;
        top: 16px;
        right: 16px;
        background: var(--button-bg);
        color: var(--text-primary);
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        font-size: 18px;
        cursor: pointer;
        transition: all 0.2s ease;
}

.close-btn:hover {
        background: var(--button-bg-hover);
}

.playlist-details {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
}

.playlist-cover {
        width: 120px;
        height: 120px;
        border-radius: 12px;
        overflow: hidden;
        background: var(--bg-secondary);
}

.playlist-cover img {
        width: 100%;
        height: 100%;
        object-fit: cover;
}

.cover-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 48px;
        color: var(--text-secondary);
}

.playlist-details h3 {
        margin: 0;
        font-size: 20px;
        color: var(--text-primary);
}

.playlist-details p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 14px;
}

.play-playlist-btn {
        background: var(--accent-primary);
        color: white;
        border: none;
        border-radius: 25px;
        padding: 12px 24px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
}

.play-playlist-btn:hover {
        background: var(--accent-darker);
        transform: translateY(-1px);
}

.tracks-list {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        /* 禁用横向滚动 */
        padding: 0 24px 24px;
}

/* 隐藏滚动条 */
.tracks-list::-webkit-scrollbar {
        display: none;
}

.tracks-list {
        -ms-overflow-style: none;
        /* IE and Edge */
        scrollbar-width: none;
        /* Firefox */
}

.loading-tracks {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px;
        gap: 16px;
}

.loading-tracks p {
        color: var(--text-secondary);
        font-size: 14px;
}

.tracks-container {
        display: flex;
        flex-direction: column;
        gap: 2px;
}

.track-item {
        display: flex;
        align-items: center;
        padding: 12px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        gap: 12px;
}

.track-item:hover {
        background: var(--bg-secondary);
}

.track-number {
        width: 20px;
        text-align: center;
        color: var(--text-secondary);
        font-size: 14px;
}

.track-image {
        width: 40px;
        height: 40px;
        border-radius: 4px;
        overflow: hidden;
        background: var(--bg-secondary);
        flex-shrink: 0;
}

.track-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
}

.track-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        color: var(--text-secondary);
}

.track-info {
        flex: 1;
        min-width: 0;
        /* 关键：允许容器收缩到比内容更小 */
        overflow: hidden;
        /* 确保溢出隐藏 */
}

.track-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary);
        margin-bottom: 2px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 100%;
        /* 确保宽度限制 */
}

.track-artist {
        font-size: 12px;
        color: var(--text-secondary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 100%;
        /* 确保宽度限制 */
}

.track-duration {
        color: var(--text-secondary);
        font-size: 12px;
        flex-shrink: 0;
}

.no-tracks {
        text-align: center;
        padding: 40px;
        color: var(--text-secondary);
}

/* 移动端适配 */
@media (max-width: 640px) {
        .music-content {
                padding: 16px;
                padding-top: calc(var(--header-height) + 16px);
        }
        
        .user-section {
                flex-direction: column;
                text-align: center;
        }
        
        .user-info {
                justify-content: center;
                min-width: auto;
        }
        
        .player-controls {
                justify-content: center;
                width: 100%;
        }
        
        .playlists-grid {
                grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                gap: 12px;
        }
        
        .spotify-logo svg {
                width: 120px;
                height: 120px;
        }
        
        .welcome-title {
                font-size: 24px;
        }
        
        .welcome-description {
                font-size: 14px;
        }

        .playlist-modal {
                width: 95%;
                max-height: 85vh;
        }

        .playlist-header {
                padding: 20px 16px;
        }

        .playlist-cover {
                width: 100px;
                height: 100px;
        }

        .tracks-list {
                padding: 0 16px 16px;
        }

        .track-item {
                padding: 8px;
        }

        .playlist-details h3 {
                font-size: 18px;
        }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
        .login-button:hover:not(:disabled) {
                transform: none;
                box-shadow: none;
        }
        
        .playlist-item:hover {
                transform: none;
        }
        
        .init-player-btn:hover:not(:disabled) {
                transform: none;
        }
        
        .play-playlist-btn:hover {
                transform: none;
        }
}
</style>
      
