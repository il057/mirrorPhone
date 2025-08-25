<template>
        <div class="spotify-player" :class="{ 'mini': mini, 'full': !mini }">
                <!-- 迷你播放器模式 -->
                <div v-if="mini && currentTrack" class="mini-player">
                        <div class="mini-track-image">
                                <img v-if="currentTrack.album?.images?.[0]" :src="currentTrack.album.images[0].url"
                                        :alt="currentTrack.name">
                                <div v-else class="mini-placeholder">🎵</div>
                        </div>
                        <div class="mini-track-info">
                                <div class="mini-track-name">{{ currentTrack.name }}</div>
                                <div class="mini-track-artist">{{ getArtistNames(currentTrack.artists) }}</div>
                        </div>
                        <div class="mini-controls">
                                <a @click="togglePlayback" class="mini-play-btn">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                fill="currentColor" class="bi bi-play-pause" viewBox="0 0 16 16">
                                                <path v-if="isPlaying"
                                                        d="M6 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5m4 0a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5" />
                                                <path v-else
                                                        d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393" />
                                        </svg>
                                </a>
                        </div>
                </div>

                <!-- 完整播放器模式 -->
                <div v-else-if="!mini" class="full-player">
                        <!-- 当前播放信息 -->
                        <div v-if="currentTrack" class="current-track">
                                <div class="track-image">
                                        <img v-if="currentTrack.album?.images?.[0]"
                                                :src="currentTrack.album.images[0].url" :alt="currentTrack.name">
                                        <div v-else class="track-placeholder">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                        fill="currentColor" class="bi bi-music-note-beamed"
                                                        viewBox="0 0 16 16">
                                                        <path
                                                                d="M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13s1.12-2 2.5-2 2.5.896 2.5 2m9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2" />
                                                        <path fill-rule="evenodd" d="M14 11V2h1v9zM6 3v10H5V3z" />
                                                        <path
                                                                d="M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4z" />
                                                </svg>
                                        </div>
                                </div>
                                <div class="track-details">
                                        <div class="track-name">{{ currentTrack.name }}</div>
                                        <div class="track-artist">{{ getArtistNames(currentTrack.artists) }}</div>
                                        <div class="track-album">{{ currentTrack.album?.name }}</div>
                                </div>
                        </div>

                        <!-- 播放控制 -->
                        <div class="playback-controls">
                                <a @click="previousTrack" :disabled="!canControl" class="control-btn">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                fill="currentColor" class="bi bi-skip-backward-fill"
                                                viewBox="0 0 16 16">
                                                <path
                                                        d="M.5 3.5A.5.5 0 0 0 0 4v8a.5.5 0 0 0 1 0V8.753l6.267 3.636c.54.313 1.233-.066 1.233-.697v-2.94l6.267 3.636c.54.314 1.233-.065 1.233-.696V4.308c0-.63-.693-1.01-1.233-.696L8.5 7.248v-2.94c0-.63-.692-1.01-1.233-.696L1 7.248V4a.5.5 0 0 0-.5-.5" />
                                        </svg>
                                </a>
                                <a @click="togglePlayback" :disabled="!canControl" class="play-pause-btn">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"
                                                fill="currentColor" class="bi bi-play-pause" viewBox="0 0 16 16">
                                                <path v-if="isPlaying"
                                                        d="M6 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5m4 0a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5" />
                                                <path v-else
                                                        d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393" />
                                        </svg>
                                </a>
                                <a @click="nextTrack" :disabled="!canControl" class="control-btn">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                fill="currentColor" class="bi bi-skip-forward-fill" viewBox="0 0 16 16">
                                                <path
                                                        d="M15.5 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V8.753l-6.267 3.636c-.54.313-1.233-.066-1.233-.697v-2.94l-6.267 3.636C.693 12.703 0 12.324 0 11.693V4.308c0-.63.693-1.01 1.233-.696L7.5 7.248v-2.94c0-.63.693-1.01 1.233-.696L15 7.248V4a.5.5 0 0 1 .5-.5" />
                                        </svg>
                                </a>
                        </div>

                        <!-- 进度条 -->
                        <div v-if="currentTrack && duration > 0" class="progress-section">
                                <div class="progress-time">{{ formatTime(position) }}</div>
                                <div class="progress-bar" @click="seekToPosition">
                                        <div class="progress-track">
                                                <div class="progress-fill" :style="{ width: progressPercent + '%' }">
                                                </div>
                                        </div>
                                </div>
                                <div class="progress-time">{{ formatTime(duration) }}</div>
                        </div>

                        <!-- 音量控制 -->
                        <div class="volume-section">
                                <span class="volume-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                fill="currentColor" class="bi bi-volume-up-fill" viewBox="0 0 16 16">
                                                <path
                                                        d="M11.536 14.01A8.47 8.47 0 0 0 14.026 8a8.47 8.47 0 0 0-2.49-6.01l-.708.707A7.48 7.48 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303z" />
                                                <path
                                                        d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.48 5.48 0 0 1 11.025 8a5.48 5.48 0 0 1-1.61 3.89z" />
                                                <path
                                                        d="M8.707 11.182A4.5 4.5 0 0 0 10.025 8a4.5 4.5 0 0 0-1.318-3.182L8 5.525A3.5 3.5 0 0 1 9.025 8 3.5 3.5 0 0 1 8 10.475zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06" />
                                        </svg>
                                </span>
                                <div class="volume-bar" @click="setVolume">
                                        <div class="volume-track">
                                                <div class="volume-fill" :style="{ width: volume * 100 + '%' }"></div>
                                        </div>
                                </div>
                        </div>

                        <!-- 播放列表选择 -->
                        <div v-if="showPlaylistSelector" class="playlist-selector">
                                <h4>选择播放列表</h4>
                                <div class="playlist-list">
                                        <div v-for="playlist in playlists" :key="playlist.id" class="playlist-option"
                                                @click="playPlaylist(playlist)">
                                                <div class="playlist-image">
                                                        <img v-if="playlist.images?.[0]" :src="playlist.images[0].url"
                                                                :alt="playlist.name">
                                                        <div v-else class="playlist-placeholder">🎵</div>
                                                </div>
                                                <div class="playlist-info">
                                                        <div class="playlist-name">{{ playlist.name }}</div>
                                                        <div class="playlist-tracks">{{ playlist.tracks?.total || 0 }}
                                                                首歌曲</div>
                                                </div>
                                        </div>
                                </div>
                        </div>
                </div>

                <!-- 设备状态指示器 -->
                <div v-if="deviceStatus" class="device-status">
                        {{ deviceStatus }}
                </div>
        </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import spotifyService from '../../services/spotifyService.js';

const props = defineProps({
        mini: {
                type: Boolean,
                default: false
        },
        showPlaylistSelector: {
                type: Boolean,
                default: false
        },
        autoRefresh: {
                type: Boolean,
                default: true
        }
});

const emit = defineEmits(['trackChange', 'playbackChange', 'error']);

// 响应式数据
const currentTrack = ref(null);
const isPlaying = ref(false);
const position = ref(0);
const duration = ref(0);
const volume = ref(0.5);
const deviceStatus = ref('');
const canControl = ref(false);
const playlists = ref([]);

// 自动刷新定时器
let refreshInterval = null;

// 计算属性
const progressPercent = computed(() => {
        if (duration.value === 0) return 0;
        return (position.value / duration.value) * 100;
});

// 方法
const getArtistNames = (artists) => {
        return artists?.map(a => a.name).join(', ') || '未知艺术家';
};

const formatTime = (ms) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// 播放控制方法
const togglePlayback = async () => {
        try {
                if (isPlaying.value) {
                        await spotifyService.pausePlayback();
                } else {
                        await spotifyService.resumePlayback();
                }
                await updatePlaybackState();
        } catch (error) {
                emit('error', '播放控制失败: ' + error.message);
        }
};

const previousTrack = async () => {
        try {
                await spotifyService.apiRequest('/me/player/previous', { method: 'POST' });
                // 延迟一下让Spotify更新状态
                setTimeout(updatePlaybackState, 500);
        } catch (error) {
                emit('error', '上一首失败: ' + error.message);
        }
};

const nextTrack = async () => {
        try {
                await spotifyService.apiRequest('/me/player/next', { method: 'POST' });
                // 延迟一下让Spotify更新状态
                setTimeout(updatePlaybackState, 500);
        } catch (error) {
                emit('error', '下一首失败: ' + error.message);
        }
};

const seekToPosition = (event) => {
        const rect = event.target.getBoundingClientRect();
        const percent = (event.clientX - rect.left) / rect.width;
        const newPosition = percent * duration.value;
        seekTo(newPosition);
};

const seekTo = async (positionMs) => {
        try {
                await spotifyService.apiRequest(`/me/player/seek?position_ms=${Math.floor(positionMs)}`, {
                        method: 'PUT'
                });
                position.value = positionMs;
        } catch (error) {
                emit('error', '跳转失败: ' + error.message);
        }
};

const setVolume = async (event) => {
        const rect = event.target.getBoundingClientRect();
        const percent = (event.clientX - rect.left) / rect.width;
        const newVolume = Math.max(0, Math.min(1, percent));

        try {
                await spotifyService.apiRequest(`/me/player/volume?volume_percent=${Math.floor(newVolume * 100)}`, {
                        method: 'PUT'
                });
                volume.value = newVolume;
        } catch (error) {
                emit('error', '音量调节失败: ' + error.message);
        }
};

const playTrack = async (trackUri) => {
        try {
                await spotifyService.playTrack(trackUri);
                setTimeout(updatePlaybackState, 500);
        } catch (error) {
                emit('error', '播放歌曲失败: ' + error.message);
        }
};

const playPlaylist = async (playlist) => {
        try {
                await spotifyService.playPlaylist(playlist.uri);
                setTimeout(updatePlaybackState, 500);
        } catch (error) {
                emit('error', '播放播放列表失败: ' + error.message);
        }
};

// 状态更新方法
const updatePlaybackState = async () => {
        try {
                const playback = await spotifyService.getCurrentPlayback();

                if (playback && playback.item) {
                        const prevTrack = currentTrack.value;
                        currentTrack.value = playback.item;
                        isPlaying.value = playback.is_playing;
                        position.value = playback.progress_ms || 0;
                        duration.value = playback.item.duration_ms || 0;
                        canControl.value = true;
                        deviceStatus.value = playback.device?.name || '';

                        // 发出事件
                        if (!prevTrack || prevTrack.id !== playback.item.id) {
                                emit('trackChange', playback.item);
                        }
                        emit('playbackChange', {
                                isPlaying: isPlaying.value,
                                position: position.value,
                                duration: duration.value
                        });
                } else {
                        canControl.value = false;
                        deviceStatus.value = '无播放设备';
                }
        } catch (error) {
                canControl.value = false;
                deviceStatus.value = '获取状态失败';
        }
};

const loadPlaylists = async () => {
        if (props.showPlaylistSelector) {
                try {
                        const response = await spotifyService.getUserPlaylists();
                        playlists.value = response.items || [];
                } catch (error) {
                        emit('error', '加载播放列表失败: ' + error.message);
                }
        }
};

// 暴露方法给父组件
defineExpose({
        updatePlaybackState,
        playTrack,
        playPlaylist,
        togglePlayback,
        nextTrack,
        previousTrack
});

// 生命周期
onMounted(async () => {
        await updatePlaybackState();
        await loadPlaylists();

        if (props.autoRefresh) {
                refreshInterval = setInterval(updatePlaybackState, 3000);
        }
});

onUnmounted(() => {
        if (refreshInterval) {
                clearInterval(refreshInterval);
        }
});

// 监听props变化
watch(() => props.showPlaylistSelector, (newVal) => {
        if (newVal) {
                loadPlaylists();
        }
});
</script>

<style scoped>
.spotify-player {
        border-radius: 12px;
        overflow: hidden;
        background: var(--bg-card);
}

/* 迷你播放器样式 */
.mini-player {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        gap: 12px;
}

.mini-track-image {
        width: 40px;
        height: 40px;
        border-radius: 6px;
        overflow: hidden;
        background: var(--bg-secondary);
        flex-shrink: 0;
}

.mini-track-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
}

.mini-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        color: var(--text-secondary);
}

.mini-track-info {
        flex: 1;
        min-width: 0;
}

.mini-track-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
}

.mini-track-artist {
        font-size: 12px;
        color: var(--text-secondary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
}

.mini-controls {
        flex-shrink: 0;
}

.mini-play-btn {
        background: var(--accent-primary);
        color: white;
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
}

.mini-play-btn:hover {
        background: var(--accent-darker);
}

/* 完整播放器样式 */
.full-player {
        padding: 20px;
}

.current-track {
        display: flex;
        gap: 16px;
        margin-bottom: 20px;
}

.track-image {
        width: 80px;
        height: 80px;
        border-radius: 8px;
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
        font-size: 32px;
        color: var(--text-secondary);
}

.track-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
}

.track-name {
        font-size: 18px;
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
        align-items: center;
        gap: 20px;
        margin-bottom: 20px;
}

.control-btn {
        background: var(--button-bg);
        color: var(--text-primary);
        border: none;
        border-radius: 50%;
        width: 44px;
        height: 44px;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
}

.control-btn:hover:not(:disabled) {
        background: var(--button-bg-hover);
}

.control-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
}


.play-pause-btn {
        background: var(--accent-primary);
        color: white;
        border: none;
        border-radius: 50%;
        width: 56px;
        height: 56px;
        font-size: 20px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
}

.play-pause-btn:hover:not(:disabled) {
        background: var(--accent-darker);
        transform: scale(1.05);
}

.play-pause-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
}

.progress-section {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
}

.progress-time {
        font-size: 12px;
        color: var(--text-secondary);
        min-width: 40px;
        text-align: center;
}

.progress-bar {
        flex: 1;
        height: 20px;
        display: flex;
        align-items: center;
        cursor: pointer;
}

.progress-track {
        width: 100%;
        height: 4px;
        background: var(--bg-secondary);
        border-radius: 2px;
        overflow: hidden;
}

.progress-fill {
        height: 100%;
        background: var(--accent-primary);
        border-radius: 2px;
        transition: width 0.1s ease;
}

.volume-section {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
}

.volume-icon {
        font-size: 16px;
        color: var(--text-secondary);
}

.volume-bar {
        flex: 1;
        height: 20px;
        display: flex;
        align-items: center;
        cursor: pointer;
}

.volume-track {
        width: 100%;
        height: 4px;
        background: var(--bg-secondary);
        border-radius: 2px;
        overflow: hidden;
}

.volume-fill {
        height: 100%;
        background: var(--accent-primary);
        border-radius: 2px;
        transition: width 0.1s ease;
}

.playlist-selector {
        border-top: 1px solid var(--border-color);
        padding-top: 16px;
}

.playlist-selector h4 {
        margin: 0 0 12px 0;
        font-size: 16px;
        color: var(--text-primary);
}

.playlist-list {
        max-height: 200px;
        overflow-y: auto;
        overflow-x: hidden;
}

.playlist-list::-webkit-scrollbar {
        display: none;
}

.playlist-option {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.2s ease;
}

.playlist-option:hover {
        background: var(--bg-secondary);
}

.playlist-image {
        width: 40px;
        height: 40px;
        border-radius: 6px;
        overflow: hidden;
        background: var(--bg-secondary);
        flex-shrink: 0;
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
        font-size: 16px;
        color: var(--text-secondary);
}

.playlist-info {
        flex: 1;
        min-width: 0;
}

.playlist-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
}

.playlist-tracks {
        font-size: 12px;
        color: var(--text-secondary);
}

.device-status {
        text-align: center;
        padding: 8px;
        font-size: 12px;
        color: var(--text-secondary);
        border-top: 1px solid var(--border-color);
}

/* 移动端适配 */
@media (max-width: 640px) {
        .playback-controls {
                gap: 16px;
        }

        .control-btn {
                width: 40px;
                height: 40px;
                font-size: 14px;
        }

        .play-pause-btn {
                width: 50px;
                height: 50px;
                font-size: 18px;
        }

        .current-track {
                flex-direction: column;
                align-items: center;
                text-align: center;
        }
}
</style>
