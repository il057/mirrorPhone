<template>
        <div class="page-container">
                <AppHeader title="世界书">
                        <template #right>
                                <button @click="isDropdownOpen = true" class="header-action-button">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                                stroke-linecap="round" stroke-linejoin="round">
                                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                        </svg>
                                </button>
                        </template>
                </AppHeader>

                <main class="content-area content">
                        <div v-if="hasContent" class="worldbook-content">
                                <!-- 筛选和排序控制 -->
                                <div class="filter-section">
                                        <div class="filter-row">
                                                <div class="filter-item">
                                                        <label class="filter-label">筛选类型：</label>
                                                        <MainDropdown v-model="filterType" :options="typeFilterOptions"
                                                                placeholder="全部类型" @change="onFilterChange" />
                                                </div>
                                                <div class="filter-item">
                                                        <label class="filter-label">排序方式：</label>
                                                        <MainDropdown v-model="sortBy" :options="sortOptions"
                                                                placeholder="默认排序" @change="onSortChange" />
                                                </div>
                                        </div>
                                </div>

                                <div v-for="group in filteredGroupsWithBooks" :key="group.id" class="group-section">
                                        <div class="group-header" @click="toggleGroup(group.id)">
                                                <div class="group-info">
                                                        <span class="group-name">{{ group.name }}</span>
                                                        <span class="book-count">{{ group.books.length }}本</span>
                                                </div>
                                                <svg class="expand-icon"
                                                        :class="{ 'expanded': expandedGroups.has(group.id) }"
                                                        xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                                        viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                        <polyline points="6,9 12,15 18,9"></polyline>
                                                </svg>
                                        </div>

                                        <transition name="accordion">
                                                <div v-if="expandedGroups.has(group.id)" class="books-list">
                                                        <div v-for="book in group.books" :key="book.id"
                                                                class="book-card" @click="editWorldbook(book)">
                                                                <div class="book-info">
                                                                        <h4 class="book-name">{{ book.name }}</h4>
                                                                        <div class="book-meta">
                                                                                <span class="book-type">
                                                                                        {{ book.type === 'always' ?
                                                                                        '始终触发' : '关键词触发' }}
                                                                                </span>
                                                                                <span v-if="book.type === 'keywords' && book.keywords"
                                                                                        class="book-keywords">
                                                                                        {{ book.keywords }}
                                                                                </span>
                                                                        </div>
                                                                        <p class="book-preview">{{
                                                                                getContentPreview(book.content) }}</p>
                                                                </div>
                                                        </div>
                                                </div>
                                        </transition>
                                </div>
                        </div>

                        <div v-else class="empty-state">
                                <div class="empty-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" height="100px" viewBox="0 -960 960 960"
                                                width="100px" fill="currentColor">
                                                <path
                                                        d="M270-80q-45 0-77.5-30.5T160-186v-558q0-38 23.5-68t61.5-38l395-78v640l-379 76q-9 2-15 9.5t-6 16.5q0 11 9 18.5t21 7.5h450v-640h80v720H270Zm90-233 200-39v-478l-200 39v478Zm-80 16v-478l-15 3q-11 2-18 9.5t-7 18.5v457q5-2 10.5-3.5T261-293l19-4Zm-40-472v482-482Z" />
                                        </svg>
                                </div>
                                <p>你的世界书空空如也。</p>
                                <button @click="handleDropdownAction('addWorldbook')" class="empty-action-btn">
                                        创建第一本世界书
                                </button>
                        </div>
                </main>

                <DropdownMenu :is-open="isDropdownOpen" @close="isDropdownOpen = false">
                        <li @click="handleDropdownAction('addWorldbook')">新建世界书</li>
                        <li @click="handleDropdownAction('manageGroups')">管理分组</li>
                </DropdownMenu>
        </div>
</template>

<script setup>
import { ref, computed, watchEffect } from 'vue';
import AppHeader from '../components/layout/Header.vue';
import DropdownMenu from '../components/ui/DropdownMenu.vue';
import MainDropdown from '../components/ui/MainDropdown.vue';
import { showManageGroupsModal, showWorldbookEditModal } from '../services/uiService.js';
import db from '../services/database.js';
import { useObservable } from '@vueuse/rxjs';
import { liveQuery } from 'dexie';

const isDropdownOpen = ref(false);
const expandedGroups = ref(new Set());

// 筛选和排序状态
const filterType = ref('');
const sortBy = ref('updateTime');

// 筛选选项
const typeFilterOptions = [
        { label: '全部类型', value: '' },
        { label: '始终触发', value: 'always' },
        { label: '关键词触发', value: 'keywords' }
];

// 排序选项
const sortOptions = [
        { label: '最近更新', value: 'updateTime' },
        { label: '创建时间', value: 'createTime' },
        { label: '名称', value: 'name' },
        { label: '类型', value: 'type' }
];

// 获取分组和世界书数据
const groups = ref([]);
const worldbooks = ref([]);

const groupsObservable = useObservable(
        liveQuery(() => db.worldbookGroups.orderBy('name').toArray())
);
const worldbooksObservable = useObservable(
        liveQuery(() => db.worldbooks.orderBy('updateTime').reverse().toArray())
);

watchEffect(() => {
        if (groupsObservable.value) {
                groups.value = groupsObservable.value;
        }
});

watchEffect(() => {
        if (worldbooksObservable.value) {
                worldbooks.value = worldbooksObservable.value;
        }
});

// 计算每个分组及其下的世界书
const groupsWithBooks = computed(() => {
        return groups.value.map(group => {
                const books = worldbooks.value.filter(book => book.groupId === group.id);
                return {
                        ...group,
                        books
                };
        }).filter(group => group.books.length > 0); // 只显示有世界书的分组
});

// 筛选和排序后的分组数据
const filteredGroupsWithBooks = computed(() => {
        return groupsWithBooks.value.map(group => {
                let filteredBooks = group.books;
                
                // 应用类型筛选
                if (filterType.value) {
                        filteredBooks = filteredBooks.filter(book => book.type === filterType.value);
                }
                
                // 应用排序
                filteredBooks = [...filteredBooks].sort((a, b) => {
                        switch (sortBy.value) {
                                case 'updateTime':
                                        return new Date(b.updateTime) - new Date(a.updateTime);
                                case 'createTime':
                                        return new Date(b.createTime) - new Date(a.createTime);
                                case 'name':
                                        return a.name.localeCompare(b.name, 'zh-CN');
                                case 'type':
                                        return a.type.localeCompare(b.type);
                                default:
                                        return 0;
                        }
                });
                
                return {
                        ...group,
                        books: filteredBooks
                };
        }).filter(group => group.books.length > 0); // 只显示有符合条件的世界书的分组
});

// 是否有内容
const hasContent = computed(() => {
        return worldbooks.value.length > 0;
});

// 切换分组展开状态
const toggleGroup = (groupId) => {
        if (expandedGroups.value.has(groupId)) {
                expandedGroups.value.delete(groupId);
        } else {
                expandedGroups.value.add(groupId);
        }
};

// 筛选和排序事件处理
const onFilterChange = (option) => {
        console.log('筛选类型改变:', option);
};

const onSortChange = (option) => {
        console.log('排序方式改变:', option);
};

// 获取内容预览
const getContentPreview = (content) => {
        if (!content) return '暂无内容';
        return content.length > 100 ? content.substring(0, 100) + '...' : content;
};

// 编辑世界书
const editWorldbook = async (worldbook) => {
        await showWorldbookEditModal(worldbook);
};

// 处理下拉菜单操作
const handleDropdownAction = async (action) => {
        isDropdownOpen.value = false;
        switch (action) {
                case 'manageGroups':
                        showManageGroupsModal('worldbookGroups');
                        break;
                case 'addWorldbook':
                        await showWorldbookEditModal();
                        break;
                default:
                        break;
        }
};
</script>

<style scoped>
.content-area {
        padding-left: 20px;
        padding-right: 20px;
        flex-grow: 1;
        overflow: auto;
}

.worldbook-content {
        max-width: 800px;
        margin: 0 auto;
}

/* 筛选区域样式 */
.filter-section {
        margin-bottom: 20px;
        padding: 16px;
        background-color: var(--bg-card);
        border-radius: 12px;
        border: 1px solid var(--border-color);
}

.filter-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
}

.filter-item {
        display: flex;
        flex-direction: column;
        gap: 6px;
}

.filter-label {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary);
        margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
        .filter-row {
                grid-template-columns: 1fr;
                gap: 12px;
        }
        
        .filter-section {
                margin-bottom: 16px;
                padding: 12px;
        }
}

.group-section {
        margin-bottom: 10px;
        background-color: var(--bg-card);
        border-radius: 12px;
        overflow: hidden;
}

.group-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        cursor: pointer;
        background-color: var(--bg-card);
        border-bottom: 1px solid var(--border-color);
        transition: background-color 0.2s ease;
}

.group-header:hover {
        background-color: var(--bg-secondary);
}

.group-info {
        display: flex;
        align-items: center;
        gap: 10px;
}

.group-name {
        font-weight: 600;
        color: var(--text-primary);
}

.book-count {
        font-size: 12px;
        color: var(--text-secondary);
        background-color: var(--bg-secondary);
        padding: 2px 8px;
        border-radius: 10px;
}

.expand-icon {
        color: var(--text-secondary);
        transition: transform 0.2s ease;
}

.expand-icon.expanded {
        transform: rotate(180deg);
}

.books-list {
        padding: 10px;
}

.book-card {
        background-color: var(--bg-secondary);
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 10px;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid transparent;
}

.book-card:hover {
        background-color: var(--bg-primary);
        border-color: var(--accent-primary);
        transform: translateY(-1px);
}

.book-card:last-child {
        margin-bottom: 0;
}

.book-name {
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
}

.book-meta {
        display: flex;
        gap: 10px;
        align-items: center;
        margin-bottom: 8px;
}

.book-type {
        font-size: 12px;
        background-color: var(--accent-primary);
        color: var(--text-inverse);
        padding: 2px 6px;
        border-radius: 4px;
}

.book-keywords {
        font-size: 12px;
        color: var(--text-secondary);
        background-color: var(--bg-card);
        padding: 2px 6px;
        border-radius: 4px;
}

.book-preview {
        margin: 0;
        font-size: 14px;
        color: var(--text-secondary);
        line-height: 1.4;
}

.empty-state {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 60vh;
        text-align: center;
        color: var(--text-secondary);
}

.empty-icon {
        font-size: 64px;
        margin-bottom: 20px;
        opacity: 0.6;
}

.empty-state p {
        margin-bottom: 20px;
        font-size: 16px;
}

.empty-action-btn {
        padding: 12px 24px;
        background-color: var(--accent-primary);
        color: var(--text-inverse);
        border: none;
        border-radius: 999px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
}

.empty-action-btn:hover {
        background-color: var(--accent-darker);
        transform: translateY(-1px);
}

.header-action-button {
        color: var(--text-primary);
        background: none;
        border: none;
        padding: 5px;
        cursor: pointer;
}

/* 手风琴动画 */
.accordion-enter-active,
.accordion-leave-active {
        transition: all 0.3s ease;
        overflow: hidden;
}

.accordion-enter-from,
.accordion-leave-to {
        max-height: 0;
        opacity: 0;
}

.accordion-enter-to,
.accordion-leave-from {
        max-height: 1000px;
        opacity: 1;
}
</style>