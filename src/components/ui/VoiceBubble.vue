<template>
        <div class="voice-bubble" :class="{ 'own-message': isOwnMessage }">
                <!-- 语音播放区域 -->
                <div class="voice-player">
                        <div class="play-button" :class="{ playing: isPlaying }" @click="togglePlay">
                                <svg v-if="!isPlaying" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M8 5v14l11-7z"/>
                                </svg>
                                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                                </svg>
                        </div>
                        
                        <!-- 语音波形动画 -->
                        <div class="voice-waveform" :class="{ 'clickable': !autoShow }" @click="handleWaveformClick">
                                <div class="wave-bar" v-for="i in 40" :key="i" 
                                     :class="{ active: isPlaying }"
                                     :style="{ animationDelay: (i * 0.1) + 's' }">
                                </div>
                        </div>
                        
                        <!-- 语音时长 -->
                        <div class="voice-duration" :class="{ 'clickable': !autoShow }" @click="handleWaveformClick">
                                {{ formatDuration(currentTime) }} / {{ formatDuration(duration) }}
                        </div>
                </div>
                
                <!-- 语音文本内容（可折叠） -->
                <div v-if="showText" class="voice-text">
                        <div class="text-content">
                                {{ text }}
                        </div>
                </div>
        </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
        text: {
                type: String,
                required: true
        },
        duration: {
                type: Number,
                required: true
        },
        isOwnMessage: {
                type: Boolean,
                default: false
        },
        autoShow: {
                type: Boolean,
                default: true
        }
});

const isPlaying = ref(false);
const currentTime = ref(0);
const showingText = ref(props.autoShow);
const animationInterval = ref(null);

// 计算属性
const showText = computed(() => {
        return props.autoShow || showingText.value;
});

// 格式化时长显示
const formatDuration = (ms) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (minutes > 0) {
                return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
        return `0:${remainingSeconds.toString().padStart(2, '0')}`;
};

// 切换播放状态
const togglePlay = () => {
        if (isPlaying.value) {
                stopPlaying();
        } else {
                startPlaying();
        }
};

// 处理波形区域点击（用于显示/隐藏文字）
const handleWaveformClick = () => {
        // 只有在非自动显示模式下，点击波形才能切换文字显示
        if (!props.autoShow) {
                toggleText();
        }
};

// 开始播放
const startPlaying = () => {
        isPlaying.value = true;
        const startTime = Date.now() - currentTime.value;
        
        animationInterval.value = setInterval(() => {
                const elapsed = Date.now() - startTime;
                currentTime.value = elapsed;
                
                if (elapsed >= props.duration) {
                        stopPlaying();
                        currentTime.value = 0; // 重置到开始
                }
        }, 100); // 每100ms更新一次
};

// 停止播放
const stopPlaying = () => {
        isPlaying.value = false;
        if (animationInterval.value) {
                clearInterval(animationInterval.value);
                animationInterval.value = null;
        }
};

// 切换文字显示
const toggleText = () => {
        showingText.value = !showingText.value;
};

// 重置播放状态
const resetPlay = () => {
        stopPlaying();
        currentTime.value = 0;
};

// 监听 autoShow 变化
watch(() => props.autoShow, (newVal) => {
        showingText.value = newVal;
});

// 组件卸载时清理
onUnmounted(() => {
        stopPlaying();
});

// 暴露方法给父组件
defineExpose({
        resetPlay,
        togglePlay
});
</script>

<style scoped>
.voice-bubble {
        background-color: var(--char-bubble-bg, var(--bg-card));
        border-radius: 18px;
        padding: 12px 16px;
        position: relative;
}

.voice-bubble.own-message {
        background-color: var(--user-bubble-bg, var(--accent-primary));
        color: var(--user-bubble-text, var(--accent-text));
        margin-left: auto;
}

.voice-player {
        display: flex;
        align-items: center;
        gap: 12px;
        user-select: none;
}

.play-button {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: var(--accent-primary);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        flex-shrink: 0;
        cursor: pointer;
}

.voice-bubble.own-message .play-button {
        background-color: rgba(255, 255, 255, 0.2);
        color: var(--accent-text);
}

.play-button:hover {
        transform: scale(1.05);
}

.play-button.playing {
        animation: pulse 2s infinite;
}

@keyframes pulse {
        0% {
                box-shadow: 0 0 0 0 rgba(var(--accent-primary-rgb), 0.7);
        }
        70% {
                box-shadow: 0 0 0 10px rgba(var(--accent-primary-rgb), 0);
        }
        100% {
                box-shadow: 0 0 0 0 rgba(var(--accent-primary-rgb), 0);
        }
}

.voice-waveform {
        display: flex;
        align-items: center;
        gap: 2px;
        flex: 1;
        height: 24px;
        overflow: hidden;
}

.voice-waveform.clickable {
        cursor: pointer;
}

.voice-waveform.clickable:hover .wave-bar {
        background-color: var(--accent-primary);
}

.voice-bubble.own-message .voice-waveform.clickable:hover .wave-bar {
        background-color: var(--accent-text);
}

.wave-bar {
        width: 3px;
        height: 8px;
        background-color: var(--text-secondary);
        border-radius: 2px;
        transition: all 0.3s ease;
}

.voice-bubble.own-message .wave-bar {
        background-color: rgba(255, 255, 255, 0.5);
}

.wave-bar.active {
        animation: wave-animation 1.5s ease-in-out infinite;
        background-color: var(--accent-primary);
}

.voice-bubble.own-message .wave-bar.active {
        background-color: var(--accent-text);
}

@keyframes wave-animation {
        0%, 100% {
                height: 8px;
        }
        50% {
                height: 20px;
        }
}

.voice-duration {
        font-size: 12px;
        color: var(--text-secondary);
        white-space: nowrap;
        flex-shrink: 0;
}

.voice-duration.clickable {
        cursor: pointer;
}

.voice-duration.clickable:hover {
        color: var(--accent-primary);
}

.voice-bubble.own-message .voice-duration.clickable:hover {
        color: var(--accent-text);
}

.voice-bubble.own-message .voice-duration {
        color: rgba(255, 255, 255, 0.8);
}

.voice-text {
        margin-top: 12px;
        border-top: 1px solid var(--border-color);
        padding-top: 12px;
}

.voice-bubble.own-message .voice-text {
        border-top-color: rgba(255, 255, 255, 0.2);
}

.text-content {
        font-size: 14px;
        line-height: 1.4;
        margin-bottom: 8px;
        word-break: break-all;
        white-space: pre-wrap;
}
.voice-bubble.own-message .toggle-text-btn {
        border-color: rgba(255, 255, 255, 0.3);
        color: var(--user-bubble-text);
}

.toggle-text-btn:hover {
        background-color: var(--bg-secondary);
        border-color: var(--accent-primary);
        color: var(--accent-primary);
}

.voice-bubble.own-message .toggle-text-btn:hover {
        background-color: rgba(255, 255, 255, 0.1);
        border-color: var(--accent-text);
        color: var(--accent-text);
}

/* 响应式设计 */
@media (max-width: 480px) {

        .voice-duration {
                display: none;
        }
        
        .wave-bar {
                width: 2px;
        }
}
</style>
