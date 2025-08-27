<template>
        <div class="page-container">
                <AppHeader title="收藏">
                        <template #left>
                                <a @click="goBack" class="back-button">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
                                                viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                <path stroke-linecap="round" stroke-linejoin="round"
                                                        d="M15 19l-7-7 7-7" />
                                        </svg>
                                </a>
                        </template>
                </AppHeader>

                <main class="favorites-content">
                        <!-- 筛选区域 -->
                        <div class="filters-section">
                                <div class="filter-group">
                                        <label class="filter-label">按作者筛选:</label>
                                        <MainDropdown :options="authorFilterOptions" v-model="selectedAuthor"
                                                @change="onAuthorChange" placeholder="全部作者" class="filter-dropdown" />
                                </div>
                                <div class="filter-group">
                                        <label class="filter-label">按类型筛选:</label>
                                        <MainDropdown :options="typeFilterOptions" v-model="selectedType"
                                                @change="onTypeChange" placeholder="全部类型" class="filter-dropdown" />
                                </div>
                        </div>

                        <!-- 收藏列表 -->
                        <div v-if="favorites.length === 0" class="empty-state">
                                <p>还没有收藏任何内容</p>
                        </div>

                        <div v-else class="favorites-list">
                                <div v-for="favorite in favorites" :key="favorite.id" class="favorite-item">
                                        <!-- 作者信息行 -->
                                        <div class="favorite-header">
                                                <div class="author-info">
                                                        <div class="author-avatar avatar">
                                                                <img v-if="getAuthorAvatar(favorite)"
                                                                        :src="getAuthorAvatar(favorite)"
                                                                        :alt="favorite.authorName">
                                                                <span v-else class="avatar-initial">{{
                                                                        getInitial(favorite.authorName) }}</span>
                                                        </div>
                                                        <div class="author-details">
                                                                <h4 class="author-name">{{ favorite.authorName }}</h4>
                                                                <p class="favorite-time">{{
                                                                        formatTimestamp(favorite.timestamp ||
                                                                        favorite.createTime) }}</p>
                                                        </div>
                                                </div>
                                                <div class="favorite-actions">
                                                        <button class="action-btn favorite-btn favorited"
                                                                @click="removeFavorite(favorite)">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="18"
                                                                        height="18" fill="currentColor"
                                                                        class="bi bi-bookmark-star-fill"
                                                                        viewBox="0 0 16 16">
                                                                        <path fill-rule="evenodd"
                                                                                d="M2 15.5V2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.74.439L8 13.069l-5.26 2.87A.5.5 0 0 1 2 15.5M8.16 4.1a.178.178 0 0 0-.32 0l-.634 1.285a.18.18 0 0 1-.134.098l-1.42.206a.178.178 0 0 0-.098.303L6.58 6.993c.042.041.061.1.051.158L6.39 8.565a.178.178 0 0 0 .258.187l1.27-.668a.18.18 0 0 1 .165 0l1.27.668a.178.178 0 0 0 .257-.187L9.368 7.15a.18.18 0 0 1 .05-.158l1.028-1.001a.178.178 0 0 0-.098-.303l-1.42-.206a.18.18 0 0 1-.134-.098z" />
                                                                </svg>
                                                        </button>
                                                </div>
                                        </div>

                                        <!-- 收藏内容 -->
                                        <div class="favorite-content">
                                                <p v-if="favorite.content.text" class="content-text">{{
                                                        favorite.content.text }}</p>

                                                <div v-if="favorite.content.images && favorite.content.images.length > 0"
                                                        class="content-images">
                                                        <img v-for="(image, index) in favorite.content.images"
                                                                :key="index" :src="image" :alt="`图片 ${index + 1}`"
                                                                class="content-image">
                                                </div>
                                        </div>
                                </div>
                        </div>
                </main>
        </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import AppHeader from '../components/layout/Header.vue';
import MainDropdown from '../components/ui/MainDropdown.vue';
import { getFavorites, deleteFavoritesByAuthor, removeFromFavorites } from '../services/favoritesService.js';
import { formatTimestamp } from '../utils/datetime.js';
import db from '../services/database.js';

const router = useRouter();

// 响应式数据
const favorites = ref([]);
const selectedAuthor = ref('');
const selectedType = ref('');
const availableAuthors = ref([]);

// 返回按钮处理
const goBack = () => {
        router.push('/chat/me');
};

// 获取作者头像
const getAuthorAvatar = (favorite) => {
        // 这里可以根据authorId从缓存或数据库获取头像
        // 暂时返回null，让组件显示首字母头像
        return null;
};

// 生成首字母头像
const getInitial = (name) => {
        if (!name) return 'U';
        return name.charAt(0).toUpperCase();
};

// 移除收藏
const removeFavorite = async (favorite) => {
        try {
                await removeFromFavorites(favorite.eventId);
                await loadFavorites();
                console.log('已取消收藏');
        } catch (error) {
                console.error('取消收藏失败:', error);
        }
};

// 加载收藏列表
const loadFavorites = async () => {
        try {
                const filters = {};
                if (selectedAuthor.value) filters.authorId = selectedAuthor.value;
                if (selectedType.value) filters.eventType = selectedType.value;
                
                favorites.value = await getFavorites(filters);
        } catch (error) {
                console.error('加载收藏失败:', error);
        }
};

// 下拉菜单选项
const authorFilterOptions = computed(() => [
        { label: '全部作者', value: '' },
        ...availableAuthors.value.map(author => ({
                label: author.name,
                value: author.id
        }))
]);

const typeFilterOptions = computed(() => [
        { label: '全部类型', value: '' },
        { label: '动态', value: 'post' },
        { label: '消息', value: 'message' },
        { label: '回复', value: 'reply' }
]);

// 下拉菜单选择处理
const onAuthorChange = (option) => {
        selectedAuthor.value = option.value;
        loadFavorites();
};

const onTypeChange = (option) => {
        selectedType.value = option.value;
        loadFavorites();
};

// 加载可用作者列表
const loadAvailableAuthors = async () => {
        try {
                const allFavorites = await getFavorites();
                const authorsMap = new Map();
                
                allFavorites.forEach(fav => {
                        if (!authorsMap.has(fav.authorId)) {
                                authorsMap.set(fav.authorId, {
                                        id: fav.authorId,
                                        name: fav.authorName
                                });
                        }
                });
                
                availableAuthors.value = Array.from(authorsMap.values());
        } catch (error) {
                console.error('加载作者列表失败:', error);
        }
};

// 监听角色删除事件，清理相关收藏
const handleActorDeletion = async (actorId) => {
        try {
                await deleteFavoritesByAuthor(actorId);
                await loadFavorites();
                await loadAvailableAuthors();
        } catch (error) {
                console.error('清理已删除角色的收藏失败:', error);
        }
};

onMounted(async () => {
        await loadFavorites();
        await loadAvailableAuthors();
        
        // 监听角色删除事件（如果有的话）
        window.addEventListener('actorDeleted', (event) => {
                handleActorDeletion(event.detail.actorId);
        });
});
</script>

<style scoped>
.page-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
        background-color: var(--bg-primary);
}

.favorites-content {
        flex: 1;
        padding: 15px;
        background-color: var(--bg-primary);
        overflow-y: auto;
}

.filters-section {
        display: flex;
        gap: 15px;
        margin-bottom: 20px;
        flex-wrap: wrap;
}

.filter-group {
        display: flex;
        flex-direction: column;
        gap: 5px;
        min-width: 120px;
        width: 48%;
}

@media (max-width: 344px) {
        .filter-group {
                width: 100%;
        }
}
.filter-label {
        font-size: 12px;
        color: var(--text-secondary);
        margin: 0;
}

.filter-dropdown {
        min-width: 150px;
}

.filter-select {
        padding: 8px 12px;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        background-color: var(--bg-card);
        color: var(--text-primary);
        font-size: 14px;
}

.filter-select:focus {
        outline: none;
        border-color: var(--accent-primary);
}

.empty-state {
        text-align: center;
        padding: 50px 20px;
        color: var(--text-secondary);
}

.favorites-list {
        display: flex;
        flex-direction: column;
        gap: 15px;
}

.favorite-item {
        background-color: var(--bg-card);
        border-radius: 12px;
        padding: 15px;
        border: 1px solid var(--border-color);
}

.favorite-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
}

.author-info {
        display: flex;
        align-items: center;
        gap: 10px;
}

.author-avatar {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: var(--bg-secondary);
        overflow: hidden;
}

.author-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
}

.avatar-initial {
        color: var(--accent-primary);
        font-size: 18px;
        font-weight: bold;
}

.author-details {
        display: flex;
        flex-direction: column;
        gap: 2px;
}

.author-name {
        font-size: 16px;
        font-weight: 600;
        margin: 0;
        color: var(--text-primary);
}

.favorite-time {
        font-size: 12px;
        color: var(--text-secondary);
        margin: 0;
}

.favorite-actions {
        display: flex;
        gap: 8px;
}

.action-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s ease;
        color: var(--text-secondary);
}

.action-btn:hover {
        color: var(--accent-primary);
        background-color: rgba(var(--bg-card-rgb), 0.5);
}

.favorite-btn.favorited {
        color: var(--accent-primary);
}

.favorite-content {
        padding-left: 50px;
}

.content-text {
        color: var(--text-primary);
        line-height: 1.4;
        margin: 0 0 10px 0;
}

.content-images {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 8px;
        margin-top: 10px;
}

.content-image {
        width: 100%;
        height: 100px;
        object-fit: cover;
        border-radius: 8px;
        border: 1px solid var(--border-color);
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

.back-button:hover {
        color: var(--accent-primary);
}
</style>