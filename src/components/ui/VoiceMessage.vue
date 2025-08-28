<template>
        <div class="voice-message" :class="{ playing: isPlaying, 'is-permanent': message.isPermanent }">
                <div class="voice-header">
                        <button @click="togglePlayback" class="play-button" :disabled="isLoading">
                                <span v-if="isLoading" class="loading-icon">⏳</span>
                                <span v-else-if="isPlaying" class="pause-icon">⏸️</span>
                                <span v-else class="play-icon">▶️</span>
                        </button>
                        <div class="voice-info">
                                <div class="duration">{{ formatDuration(message.duration || 0) }}</div>
                                <div v-if="!message.isPermanent" class="temp-indicator">临时文件</div>
                        </div>
                </div>
                
                <div class="waveform-container" ref="waveformContainer">
                        <canvas 
                                ref="waveformCanvas"
                                class="waveform-canvas"
                                @click="seekToPosition"
                        ></canvas>
                        <div class="progress-line" :style="{ left: progressPercentage + '%' }"></div>
                </div>
                
                <div v-if="message.text && showTranscript" class="transcript">
                        <div class="transcript-header">
                                <span>文本内容</span>
                                <button @click="showTranscript = false" class="close-transcript">×</button>
                        </div>
                        <p>{{ message.text }}</p>
                </div>
                
                <div class="voice-actions">
                        <button @click="showTranscript = !showTranscript" class="action-button transcript-button">
                                {{ showTranscript ? '隐藏' : '显示' }}文本
                        </button>
                        <button v-if="message.isPermanent" @click="downloadAudio" class="action-button download-button">
                                下载
                        </button>
                </div>

                <audio 
                        ref="audioElement" 
                        :src="message.url"
                        @loadedmetadata="onAudioLoaded"
                        @timeupdate="onTimeUpdate"
                        @ended="onAudioEnded"
                        @error="onAudioError"
                        preload="metadata"
                ></audio>
        </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';

const props = defineProps({
        message: {
                type: Object,
                required: true
        }
});

// 状态管理
const isPlaying = ref(false);
const isLoading = ref(false);
const showTranscript = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const progressPercentage = ref(0);

// DOM 引用
const audioElement = ref(null);
const waveformCanvas = ref(null);
const waveformContainer = ref(null);

// 波形数据
const waveformData = ref(null);
const canvasContext = ref(null);

// 生命周期
onMounted(async () => {
        await nextTick();
        initializeCanvas();
        generateWaveform();
});

onUnmounted(() => {
        if (audioElement.value) {
                audioElement.value.pause();
        }
});

// 监听消息变化
watch(() => props.message.url, () => {
        generateWaveform();
        resetPlayback();
});

// 初始化画布
function initializeCanvas() {
        if (!waveformCanvas.value || !waveformContainer.value) return;
        
        const canvas = waveformCanvas.value;
        const container = waveformContainer.value;
        
        // 设置画布尺寸
        const resizeCanvas = () => {
                const rect = container.getBoundingClientRect();
                canvas.width = rect.width * window.devicePixelRatio;
                canvas.height = 60 * window.devicePixelRatio;
                canvas.style.width = rect.width + 'px';
                canvas.style.height = '60px';
                
                canvasContext.value = canvas.getContext('2d');
                canvasContext.value.scale(window.devicePixelRatio, window.devicePixelRatio);
                
                if (waveformData.value) {
                        drawWaveform();
                }
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        onUnmounted(() => {
                window.removeEventListener('resize', resizeCanvas);
        });
}

// 生成波形数据
async function generateWaveform() {
        if (!props.message.url) return;
        
        try {
                // 为了性能考虑，我们生成模拟的波形数据
                // 在实际应用中，你可能想要使用 Web Audio API 来分析真实的音频
                waveformData.value = generateMockWaveform();
                drawWaveform();
        } catch (error) {
                console.error('生成波形失败:', error);
                // 生成默认波形
                waveformData.value = generateDefaultWaveform();
                drawWaveform();
        }
}

// 生成模拟波形数据（基于文本内容）
function generateMockWaveform() {
        const points = 150; // 波形点数
        const data = [];
        const text = props.message.text || '';
        
        // 基于文本内容生成更真实的波形
        for (let i = 0; i < points; i++) {
                const progress = i / points;
                
                // 基础波形（正弦波 + 噪声）
                let amplitude = Math.sin(progress * Math.PI * 6) * 0.5;
                amplitude += (Math.random() - 0.5) * 0.3;
                
                // 根据文本字符影响波形
                const charIndex = Math.floor(progress * text.length);
                if (charIndex < text.length) {
                        const char = text[charIndex];
                        // 标点符号处降低音量
                        if ('，。！？、；：'.includes(char)) {
                                amplitude *= 0.2;
                        }
                        // 感叹号和问号增加波动
                        else if ('！？'.includes(char)) {
                                amplitude *= 1.5;
                        }
                }
                
                // 开头和结尾渐变
                if (progress < 0.1) {
                        amplitude *= progress / 0.1;
                } else if (progress > 0.9) {
                        amplitude *= (1 - progress) / 0.1;
                }
                
                data.push(Math.max(0.05, Math.min(1, Math.abs(amplitude))));
        }
        
        return data;
}

// 生成默认波形数据
function generateDefaultWaveform() {
        const points = 100;
        const data = [];
        
        for (let i = 0; i < points; i++) {
                const progress = i / points;
                const amplitude = Math.sin(progress * Math.PI * 4) * 0.5 + 0.5;
                data.push(amplitude * 0.8);
        }
        
        return data;
}

// 绘制波形
function drawWaveform() {
        if (!canvasContext.value || !waveformData.value) return;
        
        const ctx = canvasContext.value;
        const canvas = waveformCanvas.value;
        const data = waveformData.value;
        
        const width = canvas.style.width ? parseInt(canvas.style.width) : canvas.width;
        const height = canvas.style.height ? parseInt(canvas.style.height) : canvas.height;
        
        // 清空画布
        ctx.clearRect(0, 0, width, height);
        
        // 绘制波形
        const barWidth = width / data.length;
        const centerY = height / 2;
        
        data.forEach((amplitude, index) => {
                const x = index * barWidth;
                const barHeight = amplitude * (height * 0.8);
                
                // 渐变色
                const gradient = ctx.createLinearGradient(0, 0, 0, height);
                
                if (progressPercentage.value > 0 && (index / data.length) * 100 <= progressPercentage.value) {
                        // 已播放部分 - 蓝色渐变
                        gradient.addColorStop(0, '#4A90E2');
                        gradient.addColorStop(1, '#2E5C8A');
                } else {
                        // 未播放部分 - 灰色渐变
                        gradient.addColorStop(0, '#E1E5E9');
                        gradient.addColorStop(1, '#B0B8C1');
                }
                
                ctx.fillStyle = gradient;
                ctx.fillRect(x, centerY - barHeight / 2, Math.max(2, barWidth - 1), barHeight);
        });
}

// 切换播放状态
async function togglePlayback() {
        if (!audioElement.value) return;
        
        if (isPlaying.value) {
                audioElement.value.pause();
        } else {
                try {
                        isLoading.value = true;
                        await audioElement.value.play();
                } catch (error) {
                        console.error('播放失败:', error);
                        // 可以在这里显示错误提示
                } finally {
                        isLoading.value = false;
                }
        }
}

// 跳转到指定位置
function seekToPosition(event) {
        if (!audioElement.value || !duration.value) return;
        
        const rect = waveformCanvas.value.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const progress = clickX / rect.width;
        const newTime = progress * duration.value;
        
        audioElement.value.currentTime = newTime;
}

// 重置播放状态
function resetPlayback() {
        isPlaying.value = false;
        currentTime.value = 0;
        progressPercentage.value = 0;
        drawWaveform();
}

// 音频事件处理
function onAudioLoaded() {
        if (audioElement.value) {
                duration.value = audioElement.value.duration || props.message.duration || 0;
        }
}

function onTimeUpdate() {
        if (audioElement.value) {
                currentTime.value = audioElement.value.currentTime;
                if (duration.value > 0) {
                        progressPercentage.value = (currentTime.value / duration.value) * 100;
                        drawWaveform();
                }
        }
}

function onAudioEnded() {
        isPlaying.value = false;
        progressPercentage.value = 0;
        currentTime.value = 0;
        drawWaveform();
}

function onAudioError(event) {
        console.error('音频加载错误:', event);
        isLoading.value = false;
        isPlaying.value = false;
}

// 监听播放状态变化
watch(() => audioElement.value?.paused, (paused) => {
        if (paused !== undefined) {
                isPlaying.value = !paused;
        }
});

// 格式化时长
function formatDuration(seconds) {
        if (!seconds || seconds < 0) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// 下载音频
function downloadAudio() {
        if (!props.message.isPermanent || !props.message.url) return;
        
        const link = document.createElement('a');
        link.href = props.message.url;
        link.download = `voice_message_${props.message.timestamp}.mp3`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
}
</script>

<style scoped>
.voice-message {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 16px;
        margin: 8px 0;
        max-width: 320px;
}

.voice-message.is-permanent {
        border-left: 4px solid var(--accent-primary);
}

.voice-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
}

.play-button {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: none;
        background: var(--accent-primary);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.2s ease;
}

.play-button:hover:not(:disabled) {
        background: var(--accent-darker);
        transform: scale(1.05);
}

.play-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
}

.voice-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
}

.duration {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
}

.temp-indicator {
        font-size: 12px;
        color: var(--text-secondary);
        opacity: 0.8;
}

.waveform-container {
        position: relative;
        height: 60px;
        margin: 12px 0;
        background: var(--bg-primary);
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
}

.waveform-canvas {
        width: 100%;
        height: 100%;
        display: block;
}

.progress-line {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 2px;
        background: var(--accent-primary);
        pointer-events: none;
        transition: left 0.1s linear;
        box-shadow: 0 0 8px rgba(74, 144, 226, 0.5);
}

.transcript {
        margin-top: 12px;
        padding: 12px;
        background: var(--bg-primary);
        border-radius: 8px;
        border: 1px solid var(--border-color);
}

.transcript-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        font-size: 12px;
        font-weight: 600;
        color: var(--text-secondary);
}

.close-transcript {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        font-size: 16px;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
}

.transcript p {
        margin: 0;
        font-size: 14px;
        line-height: 1.5;
        color: var(--text-primary);
}

.voice-actions {
        display: flex;
        gap: 8px;
        margin-top: 12px;
        justify-content: flex-end;
}

.action-button {
        padding: 6px 12px;
        border: 1px solid var(--border-color);
        background: var(--bg-primary);
        color: var(--text-secondary);
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s ease;
}

.action-button:hover {
        background: var(--bg-secondary);
        color: var(--text-primary);
}

.download-button:hover {
        border-color: var(--accent-primary);
        color: var(--accent-primary);
}

.voice-message.playing .play-button {
        background: var(--accent-primary);
        animation: pulse 1.5s infinite;
}

@keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
}

.loading-icon {
        animation: spin 1s linear infinite;
}

@keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
}
</style>
