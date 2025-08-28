<template>
        <header class="app-header">
                <div class="header-left">
                        <slot name="left">
                                <a @click="handleBackClick" class="back-button">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
                                                viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                                        </svg>
                                </a>
                        </slot>
                </div>
                <div class="header-title">
                        <div class="title-text">{{ title }}</div>
                        <slot name="subtitle"></slot>
                </div>
                <div class="header-right">
                        <slot name="right"></slot>
                </div>
        </header>
</template>

<script setup>
import { useRouter } from 'vue-router';

// We now accept an optional function prop to override the default back behavior.
const props = defineProps({
        title: {
                type: String,
                default: '页面标题'
        },
        overrideBackAction: {
                type: Function,
                default: null,
        }
});


const router = useRouter();

// The new handler function
const handleBackClick = () => {
        // If a custom function is passed as a prop, run it.
        if (props.overrideBackAction) {
                props.overrideBackAction();
        } else {
                // Otherwise, perform the default action: go to the homepage.
                router.push('/');
        }
};
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
        z-index: 200;
        box-sizing: border-box;
        /* 确保 padding 不会影响宽度 */

        /* 外观与毛玻璃效果 */
        background-color: var(--header-bg, rgba(42, 42, 42, 0.75));
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-bottom: 1px solid var(--border-color);
        color: var(--text-primary);

        /* 边距与安全区域 */
        height: calc(56px + var(--safe-top));
        padding-top: var(--safe-top);
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
        /* 防止标题过长时破坏布局 */
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding: 0 10px;
        /* 给标题一些呼吸空间 */
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
}

.title-text {
        font-size: 18px;
        font-weight: 600;
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

/* 下拉菜单样式 */
:deep(.dropdown-container) {
        position: relative;
        display: inline-block;
}

:deep(.add-post-btn) {
        background: none;
        border: none;
        color: var(--text-primary);
        font-size: 20px;
        font-weight: 600;
        cursor: pointer;
        padding: 8px;
        border-radius: 50%;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
}

:deep(.add-post-btn:hover) {
        background-color: rgba(255, 255, 255, 0.1);
        color: var(--accent-primary);
}

:deep(.dropdown-menu) {
        position: absolute;
        top: 100%;
        right: 0;
        background: var(--card-bg, rgba(42, 42, 42, 0.95));
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        min-width: 140px;
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px);
        transition: all 0.2s ease;
        margin-top: 8px;
}

:deep(.dropdown-menu.show) {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
}

:deep(.dropdown-item) {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        color: var(--text-primary);
        text-decoration: none;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 14px;
        border: none;
        background: none;
        width: 100%;
        text-align: left;
}

:deep(.dropdown-item:hover) {
        background-color: rgba(255, 255, 255, 0.1);
        color: var(--accent-primary);
}

:deep(.dropdown-item:first-child) {
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
}

:deep(.dropdown-item:last-child) {
        border-bottom-left-radius: 8px;
        border-bottom-right-radius: 8px;
}

:deep(.dropdown-item svg) {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
}
</style>