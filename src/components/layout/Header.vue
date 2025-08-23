<template>
        <header class="app-header">
                <div class="header-left">
                        <a @click="$emit('back')" class="back-button">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"
                                        stroke="currentColor" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                        </a>
                </div>
                <div class="header-title">
                        {{ title }}
                </div>
                <div class="header-right">
                        <slot name="right"></slot>
                </div>
        </header>
</template>

<script setup>
defineProps({
        title: {
                type: String,
                default: '页面标题' // 提供一个默认值
        }
});

// 定义组件可以发出的事件
defineEmits(['back']);
</script>

<style scoped>
.app-header {
        /* 布局与定位 */
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        z-index: 100;
        box-sizing: border-box;
        /* 确保 padding 不会影响宽度 */

        /* 外观与毛玻璃效果 */
        background-color: var(--header-bg, rgba(42, 42, 42, 0.75));
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-bottom: 1px solid var(--border-color);
        color: var(--text-primary);

        /* 边距与安全区域 */
        height: calc(50px + env(safe-area-inset-top));
        padding-top: env(safe-area-inset-top);
        padding-left: 15px;
        padding-right: 15px;
        padding-bottom: 0;
        /* 底部不需要额外padding */

        flex-shrink: 0;
}

.header-left,
.header-right {
        flex: 0 0 auto;
        /* 不伸缩，不收缩，基于内容宽度 */
        min-width: 50px;
        /* 保证至少有50px的宽度 */
        color: var(--text-primary);
}

.header-right {
        display: flex;
        justify-content: flex-end;
}

.header-title {
        flex: 1 1 auto;
        /* 允许伸缩和收缩 */
        text-align: center;
        font-size: 18px;
        font-weight: 600;
        /* 防止标题过长时破坏布局 */
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding: 0 10px;
        /* 给标题一些呼吸空间 */
}

.back-button {
        background: none;
        border: none;
        color: var(--text-primary);
        font-size: 24px;
        font-weight: bold;
        cursor: pointer;
        padding: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
}

:deep(.header-right .header-action-button) {
        background: none;
        border: none;
        color: var(--text-primary);
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.2s ease;
}

.header-left .back-button:hover,
:deep(.header-right .header-action-button:hover) {
        color: var(--accent-primary);
}
</style>