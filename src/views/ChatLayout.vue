<template>
        <div class="app-main-container">
                <!-- 
      子路由对应的组件 (MessagesView, ContactsView 等) 
      将在这里被渲染出来。
    -->
                <router-view />

                <!-- 
      我们的通用 Footer。
      :hasNotification 是一个示例，你可以根据实际的全局状态来传递。
    -->
                <AppFooter :has-notification="true" />
        </div>
</template>

<script setup>
import AppFooter from '../components/layout/Footer.vue';
</script>

<style scoped>
.app-main-container {
        width: 100vw;
        height: 100vh;
        background-color: var(--bg-primary);
        /* 为固定的 Footer 留出空间 */
        padding-bottom: calc(55px + env(safe-area-inset-bottom));
        box-sizing: border-box;
        overflow: hidden;
        /* 防止页面整体滚动 */
}
</style>
