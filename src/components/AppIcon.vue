<template>
        <div class="app-icon">
                <div class="icon-wrapper">
                        <img v-if="iconSrc" :src="iconSrc" class="custom-icon-image" alt="App Icon" />
                        <slot v-else></slot>
                </div>
        </div>
        <span v-if="!isPreview" class="app-name">{{ name }}</span>
</template>
<script setup>
defineProps({
        name: {
                type: String,
                required: true,
        },
        iconSrc: {
                type: String,
                default: ''
        },
        isPreview: {
                type: Boolean,
                default: false
        }
        });
</script>

<style scoped>
.app-icon {
        width: 100%;
        height: 100%;
        color: white;
        cursor: pointer;
        position: relative;
}

.icon-wrapper {
        width: 100%;
        height: 100%;
        background: var(--app-bg);
        border: 1px solid var(--app-border);
        border-radius: min(16px, calc(var(--cell-size, 80px) * 0.2));
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
        -webkit-backdrop-filter: blur(15px);
        backdrop-filter: blur(15px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
}

/* 默认SVG图标样式 */
.icon-wrapper :deep(svg) {
        width: 60%;
        height: 60%;
}

/* 自定义图片样式 */
.custom-icon-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
}

.app-name {
        position: absolute;
        bottom: calc(-1 * var(--gap, 12px) * 0.7);
        left: 50%;
        transform: translateX(-50%);
        font-size: clamp(8px, calc(var(--gap, 12px) * 0.6), 11px);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        width: calc(100% + var(--gap, 12px) * 0.8);
        text-align: center;
        z-index: 10;
        padding: 2px 6px;
        border-radius: 6px;
        color: white;
        max-width: calc(var(--cell-size, 80px) + var(--gap, 12px));
        pointer-events: none;
        line-height: 1.2;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 16px;
}
</style>
