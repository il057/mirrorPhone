<template>
        <div class="chat-music-player" v-if="shouldShow">
                <!-- 左侧专辑封面 -->
                <div class="album-cover" @click.stop>
                        <div v-if="currentTrack && currentTrack.album && currentTrack.album.images[0]"
                                class="album-image">
                                <img :src="currentTrack.album.images[0].url" :alt="currentTrack.album.name">
                        </div>
                        <div v-else class="album-placeholder">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor"
                                        class="bi bi-music-note" viewBox="0 0 16 16">
                                        <path d="M9 13c0 1.105-1.12 2-2.5 2S4 14.105 4 13s1.12-2 2.5-2 2.5.895 2.5 2" />
                                        <path fill-rule="evenodd" d="M9 3v10H8V3z" />
                                        <path d="M8 2.82a1 1 0 0 1 .804-.98l3-.6A1 1 0 0 1 13 2.22V4L8 5z" />
                                </svg>
                        </div>
                </div>

                <!-- 右侧信息区域 -->
                <div class="track-info">
                        <div class="track-details">
                                <div class="track-title">{{ trackTitle }}</div>
                                <div class="track-artist">{{ trackArtist }}</div>
                        </div>

                        <!-- 一起听模式指示器 -->
                        <div v-if="listenTogetherText" class="listen-together-timer">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor"
                                        class="bi bi-people" viewBox="0 0 16 16">
                                        <path
                                                d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002a.274.274 0 0 1-.014.002H7.022ZM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0M6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816M4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4" />
                                </svg>
                                <span>{{ listenTogetherText }}</span>
                        </div>
                </div>

                <!-- 控制按钮 -->
                <div class="control-buttons">
                        <button class="control-btn" @click="previousTrack" :disabled="!hasTrack" title="上一首">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                                        class="bi bi-skip-backward" viewBox="0 0 16 16">
                                        <path
                                                d="M.5 3.5A.5.5 0 0 1 1 4v3.248l6.267-3.636c.52-.302 1.233.043 1.233.696v2.94l6.267-3.636c.52-.302 1.233.043 1.233.696v7.384c0 .653-.713.998-1.233.696L8.5 8.752v2.94c0 .653-.713.998-1.233.696L1 8.752V12a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5" />
                                </svg>
                        </button>

                        <button class="play-pause-btn" @click="togglePlayback" :disabled="!hasTrack" title="播放/暂停">
                                <svg v-if="isPlaying" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                        stroke-width="1.5" stroke="currentColor" class="size-6">
                                        <path stroke-linecap="round" stroke-linejoin="round"
                                                d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                                </svg>

                                <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                        stroke-width="1.5" stroke="currentColor" class="size-6">
                                        <path stroke-linecap="round" stroke-linejoin="round"
                                                d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                                </svg>

                        </button>

                        <button class="control-btn" @click="nextTrack" :disabled="!hasTrack" title="下一首">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                                        class="bi bi-skip-forward" viewBox="0 0 16 16">
                                        <path
                                                d="M15.5 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V8.752l-6.267 3.636c-.52.302-1.233-.043-1.233-.696v-2.94l-6.267 3.636C.713 12.69 0 12.345 0 11.692V4.308c0-.653.713-.998 1.233-.696L7.5 7.248v-2.94c0-.653.713-.998 1.233-.696L15 7.248V4a.5.5 0 0 1 .5-.5" />
                                </svg>
                        </button>

                        <button class="control-btn shuffle-btn" :class="{ active: isShuffleOn }" @click="toggleShuffle"
                                :disabled="!hasTrack" title="随机播放">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor"
                                        class="bi bi-shuffle" viewBox="0 0 16 16">
                                        <path fill-rule="evenodd"
                                                d="M0 3.5A.5.5 0 0 1 .5 3H1c2.202 0 3.827 1.24 4.874 2.418.49.552.865 1.102 1.126 1.532.26-.43.636-.98 1.126-1.532C9.173 4.24 10.798 3 13 3v1c-1.798 0-3.173 1.01-4.126 2.082A9.6 9.6 0 0 0 7.556 8a9.6 9.6 0 0 0 1.317 1.918C9.828 10.99 11.204 12 13 12v1c-2.202 0-3.827-1.24-4.874-2.418A10.6 10.6 0 0 1 7 9.05c-.26.43-.636.98-1.126 1.532C4.827 11.76 3.202 13 1 13H.5a.5.5 0 0 1 0-1H1c1.798 0 3.173-1.01 4.126-2.082A9.6 9.6 0 0 0 6.444 8a9.6 9.6 0 0 0-1.317-1.918C4.172 5.01 2.796 4 1 4H.5a.5.5 0 0 1-.5-.5" />
                                        <path
                                                d="M13 5.466V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192m0 9v-3.932a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192" />
                                </svg>
                        </button>
                </div>

                <!-- 进度条 -->
                <div class="progress-container">
                        <div class="progress-bar" @click="seekToPosition">
                                <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
                        </div>
                </div>
        </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import spotifyService from '../../services/spotifyService.js';
import { formatDuration } from '../../utils/datetime.js';

const props = defineProps({
        // 是否启用一起听模式
        listenTogether: {
                type: Boolean,
                default: false
        },
        // 一起听开始时间
        listenTogetherStartTime: {
                type: Number,
                default: null
        },
        // 一起听总时长（毫秒）
        listenTogetherDuration: {
                type: Number,
                default: 0
        },
        // 一起听伙伴名称
        listenTogetherPartner: {
                type: String,
                default: ''
        },
        // 全局一起听会话信息
        globalListenTogetherInfo: {
                type: Object,
                default: null
        }
});

// 响应式数据
const isLoggedIn = ref(false);
const currentTrack = ref(null);
const isPlaying = ref(false);
const position = ref(0);
const duration = ref(0);
const isShuffleOn = ref(false);

// 自动刷新定时器
let refreshInterval = null;

// 计算属性
const shouldShow = computed(() => {
        return isLoggedIn.value && currentTrack.value;
});

const hasTrack = computed(() => {
        return currentTrack.value !== null;
});

const trackTitle = computed(() => {
        return currentTrack.value?.name || '未知曲目';
});

const trackArtist = computed(() => {
        return currentTrack.value?.artists?.map(a => a.name).join(', ') || '未知艺术家';
});

const progressPercent = computed(() => {
        if (duration.value === 0) return 0;
        return (position.value / duration.value) * 100;
});

const isListenTogether = computed(() => {
        return props.listenTogether && props.listenTogetherStartTime;
});

// 一起听显示文本
const listenTogetherText = computed(() => {
        // 如果有全局一起听信息，显示全局信息
        if (props.globalListenTogetherInfo && props.globalListenTogetherInfo.totalDuration > 0) {
                const partnerName = props.globalListenTogetherInfo.partner;
                const globalDuration = props.globalListenTogetherInfo.totalDuration;
                const globalFormattedDuration = formatDuration(globalDuration);

                // 如果在对应角色的聊天室中
                if (props.listenTogetherPartner === partnerName) {
                        return `一起听了：${globalFormattedDuration}`;
                } else {
                        // 在其他角色的聊天室中，显示全局状态
                        return `和${partnerName}一起听了：${globalFormattedDuration}`;
                }
        }

        // 如果没有全局信息但有当前角色的一起听时长，显示空字符串
        // 因为当前角色不是正在一起听的角色
        return '';
});

// 方法
const togglePlayback = async () => {
        if (!isLoggedIn.value || !currentTrack.value) return;

        try {
                await spotifyService.safePlaybackOperation(async () => {
                        if (isPlaying.value) {
                                await spotifyService.pausePlayback();
                        } else {
                                await spotifyService.resumePlayback();
                        }
                });
                
                setTimeout(async () => {
                        await updatePlaybackState();
                }, 500);
                
        } catch (error) {
                console.error('播放控制失败:', error);
                setTimeout(async () => {
                        await updatePlaybackState();
                }, 500);
        }
};

const previousTrack = async () => {
        if (!isLoggedIn.value || !currentTrack.value) return;

        try {
                await spotifyService.apiRequest('/me/player/previous', { method: 'POST' });
                setTimeout(updatePlaybackState, 500);
        } catch (error) {
                console.error('上一首失败:', error);
        }
};

const nextTrack = async () => {
        if (!isLoggedIn.value || !currentTrack.value) return;

        try {
                await spotifyService.apiRequest('/me/player/next', { method: 'POST' });
                setTimeout(updatePlaybackState, 500);
        } catch (error) {
                console.error('下一首失败:', error);
        }
};

const seekToPosition = (event) => {
        if (!isLoggedIn.value || duration.value === 0) return;

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
                console.error('跳转失败:', error);
        }
};

const toggleShuffle = async () => {
        if (!isLoggedIn.value) return;

        try {
                const newShuffleState = !isShuffleOn.value;
                await spotifyService.apiRequest(`/me/player/shuffle?state=${newShuffleState}`, {
                        method: 'PUT'
                });
                isShuffleOn.value = newShuffleState;
        } catch (error) {
                console.error('切换随机播放失败:', error);
        }
};

const updatePlaybackState = async () => {
        if (!isLoggedIn.value) return;

        try {
                const playback = await spotifyService.getCurrentPlayback();

                if (playback && playback.item) {
                        currentTrack.value = playback.item;
                        isPlaying.value = playback.is_playing;
                        position.value = playback.progress_ms || 0;
                        duration.value = playback.item.duration_ms || 0;
                        isShuffleOn.value = playback.shuffle_state || false;
                } else {
                        currentTrack.value = null;
                        isPlaying.value = false;
                        position.value = 0;
                        duration.value = 0;
                        isShuffleOn.value = false;
                }
        } catch (error) {
                console.error('获取播放状态失败:', error);
                currentTrack.value = null;
        }
};

const checkLoginStatus = () => {
        isLoggedIn.value = spotifyService.isLoggedIn();
};

// 生命周期
onMounted(async () => {
        checkLoginStatus();
        
        if (isLoggedIn.value) {
                await updatePlaybackState();
                // 每3秒更新一次状态
                refreshInterval = setInterval(() => {
                        updatePlaybackState();
                }, 3000);
        }
});

onUnmounted(() => {
        if (refreshInterval) {
                clearInterval(refreshInterval);
        }
});

// 暴露方法给父组件
defineExpose({
        updatePlaybackState,
        checkLoginStatus
});
</script>

<style scoped>
.chat-music-player {
        display: flex;
        align-items: center;
        background: var(--app-bg);
        backdrop-filter: blur(20px);
        border: 1px solid var(--app-border);
        border-radius: 12px;
        padding: 8px 12px;
        margin: 8px 16px;
        min-height: 46px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        position: relative;
        overflow: hidden;
        z-index: 10;
}

/* 专辑封面 */
.album-cover {
        flex-shrink: 0;
        width: 44px;
        height: 44px;
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        position: relative;
}

.album-image {
        width: 100%;
        height: 100%;
        position: relative;
        transition: all 0.3s ease;
}

.album-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 8px;
}

.album-placeholder {
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.6);
        border-radius: 8px;
}

/* 歌曲信息 */
.track-info {
        flex: 1;
        margin-left: 12px;
        min-width: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
}

.track-details {
        margin-bottom: 2px;
}

.track-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--accent-darker);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 1px;
}

.track-artist {
        font-size: 11px;
        color: var(--accent-text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
}

.listen-together-timer {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 10px;
        color: var(--accent-primary, #1DB954);
        margin-top: 2px;
}

/* 控制按钮 */
.control-buttons {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-left: 8px;
}

.control-btn,
.play-pause-btn {
        width: 28px;
        height: 28px;
        border: none;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.15);
        color: rgba(255, 255, 255, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        flex-shrink: 0;
}

.play-pause-btn {
        background: var(--accent-primary, #1DB954);
        color: var(--accent-text);
}

.control-btn:hover:not(:disabled),
.play-pause-btn:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.25);
        transform: scale(1.05);
}

.play-pause-btn:hover:not(:disabled) {
        background: var(--accent-darker, #1ed760);
}

.control-btn:disabled,
.play-pause-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        pointer-events: none;
}

.shuffle-btn.active {
        background: var(--accent-primary, #1DB954);
        color: var(--accent-text);
}

/* 进度条 */
.progress-container {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: rgba(255, 255, 255, 0.1);
}

.progress-bar {
        width: 100%;
        height: 100%;
        cursor: pointer;
        position: relative;
}

.progress-fill {
        height: 100%;
        background: var(--accent-primary, #1DB954);
        transition: width 0.1s ease;
        border-radius: 0 0 12px 12px;
}

.progress-bar:hover .progress-fill {
        background: var(--accent-lighter, #1ed760);
}

/* 响应式调整 */
@media (max-width: 480px) {
        .chat-music-player {
                margin: 8px 12px;
                padding: 6px 10px;
        }
        
        .album-cover {
                width: 40px;
                height: 40px;
        }
        
        .track-title {
                font-size: 12px;
        }
        
        .track-artist {
                font-size: 10px;
        }
        
        .control-btn,
        .play-pause-btn {
                width: 24px;
                height: 24px;
        }
        
        .control-buttons {
                gap: 2px;
                margin-left: 6px;
        }
}
</style>
