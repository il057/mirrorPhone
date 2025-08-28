<template>
        <div class="music-player-widget">
                <!-- 未登录状态 -->
                <div v-if="!isLoggedIn" class="login-prompt" @click="goToMusicPage">
                        <div class="album-art">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor"
                                        class="bi bi-music-note-beamed" viewBox="0 0 16 16">
                                        <path
                                                d="M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13s1.12-2 2.5-2 2.5.896 2.5 2m9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2" />
                                        <path fill-rule="evenodd" d="M14 11V2h1v9zM6 3v10H5V3z" />
                                        <path d="M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4z" />
                                </svg>
                        </div>
                        <div class="track-info">
                                <div class="track-title">Spotify</div>
                                <div class="track-artist">点击登录</div>
                                <div class="controls">
                                        <button class="control-btn disabled">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"
                                                        fill="currentColor" viewBox="0 0 16 16">
                                                        <path
                                                                d="M.5 3.5A.5.5 0 0 0 0 4v8a.5.5 0 0 0 1 0V8.753l6.267 3.636c.54.313 1.233-.066 1.233-.697v-2.94l6.267 3.636c.54.314 1.233-.065 1.233-.696V4.308c0-.63-.693-1.01-1.233-.696L8.5 7.248v-2.94c0-.63-.692-1.01-1.233-.696L1 7.248V4a.5.5 0 0 0-.5-.5" />
                                                </svg>
                                        </button>
                                        <button class="play-btn disabled">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
                                                        fill="currentColor" viewBox="0 0 16 16">
                                                        <path
                                                                d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393" />
                                                </svg>
                                        </button>
                                        <button class="control-btn disabled">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"
                                                        fill="currentColor" viewBox="0 0 16 16">
                                                        <path
                                                                d="M15.5 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V8.753l-6.267 3.636c-.54.313-1.233-.066-1.233-.697v-2.94l-6.267 3.636C.693 12.703 0 12.324 0 11.693V4.308c0-.63.693-1.01 1.233-.696L7.5 7.248v-2.94c0-.63.693-1.01 1.233-.696L15 7.248V4a.5.5 0 0 1 .5-.5" />
                                                </svg>
                                        </button>
                                </div>
                                <div class="progress-container">
                                        <div class="progress-bar">
                                                <div class="progress-track">
                                                        <div class="progress-fill" style="width: 0%"></div>
                                                </div>
                                        </div>
                                </div>
                        </div>
                </div>

                <!-- 已登录但无播放内容 - 显示空播放器 -->
                <div v-else-if="!currentTrack" class="empty-player">
                        <div class="album-art" @click.stop>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor"
                                        class="bi bi-music-note-beamed" viewBox="0 0 16 16">
                                        <path
                                                d="M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13s1.12-2 2.5-2 2.5.896 2.5 2m9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2" />
                                        <path fill-rule="evenodd" d="M14 11V2h1v9zM6 3v10H5V3z" />
                                        <path d="M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4z" />
                                </svg>
                        </div>
                        <div class="track-info">
                                <div class="track-title">无播放内容</div>
                                <div class="track-artist">选择音乐开始播放</div>
                                <div class="controls">
                                        <button @click.stop="previousTrack" class="control-btn disabled">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"
                                                        fill="currentColor" viewBox="0 0 16 16">
                                                        <path
                                                                d="M.5 3.5A.5.5 0 0 0 0 4v8a.5.5 0 0 0 1 0V8.753l6.267 3.636c.54.313 1.233-.066 1.233-.697v-2.94l6.267 3.636c.54.314 1.233-.065 1.233-.696V4.308c0-.63-.693-1.01-1.233-.696L8.5 7.248v-2.94c0-.63-.692-1.01-1.233-.696L1 7.248V4a.5.5 0 0 0-.5-.5" />
                                                </svg>
                                        </button>
                                        <button @click.stop="startPlayback" class="play-btn">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
                                                        fill="currentColor" viewBox="0 0 16 16">
                                                        <path
                                                                d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393" />
                                                </svg>
                                        </button>
                                        <button @click.stop="nextTrack" class="control-btn disabled">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"
                                                        fill="currentColor" viewBox="0 0 16 16">
                                                        <path
                                                                d="M15.5 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V8.753l-6.267 3.636c-.54.313-1.233-.066-1.233-.697v-2.94l-6.267 3.636C.693 12.703 0 12.324 0 11.693V4.308c0-.63.693-1.01 1.233-.696L7.5 7.248v-2.94c0-.63.693-1.01 1.233-.696L15 7.248V4a.5.5 0 0 1 .5-.5" />
                                                </svg>
                                        </button>
                                        <button @click.stop="toggleShuffle" class="control-btn"
                                                :class="{ 'active': isShuffleOn }">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"
                                                        fill="currentColor" viewBox="0 0 16 16">
                                                        <path fill-rule="evenodd"
                                                                d="M0 3.5A.5.5 0 0 1 .5 3H1c2.202 0 3.827 1.24 4.874 2.418.49.552.865 1.102 1.126 1.532.26-.43.636-.98 1.126-1.532C9.173 4.24 10.798 3 13 3v1c-1.798 0-3.173 1.01-4.126 2.082A9.6 9.6 0 0 0 7.556 8a9.6 9.6 0 0 0 1.317 1.918C9.828 10.99 11.204 12 13 12v1c-2.202 0-3.827-1.24-4.874-2.418A10.6 10.6 0 0 1 7 9.05c-.26.43-.636.98-1.126 1.532C4.827 11.76 3.202 13 1 13H.5a.5.5 0 0 1 0-1H1c1.798 0 3.173-1.01 4.126-2.082A9.6 9.6 0 0 0 6.444 8a9.6 9.6 0 0 0-1.317-1.918C4.172 5.01 2.796 4 1 4H.5a.5.5 0 0 1-.5-.5" />
                                                        <path
                                                                d="M13 5.466V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192m0 9v-3.932a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192" />
                                                </svg>
                                        </button>
                                </div>
                                <div class="progress-container">
                                        <div class="progress-bar">
                                                <div class="progress-track">
                                                        <div class="progress-fill" style="width: 0%"></div>
                                                </div>
                                        </div>
                                </div>
                        </div>
                </div>

                <!-- 正在播放状态 -->
                <div v-else class="playing-state">
                        <div class="album-art" @click.stop="toggleVinylMode">
                                <!-- 黑胶唱片模式 -->
                                <div v-if="isVinylMode" class="vinyl-record" :class="{ 'spinning': isPlaying }">

                                        <div class="vinyl-disc">
                                                <div class="vinyl-label">
                                                        <img v-if="currentTrack.album?.images?.[0]"
                                                                :src="currentTrack.album.images[0].url"
                                                                :alt="currentTrack.name">
                                                        <div v-else class="album-placeholder">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16"
                                                                        height="16" fill="currentColor"
                                                                        class="bi bi-music-note" viewBox="0 0 16 16">
                                                                        <path
                                                                                d="M9 13c0 1.105-1.12 2-2.5 2S4 14.105 4 13s1.12-2 2.5-2 2.5.895 2.5 2" />
                                                                        <path fill-rule="evenodd" d="M9 3v10H8V3z" />
                                                                        <path
                                                                                d="M8 2.82a1 1 0 0 1 .804-.98l3-.6A1 1 0 0 1 13 2.22V4L8 5z" />
                                                                </svg>
                                                        </div>
                                                </div>
                                                <div class="vinyl-center-hole"></div>
                                        </div>
                                </div>

                                <!-- 普通封面模式 -->
                                <div v-else>
                                        <img v-if="currentTrack.album?.images?.[0]"
                                                :src="currentTrack.album.images[0].url" :alt="currentTrack.name">
                                        <div v-else class="album-placeholder">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                        fill="currentColor" class="bi bi-music-note"
                                                        viewBox="0 0 16 16">
                                                        <path
                                                                d="M9 13c0 1.105-1.12 2-2.5 2S4 14.105 4 13s1.12-2 2.5-2 2.5.895 2.5 2" />
                                                        <path fill-rule="evenodd" d="M9 3v10H8V3z" />
                                                        <path
                                                                d="M8 2.82a1 1 0 0 1 .804-.98l3-.6A1 1 0 0 1 13 2.22V4L8 5z" />
                                                </svg>
                                        </div>
                                </div>
                        </div>
                        <div class="track-info">
                                <div class="track-title">{{ currentTrack.name }}</div>
                                <div class="track-artist">{{ getArtistNames(currentTrack.artists) }}</div>
                                <!-- 一起听状态显示 -->
                                <div v-if="globalListenTogetherText" class="listen-together-info">
                                        {{ globalListenTogetherText }}
                                </div>
                                <div class="controls">
                                        <button @click.stop="previousTrack" class="control-btn">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"
                                                        fill="currentColor" viewBox="0 0 16 16">
                                                        <path
                                                                d="M.5 3.5A.5.5 0 0 0 0 4v8a.5.5 0 0 0 1 0V8.753l6.267 3.636c.54.313 1.233-.066 1.233-.697v-2.94l6.267 3.636c.54.314 1.233-.065 1.233-.696V4.308c0-.63-.693-1.01-1.233-.696L8.5 7.248v-2.94c0-.63-.692-1.01-1.233-.696L1 7.248V4a.5.5 0 0 0-.5-.5" />
                                                </svg>
                                        </button>
                                        <button @click.stop="togglePlayback" class="play-btn">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
                                                        fill="currentColor" viewBox="0 0 16 16">
                                                        <path v-if="isPlaying"
                                                                d="M6 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5m4 0a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5" />
                                                        <path v-else
                                                                d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393" />
                                                </svg>
                                        </button>
                                        <button @click.stop="nextTrack" class="control-btn">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"
                                                        fill="currentColor" viewBox="0 0 16 16">
                                                        <path
                                                                d="M15.5 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V8.753l-6.267 3.636c-.54.313-1.233-.066-1.233-.697v-2.94l-6.267 3.636C.693 12.703 0 12.324 0 11.693V4.308c0-.63.693-1.01 1.233-.696L7.5 7.248v-2.94c0-.63.693-1.01 1.233-.696L15 7.248V4a.5.5 0 0 1 .5-.5" />
                                                </svg>
                                        </button>
                                        <button @click.stop="toggleShuffle" class="control-btn"
                                                :class="{ 'active': isShuffleOn }">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"
                                                        fill="currentColor" viewBox="0 0 16 16">
                                                        <path fill-rule="evenodd"
                                                                d="M0 3.5A.5.5 0 0 1 .5 3H1c2.202 0 3.827 1.24 4.874 2.418.49.552.865 1.102 1.126 1.532.26-.43.636-.98 1.126-1.532C9.173 4.24 10.798 3 13 3v1c-1.798 0-3.173 1.01-4.126 2.082A9.6 9.6 0 0 0 7.556 8a9.6 9.6 0 0 0 1.317 1.918C9.828 10.99 11.204 12 13 12v1c-2.202 0-3.827-1.24-4.874-2.418A10.6 10.6 0 0 1 7 9.05c-.26.43-.636.98-1.126 1.532C4.827 11.76 3.202 13 1 13H.5a.5.5 0 0 1 0-1H1c1.798 0 3.173-1.01 4.126-2.082A9.6 9.6 0 0 0 6.444 8a9.6 9.6 0 0 0-1.317-1.918C4.172 5.01 2.796 4 1 4H.5a.5.5 0 0 1-.5-.5" />
                                                        <path
                                                                d="M13 5.466V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192m0 9v-3.932a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192" />
                                                </svg>
                                        </button>
                                </div>
                                <div class="progress-container">
                                        <div class="progress-bar" @click.stop="seekToPosition">
                                                <div class="progress-track">
                                                        <div class="progress-fill"
                                                                :style="{ width: progressPercent + '%' }"></div>
                                                </div>
                                        </div>
                                </div>
                        </div>
                </div>
        </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import spotifyService from '../../services/spotifyService.js';
import * as listenTogetherService from '../../services/listenTogetherService.js';
import { formatDuration } from '../../utils/datetime.js';

const router = useRouter();

// 响应式数据
const isLoggedIn = ref(false);
const currentTrack = ref(null);
const isPlaying = ref(false);
const position = ref(0);
const duration = ref(0);
const isShuffleOn = ref(false);
const isVinylMode = ref(false); // 黑胶唱片模式
const isInitializing = ref(false); // 初始化状态

// 一起听会话状态
const globalListenTogetherInfo = ref(null);

// 自动刷新定时器
let refreshInterval = null;

// 计算属性
const progressPercent = computed(() => {
        if (duration.value === 0) return 0;
        return (position.value / duration.value) * 100;
});

// 全局一起听状态显示文本
const globalListenTogetherText = computed(() => {
        if (!globalListenTogetherInfo.value) return '';
        return `和${globalListenTogetherInfo.value.partner}一起听了${formatDuration(globalListenTogetherInfo.value.totalDuration)}`;
});

// 方法
const getArtistNames = (artists) => {
        return artists?.map(a => a.name).join(', ') || '未知艺术家';
};

// 播放控制方法
const togglePlayback = async () => {
        if (!isLoggedIn.value) {
                goToMusicPage();
                return;
        }

        if (isInitializing.value) {
                return; // 防止在初始化期间操作
        }

        try {
                // 使用安全播放操作
                await spotifyService.safePlaybackOperation(async () => {
                        if (isPlaying.value) {
                                await spotifyService.pausePlayback();
                        } else {
                                await spotifyService.resumePlayback();
                        }
                });
                
                // 延迟更新状态，让Spotify有时间处理请求
                setTimeout(async () => {
                        await updatePlaybackState();
                }, 800);
                
        } catch (error) {
                console.error('播放控制失败:', error);
                
                // 静默处理错误，更新状态以反映真实情况
                setTimeout(async () => {
                        await updatePlaybackState();
                }, 800);
        }
};

const startPlayback = async () => {
        if (!isLoggedIn.value) {
                goToMusicPage();
                return;
        }

        if (isInitializing.value) {
                return; // 防止重复初始化
        }

        isInitializing.value = true;
        
        try {
                // 使用改进的安全播放操作
                await spotifyService.safePlaybackOperation(async () => {
                        // 先检查是否有活跃的播放设备
                        const playback = await spotifyService.getCurrentPlayback();
                        
                        if (playback && playback.item) {
                                // 有播放内容，直接恢复播放
                                await spotifyService.resumePlayback();
                        } else {
                                // 没有当前播放内容，尝试开始播放
                                await spotifyService.resumePlayback();
                        }
                });
                
                // 更新状态
                setTimeout(async () => {
                        await updatePlaybackState();
                }, 1000); // 增加等待时间
                
        } catch (error) {
                console.error('开始播放失败:', error);
                
                // 不显示错误信息给用户，静默处理
                setTimeout(async () => {
                        await updatePlaybackState();
                }, 1000);
        } finally {
                isInitializing.value = false;
        }
};

const previousTrack = async () => {
        if (!isLoggedIn.value || !currentTrack.value) {
                return; // 无播放内容时不执行任何操作
        }

        try {
                await spotifyService.apiRequest('/me/player/previous', { method: 'POST' });
                setTimeout(updatePlaybackState, 500);
        } catch (error) {
                console.error('上一首失败:', error);
        }
};

const nextTrack = async () => {
        if (!isLoggedIn.value || !currentTrack.value) {
                return; // 无播放内容时不执行任何操作
        }

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
        if (!isLoggedIn.value) {
                return;
        }

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

const toggleVinylMode = () => {
        isVinylMode.value = !isVinylMode.value;
        // 保存用户偏好
        localStorage.setItem('music_widget_vinyl_mode', isVinylMode.value.toString());
};

const goToMusicPage = () => {
        router.push('/music');
};

// 状态更新方法
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
                }
        } catch (error) {
                console.error('获取播放状态失败:', error);
                currentTrack.value = null;
        }
};

// 检查登录状态
const checkLoginStatus = () => {
        isLoggedIn.value = spotifyService.isLoggedIn();
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

// 生命周期
onMounted(async () => {
        checkLoginStatus();
        
        // 恢复用户偏好的显示模式
        const savedVinylMode = localStorage.getItem('music_widget_vinyl_mode');
        if (savedVinylMode) {
                isVinylMode.value = savedVinylMode === 'true';
        }
        
        if (isLoggedIn.value) {
                await updatePlaybackState();
                await updateListenTogetherInfo();
                // 每60秒更新一次状态
                refreshInterval = setInterval(async () => {
                        await updatePlaybackState();
                        await updateListenTogetherInfo();
                }, 60000);
        }
});

onUnmounted(() => {
        if (refreshInterval) {
                clearInterval(refreshInterval);
        }
});
</script>

<style scoped>
.music-player-widget {
        background: var(--app-bg);
        backdrop-filter: blur(20px);
        border: 1px solid var(--app-border);
        border-radius: 16px;
        padding-right: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        width: 100%;
        height: 100%;
        min-height: 120px;
        overflow: hidden;
}

.music-player-widget:hover {
        background: var(--app-bg-hover);
        border-color: var(--app-border);
        transform: translateY(-2px);
}

/* 通用的左右布局 */
.login-prompt,
.empty-player,
.playing-state {
        display: flex;
        align-items: center;
        height: 100%;
        gap: 12px;
}

/* 左侧专辑封面区域 */
.album-art {
        flex-shrink: 0;
        aspect-ratio: 1 / 1;
        height: 100%;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
}

.album-art:hover {
        transform: scale(1.05);
        border-color: rgba(255, 255, 255, 0.2);
}

.album-art img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 11px;
}

.album-art svg {
        opacity: 0.7;
        color: rgba(255, 255, 255, 0.8);
}

.album-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        color: rgba(255, 255, 255, 0.6);
}

/* 黑胶唱片样式 */
.vinyl-record {
        width: 95%;
        height: 95%;
        position: relative;
        border-radius: 50%;
        animation: spin 3s linear infinite;
}

/* 暂停时停止动画 */
.vinyl-record:not(.spinning) {
        animation-play-state: paused;
}

@keyframes spin {
        from {
                transform: rotate(0deg);
        }

        to {
                transform: rotate(360deg);
        }
}

.vinyl-disc {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        position: relative;
        box-shadow:
                inset 0 0 15px rgba(0, 0, 0, 0.7),
                0 5px 20px rgba(0, 0, 0, 0.5);

        background-color: #0a0a0a;
        /* 关键：移除这里的光泽渐变，只保留凹槽纹理 */
        background-image:
                repeating-radial-gradient(circle at center,
                        rgba(255, 255, 255, 0.03) 0,
                        rgba(255, 255, 255, 0.03) 1px,
                        transparent 1px,
                        transparent 2.5px);
}

.vinyl-label {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 70%;
        aspect-ratio: 1 / 1;
        border-radius: 50%;
        overflow: hidden;
        background: var(--app-bg);
        border: 2px solid var(--app-border);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}
.vinyl-label img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
}

.vinyl-label .album-placeholder {
        width: 100%;
        height: 100%;
        color: var(--app-bg);
}

.vinyl-label .album-placeholder svg {
        width: 16px;
        height: 16px;
}

.vinyl-center-hole {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 10%;
        aspect-ratio: 1 / 1;
        background: #0d0d0d;
        border-radius: 50%;
        box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.8);
}

/* 右侧信息区域 */
.track-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        min-width: 0;
        height: 80px;
}

.track-title {
        font-size: 14px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.95);
        margin-bottom: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.2;
}

.track-artist {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.7);
        margin-bottom: 8px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.2;
}

.listen-together-info {
        font-size: 11px;
        color: var(--accent-primary, #1DB954);
        margin-bottom: 6px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.2;
        font-weight: 500;
}

/* 控制按钮 */
.controls {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 8px;
}

.control-btn,
.play-btn {
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

.play-btn {
        width: 32px;
        height: 32px;
        background: var(--accent-primary, #1DB954);
        color: white;
}

.control-btn:hover,
.play-btn:hover {
        background: rgba(255, 255, 255, 0.25);
        transform: scale(1.05);
}

.play-btn:hover {
        background: var(--accent-darker, #1ed760);
}

.control-btn.disabled {
        opacity: 0.4;
        cursor: not-allowed;
        pointer-events: none;
}

.control-btn.active {
        background: var(--accent-primary, #1DB954);
        color: white;
}

/* 进度条 */
.progress-container {
        width: 100%;
}

.progress-bar {
        width: 100%;
        height: 4px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
        cursor: pointer;
        position: relative;
        overflow: hidden;
}

.progress-track {
        width: 100%;
        height: 100%;
        position: relative;
}

.progress-fill {
        height: 100%;
        background: var(--accent-primary, #1DB954);
        border-radius: 2px;
        transition: width 0.1s ease;
        position: absolute;
        top: 0;
        left: 0;
}

.progress-bar:hover {
        height: 6px;
        margin-top: -1px;
}

.progress-bar:hover .progress-fill {
        background: var(--accent-lighter, #1ed760);
}

/* 特殊状态样式调整 */
.login-prompt .track-title {
        color: var(--accent-primary, #1DB954);
        font-weight: 700;
}

.empty-player .track-title {
        color: rgba(255, 255, 255, 0.8);
}

.empty-player .album-art {
        background: rgba(255, 255, 255, 0.05);
}

/* 响应式调整 */
@media (max-width: 768px) {
        .track-title {
                font-size: 13px;
        }
        
        .track-artist {
                font-size: 11px;
        }
        
        .control-btn,
        .play-btn {
                width: 24px;
                height: 24px;
        }
        
        .play-btn {
                width: 28px;
                height: 28px;
        }
        
        .controls {
                gap: 4px;
        }
}
</style>
