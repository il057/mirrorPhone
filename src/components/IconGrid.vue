<template>
        <div class="icon-grid" :class="gridClass">
                <div v-for="app in apps" :key="app.id" :class="itemClass" :style="itemStyle"
                        @click="handleIconClick(app)">
                        <!-- homeView 模式：使用 AppIcon 组件 -->
                        <div v-if="!isPreviewMode" class="app-wrapper"
                                :class="{ 'has-notification': showNotificationEffect && notificationApps.includes(app.id) }">
                                <AppIcon :name="app.name" :icon-src="iconSettings[app.id]">
                                        <component :is="app.component" />
                                </AppIcon>
                        </div>

                        <!-- PersonalizationView 预览模式 -->
                        <div v-else class="preview-app-icon"
                                :class="{ 'has-notification': showNotificationEffect && notificationApps.includes(app.id) }">
                                <div class="icon-image-container">
                                        <img v-if="iconSettings[app.id]" :src="iconSettings[app.id]" class="icon-image"
                                                alt="App Icon Preview" />
                                        <component v-else :is="app.component" />
                                </div>
                                <span class="icon-name">{{ app.name }}</span>
                        </div>
                </div>
        </div>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'

// Props
const props = defineProps({
        apps: {
                type: Array,
                required: true
        },
        iconSettings: {
                type: Object,
                default: () => ({})
        },
        showNotificationEffect: {
                type: Boolean,
                default: false
        },
        notificationApps: {
                type: Array,
                default: () => []
        },
        isPreviewMode: {
                type: Boolean,
                default: false
        },
        gridClass: {
                type: String,
                default: ''
        },
        itemClass: {
                type: String,
                default: 'icon-item'
        },
        itemStyle: {
                type: Object,
                default: () => ({})
        }
})

// Emits
const emit = defineEmits(['icon-click'])

// Methods
const handleIconClick = (app) => {
        emit('icon-click', app)
}
</script>

<style scoped>
.icon-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
        width: 100%;
        padding: 12px;
        box-sizing: border-box;
}

/* 基础图标项样式 */
.icon-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        padding: 4px;
        border-radius: 8px;
        transition: all 0.2s ease;
}

/* 预览模式样式 */
.preview-app-icon {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        padding: 4px;
        border-radius: 8px;
        transition: background-color 0.2s ease;
}


/* 图标容器样式 */
.icon-image-container {
        width: 50px;
        height: 50px;
        background: var(--app-bg);
        border: 1px solid var(--app-border);
        border-radius: 10px;
        display: flex;
        justify-content: center;
        align-items: center;
        color: white;
        overflow: hidden;
        backdrop-filter: blur(15px);
        -webkit-backdrop-filter: blur(15px);
        position: relative;
}

/* 确保图标占满容器 */
.icon-image-container .icon-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
}

.icon-image-container svg {
        width: 55%;
        height: 55%;
}

/* 图标名称样式 */
.icon-name {
        font-size: 10px;
        color: white;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
        line-height: 1.2;
}

/* App包装器样式（用于homeView） */
.app-wrapper {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
}
</style>
      
