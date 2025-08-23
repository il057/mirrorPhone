<template>
        <div class="app-icon">
                <div class="icon-wrapper">
                        <slot></slot>
                </div>
                <span class="app-name">{{ name }}</span>
        </div>
</template>

<script setup>
defineProps({
        name: {
                type: String,
                required: true,
        }
        });
</script>

<style scoped>
.app-icon {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        color: white;
        cursor: pointer;
        width: 80px; /* 固定宽度，方便布局 */
}

.icon-wrapper {
        width: 60px;
        height: 60px;
        background-color: rgba(255, 255, 255, 0.15);
        border-radius: 15px; /* iOS风格的圆角 */
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 8px;
        overflow: hidden; /* 确保SVG不会超出边界 */
        -webkit-backdrop-filter: blur(5px);
        backdrop-filter: blur(5px);
}

.icon-wrapper svg {
        width: 60%;
        height: 60%;
        color: #ffffff; /* SVG图标的颜色 */
}

.app-name {
        font-size: 12px;
        /* 防止文字换行 */
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 100%;
}
</style>
