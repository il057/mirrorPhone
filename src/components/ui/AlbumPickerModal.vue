<template>
        <transition name="modal-fade">
                <div class="modal-overlay" @click.self="handleCancel">
                        <div class="modal-content album-picker-modal">
                                <h3 class="modal-title">从相册选择</h3>

                                <div class="modal-body">
                                        <div v-if="!photos || photos.length === 0"
                                                class="text-center text-gray-500 py-8">
                                                相册是空的
                                        </div>

                                        <div v-else
                                                class="album-grid">
                                                <div v-for="photo in photos" :key="photo.id || photo.url"
                                                        class="album-item group cursor-pointer"
                                                        @click="handleSelect(photo.url)">
                                                        <img :src="photo.url" :title="photo.description || ''"
                                                                class="album-image"
                                                                loading="lazy">
                                                </div>
                                        </div>
                                </div>

                                <div class="modal-actions">
                                        <button @click="handleCancel" class="modal-btn cancel">关闭</button>
                                        <button @click="handleConfirm" class="modal-btn confirm" 
                                                :disabled="!selectedUrl">确认</button>
                                </div>
                        </div>
                </div>
        </transition>
</template>

<script setup>
import { defineProps, ref } from 'vue';

// 添加一个ref来存储选中的图片URL
const selectedUrl = ref(null);

// 定义组件接收的属性，包含数据和回调函数
const props = defineProps({
        photos: {
                type: Array,
                required: true,
        },
        onSelect: Function,
        onCancel: Function,
});

// 处理图片选择，现在只是标记选中的图片，不立即确认
const handleSelect = (url) => {
        selectedUrl.value = url;
};

// 新增：处理确认按钮点击，调用onSelect回调
const handleConfirm = () => {
        if (selectedUrl.value && props.onSelect) {
                props.onSelect(selectedUrl.value);
        }
};

// 处理取消操作，调用从 props 传入的 onCancel 函数
const handleCancel = () => {
        if (props.onCancel) {
                props.onCancel();
        }
};
</script>

<style scoped>
.album-picker-modal {
        max-height: 80vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
}

.modal-body {
        overflow-y: auto;
        max-height: calc(60vh - 120px); /* 留出标题和按钮的空间 */
        padding: 10px;
}

.album-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
}

@media (min-width: 640px) {
        .album-grid {
                grid-template-columns: repeat(4, 1fr);
        }
}

@media (min-width: 768px) {
        .album-grid {
                grid-template-columns: repeat(5, 1fr);
        }
}

.album-item {
        aspect-ratio: 1/1;
        overflow: hidden;
        border-radius: 6px;
        position: relative;
}

.album-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.2s;
}

.group:hover .album-image {
        transform: scale(1.05);
}

.selected-image {
        border: 3px solid var(--accent-primary);
        box-shadow: 0 0 8px var(--accent-primary);
}

.modal-btn.confirm:disabled {
        opacity: 0.5;
        cursor: not-allowed;
}
</style>