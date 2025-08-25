<template>
        <main class="page-content">
                <div class="user-profile-header">
                        <img class="avatar" src="https://files.catbox.moe/kkll8p.svg" alt="User Avatar">
                        <div class="user-info">
                                <h2 class="user-name">User</h2>
                                <p class="user-status">查看我的动态</p>
                        </div>
                </div>

                <div class="menu-list">
                        <router-link to="/stickers" class="menu-item">
                                <span>表情</span>
                                <svg class="chevron" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                        stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M9 5l7 7-7 7" />
                                </svg>
                        </router-link>
                        <div class="menu-item">
                                <span>收藏</span>
                                <svg class="chevron" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                        stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M9 5l7 7-7 7" />
                                </svg>
                        </div>
                        <div class="menu-item">
                                <span>朋友圈</span>
                                <svg class="chevron" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                        stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M9 5l7 7-7 7" />
                                </svg>
                        </div>
                        <div class="menu-item">
                                <span>设置</span>
                                <svg class="chevron" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                        stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M9 5l7 7-7 7" />
                                </svg>
                        </div>
                </div>
        </main>
</template>

<script setup>
// No script needed for this static layout yet
</script>

<style scoped>
.page-content {
        padding: 20px 15px;
        background-color: var(--bg-primary);
        padding-top: calc(var(--header-height) + 20px);
}

.user-profile-header {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 30px;
}

.avatar {
        width: 72px;
        height: 72px;
        border-radius: 8px;
        /* Rounded square avatar */
        object-fit: cover;
}

.user-name {
        font-size: 22px;
        font-weight: bold;
        margin: 0 0 4px 0;
}

.user-status {
        font-size: 14px;
        color: var(--text-secondary);
        margin: 0;
}

.menu-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
}

.menu-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 15px;
        background-color: var(--bg-card);
        border-radius: 8px;
        color: var(--text-primary);
        text-decoration: none;
        cursor: pointer;
}

.chevron {
        width: 20px;
        height: 20px;
        color: var(--text-secondary);
}
</style>