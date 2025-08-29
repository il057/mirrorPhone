<template>
        <div class="photo-widget widget" @click="nextRandomPhoto">
                <div v-if="!currentPhoto && !isLoading" class="empty-state">
                        <p :style="{ fontSize: emptyTextSize }">相册暂无照片</p>
                </div>

                <div v-else-if="isLoading" class="loading-state">
                        <div class="loading-spinner"></div>
                        <p>加载中...</p>
                </div>

                <div v-else class="photo-container">
                        <img :src="currentPhoto.url" :alt="currentPhoto.name || '照片'" class="photo-image" />
                        <div class="photo-overlay">
                                <div class="photo-info">
                                        <span class="photo-counter">{{ currentIndex + 1 }}/{{ availablePhotos.length
                                        }}</span>
                                </div>
                        </div>
                </div>
        </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import db from '../../services/database.js';

const props = defineProps({
        widgetId: {
                type: String,
                default: () => `photo-widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        },
        widgetSize: {
                type: Object,
                default: () => ({ col: 2, row: 2 })
        }
});

const currentPhoto = ref(null);
const currentIndex = ref(0);
const availablePhotos = ref([]);
const isLoading = ref(false);

// 根据小组件大小调整字体大小
const emptyTextSize = computed(() => {
        const baseSize = Math.min(props.widgetSize.col, props.widgetSize.row);
        return `${Math.max(0.8, Math.min(1.2, baseSize * 0.4))}rem`;
});

let autoChangeTimer = null;

const loadPhotos = async () => {
        try {
                isLoading.value = true;
                const photos = await db.globalAlbum.toArray();
                availablePhotos.value = photos;

                if (photos.length === 0) {
                        currentPhoto.value = null;
                        currentIndex.value = 0;
                        return;
                }

                // 随机选择一张照片作为起始照片
                loadRandomPhoto();
        } catch (error) {
                console.error('加载照片失败:', error);
        } finally {
                isLoading.value = false;
        }
};

const loadRandomPhoto = () => {
        if (availablePhotos.value.length === 0) return;

        const randomIndex = Math.floor(Math.random() * availablePhotos.value.length);
        currentIndex.value = randomIndex;
        currentPhoto.value = availablePhotos.value[randomIndex];
};

const nextRandomPhoto = () => {
        if (availablePhotos.value.length === 0) return;
        loadRandomPhoto();
};

const setupAutoTimer = () => {
        if (autoChangeTimer) {
                clearInterval(autoChangeTimer);
                autoChangeTimer = null;
        }

        if (availablePhotos.value.length > 1) {
                // 每30秒自动切换到下一张随机照片
                autoChangeTimer = setInterval(() => {
                        loadRandomPhoto();
                }, 30000);
        }
};

onMounted(async () => {
        await loadPhotos();
        setupAutoTimer();
});

onUnmounted(() => {
        if (autoChangeTimer) {
                clearInterval(autoChangeTimer);
        }
});
</script>

<style scoped>
.photo-widget {
        width: 100%;
        height: 100%;
        position: relative;
        border-radius: 12px;
        overflow: hidden;
        cursor: pointer;
        transition: transform 0.2s ease;
}

.photo-widget:hover {
        transform: scale(1.02);
}

.empty-state,
.loading-state {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100%;
        color: var(--opacity-70);
        text-align: center;
}

.photo-icon {
        font-size: 2rem;
        margin-bottom: 8px;
}

.loading-spinner {
        width: 24px;
        height: 24px;
        border: 2px solid var(--opacity-30);
        border-top: 2px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 8px;
}

@keyframes spin {
        0% {
                transform: rotate(0deg);
        }

        100% {
                transform: rotate(360deg);
        }
}

.photo-container {
        position: relative;
        width: 100%;
        height: 100%;
}

.photo-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: opacity 0.3s ease;
}

.photo-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(transparent, rgba(0, 0, 0, 0.5));
        padding: 8px 12px 6px;
        opacity: 0;
        transition: opacity 0.2s ease;
}

.photo-container:hover .photo-overlay {
        opacity: 1;
}

.photo-info {
        display: flex;
        justify-content: flex-end;
        align-items: center;
}

.photo-counter {
        color: white;
        font-size: 11px;
        background: var(--app-bg);
        padding: 2px 6px;
        border-radius: 4px;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
}
</style>
