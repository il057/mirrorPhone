<template>
        <div class="diary-book">
                <AppHeader :title="pageTitle" :overrideBackAction="handleBack">
                        <template #right>
                                <button class="add-diary-btn" @click="showAddDiaryModal">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                                fill="currentColor" viewBox="0 0 16 16">
                                                <path
                                                        d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                                        </svg>
                                </button>
                        </template>
                </AppHeader>

                <main class="book-content content">
                        <!-- 日记本封面效果 -->
                        <div class="book-cover">
                                <div class="book-spine"></div>
                                <div class="book-pages">
                                        <!-- 日记页面 -->
                                        <div v-if="diaries.length > 0" class="diary-pages">
                                                <div v-for="(diary, index) in diaries" :key="diary.id"
                                                        class="diary-page"
                                                        :style="{ animationDelay: `${index * 100}ms` }">

                                                        <!-- 页面装饰线 -->
                                                        <div class="page-lines"></div>

                                                        <!-- 日记头部 -->
                                                        <div class="diary-header">
                                                                <div class="diary-date">
                                                                        {{ formatDiaryDate(diary.timestamp) }}
                                                                </div>
                                                                <div class="diary-menu"
                                                                        @click.stop="toggleMenu(diary.id)">
                                                                        <button class="menu-button">
                                                                                <svg xmlns="http://www.w3.org/2000/svg"
                                                                                        width="14" height="14"
                                                                                        fill="currentColor"
                                                                                        viewBox="0 0 16 16">
                                                                                        <path
                                                                                                d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3" />
                                                                                </svg>
                                                                        </button>
                                                                        <div v-if="openMenuId === diary.id"
                                                                                class="dropdown-menu">
                                                                                <button class="dropdown-item"
                                                                                        @click="editDiary(diary)">编辑</button>
                                                                                <button class="dropdown-item delete-item"
                                                                                        @click="deleteDiary(diary)">删除</button>
                                                                        </div>
                                                                </div>
                                                        </div>

                                                        <!-- 日记内容 -->
                                                        <div class="diary-content">
                                                                <div class="diary-text"
                                                                        v-html="formatDiaryContent(diary.content)">
                                                                </div>
                                                                <div v-if="diary.keywords && diary.keywords.length > 0"
                                                                        class="diary-keywords">
                                                                        <span v-for="keyword in diary.keywords"
                                                                                :key="keyword" class="keyword-tag">
                                                                                #{{ keyword }}
                                                                        </span>
                                                                </div>
                                                        </div>
                                                </div>
                                        </div>

                                        <!-- 空状态 -->
                                        <div v-else class="empty-book">
                                                <div class="empty-page">
                                                        <div class="page-lines"></div>
                                                        <div class="empty-content">
                                                                <div class="empty-icon">
                                                                        <svg xmlns="http://www.w3.org/2000/svg"
                                                                                fill="currentColor"
                                                                                class="bi bi-journal-bookmark-fill"
                                                                                viewBox="0 0 16 16">
                                                                                <path fill-rule="evenodd"
                                                                                        d="M6 1h6v7a.5.5 0 0 1-.757.429L9 7.083 6.757 8.43A.5.5 0 0 1 6 8z" />
                                                                                <path
                                                                                        d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2" />
                                                                                <path
                                                                                        d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1z" />
                                                                        </svg>
                                                                </div>
                                                                <div class="empty-text">这本日记还是空白的</div>
                                                                <div class="empty-hint">点击右上角的 + 开始写第一篇日记</div>
                                                        </div>
                                                </div>
                                        </div>
                                </div>
                        </div>
                </main>
        </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useObservable } from '@vueuse/rxjs';
import { liveQuery } from 'dexie';
import db from '../services/database.js';
import AppHeader from '../components/layout/Header.vue';
import { showMemoryEditModal } from '../services/memoryService.js';
import { showConfirm } from '../services/uiService.js';
import { applyActorTheme, restoreOriginalTheme } from '../services/themeService.js';

const route = useRoute();
const router = useRouter();

// 获取查询参数
const actorId = computed(() => route.query.actorId || null);

// 角色信息
const relatedActor = ref(null);

// 页面标题
const pageTitle = computed(() => {
        if (actorId.value && actorId.value !== '__USER__' && relatedActor.value) {
                return `${relatedActor.value.name}的日记`;
        }
        return '我的日记';
});

// 获取当前用户的ID（始终使用 __USER__）
const getCurrentUserPersonaId = async () => {
        return '__USER__';
};

// 加载相关角色信息
const loadRelatedActor = async () => {
        if (actorId.value && actorId.value !== '__USER__') {
                try {
                        const actor = await db.actors.get(actorId.value);
                        relatedActor.value = actor;
                } catch (error) {
                        console.error('加载角色信息失败:', error);
                }
        }
};

// 响应式观察日记数据
const diaries = useObservable(
        liveQuery(async () => {
                let query = db.memories.where('type').equals('diary');
                
                if (actorId.value) {
                        if (actorId.value === '__USER__') {
                                // 查看用户自己的日记
                                query = query.and(memory => memory.actorId === '__USER__');
                        } else {
                                // 查看指定角色的日记
                                query = query.and(memory => memory.actorId === actorId.value);
                        }
                } else {
                        // 默认查看用户自己的日记
                        query = query.and(memory => memory.actorId === '__USER__');
                }
                
                return await query.reverse().toArray();
        }),
        { initialValue: [] }
);

const openMenuId = ref(null); // 用于存储当前打开菜单的日记ID

const toggleMenu = (diaryId) => {
        if (openMenuId.value === diaryId) {
                openMenuId.value = null; // 如果再次点击，则关闭菜单
        } else {
                openMenuId.value = diaryId; // 打开指定菜单
        }
};

const closeMenu = () => {
        openMenuId.value = null;
};

// 格式化日记日期（精确到分钟）
const formatDiaryDate = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        
        if (isToday) {
                return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        } else {
                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);
                const isYesterday = date.toDateString() === yesterday.toDateString();
                
                if (isYesterday) {
                        return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                } else {
                        return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                }
        }
};

// 格式化日记内容，应用特殊标记
const formatDiaryContent = (content) => {
        if (!content) return '';
        
        return content
                .replace(/==([^=]+)==/g, '<span class="highlight">$1</span>')
                .replace(/~~([^~]+)~~/g, '<s class="strikethrough">$1</s>')
                .replace(/__([^_]+)__/g, '<u class="underline">$1</u>')
                .replace(/\|\|([^|]+)\|\|/g, '<span class="spoiler" onclick="this.classList.toggle(\'revealed\')">$1</span>')
                .replace(/\*\*([^*]+)\*\*/g, '<strong class="bold">$1</strong>')
                .replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>')
                .replace(/\n/g, '<br>');
};

// 显示添加日记模态框
const showAddDiaryModal = async () => {
        const currentUserPersonaId = await getCurrentUserPersonaId();
        await showMemoryEditModal(null, currentUserPersonaId, actorId.value, 'diary');
};

// 编辑日记
const editDiary = async (diary) => {
        const currentUserPersonaId = await getCurrentUserPersonaId();
        await showMemoryEditModal(diary, currentUserPersonaId, actorId.value, 'diary');
};

// 删除日记
const deleteDiary = async (diary) => {
        const confirmed = await showConfirm(
                '删除日记',
                `确定要删除这篇日记吗？\n\n"${diary.content.substring(0, 50)}${diary.content.length > 50 ? '...' : ''}"`
        );
        
        if (confirmed) {
                try {
                        await db.memories.delete(diary.id);
                } catch (error) {
                        console.error('删除日记失败:', error);
                }
        }
};

// 处理返回按钮
const handleBack = () => {
        // 根据来源返回不同页面
        if (actorId.value && actorId.value !== '__USER__') {
                router.push(`/profile/${actorId.value}`);
        } else {
                router.push('/chat/me');
        }
};

onMounted(() => {
        // 加载相关角色信息
        loadRelatedActor();
        
        // 如果有角色ID，应用角色的专属主题色
        if (actorId.value && actorId.value !== '__USER__') {
                applyActorTheme(actorId.value);
        }
        
        // 添加全局点击事件监听器来关闭菜单
        window.addEventListener('click', closeMenu);
});

onUnmounted(() => {
        // 移除全局点击事件监听器
        window.removeEventListener('click', closeMenu);
        
        // 恢复原始主题色
        restoreOriginalTheme();
});
</script>

<style scoped>
/* 书本整体容器 */
.diary-book {
        display: flex;
        flex-direction: column;
        height: 100vh;
        background: var(--background-primary);
        background-attachment: fixed;
}

.add-diary-btn {
        background: none;
        border: none;
        color: var(--text-primary);
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

.add-diary-btn:hover {
        color: var(--accent-primary);
        transform: scale(1.1);
}

/* 书本内容区域 */
.book-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        min-height: calc(100vh - 80px);
        margin-top: calc(var(--header-height));
}

/* 书本封面 */
.book-cover {
        position: relative;
        max-width: 600px;
        width: 100%;
        background: var(--bg-card);
        border-radius: 8px;
        box-shadow: 
                0 10px 30px rgba(0, 0, 0, 0.1),
                inset 0 1px 0 var(--opacity-10);
        animation: bookOpen 0.8s ease-out;
        transform-style: preserve-3d;
        perspective: 1000px;
        border: 1px solid var(--border-color);
}

@keyframes bookOpen {
        0% {
                transform: rotateY(-30deg) scale(0.8);
                opacity: 0;
        }
        100% {
                transform: rotateY(0) scale(1);
                opacity: 1;
        }
}

/* 书脊效果 */
.book-spine {
        position: absolute;
        left: -8px;
        top: 0;
        bottom: 0;
        width: 16px;
        background: linear-gradient(90deg, var(--accent-primary), var(--accent-darker));
        border-radius: 8px 0 0 8px;
        box-shadow: inset -2px 0 4px rgba(0, 0, 0, 0.2);
}

/* 书页容器 */
.book-pages {
        position: relative;
        padding: 30px;
        min-height: 500px;
        background: 
                linear-gradient(90deg, transparent 0%, transparent 40px, var(--border-color) 40px, var(--border-color) 42px, transparent 42px),
                repeating-linear-gradient(
                        0deg,
                        transparent 0px,
                        transparent 24px,
                        var(--border-color) 24px,
                        var(--border-color) 25px
                );
}

/* 日记页面列表 */
.diary-pages {
        display: flex;
        flex-direction: column;
        gap: 40px;
}

/* 单个日记页面 */
.diary-page {
        position: relative;
        background: transparent;
        border-bottom: 2px dotted var(--border-color);
        padding-bottom: 30px;
        margin-bottom: 10px;
        animation: pageIn 0.6s ease-out;
        transform-origin: left center;
}

@keyframes pageIn {
        0% {
                opacity: 0;
                transform: translateX(-20px) rotateY(-5deg);
        }
        100% {
                opacity: 1;
                transform: translateX(0) rotateY(0);
        }
}

/* 页面装饰线 */
.page-lines {
        position: absolute;
        left: 35px;
        top: 0;
        bottom: 0;
        width: 1px;
        background: var(--border-color);
        box-shadow: 
                0 0 0 0.5px rgba(var(--text-secondary-rgb), 0.1),
                2px 0 0 0 rgba(var(--text-secondary-rgb), 0.15);
}

/* 日记头部 */
.diary-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        margin-left: 45px;
}

.diary-date {
        font-size: 14px;
        font-weight: 600;
        color: var(--accent-primary);
        letter-spacing: 0.5px;
        text-shadow: 0 1px 2px rgba(var(--text-primary-rgb), 0.1);
}

.diary-menu {
        position: relative;
}

.menu-button {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        color: var(--text-secondary);
        cursor: pointer;
        padding: 6px;
        border-radius: 50%;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.menu-button:hover {
        background: var(--bg-hover);
        color: var(--text-primary);
        transform: scale(1.1);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* 日记内容 */
.diary-content {
        margin-left: 45px;
        line-height: 1.8;
}
.diary-text {
        font-size: 16px;
        color: var(--text-primary);
        margin-bottom: 20px;
        letter-spacing: 0.3px;
        line-height: 1.8;
        text-shadow: 0 1px 1px rgba(var(--text-primary-rgb), 0.1);
        word-break: break-word;
        white-space: pre-line;
}

/* 特殊标记样式 - 手写风格 */
.diary-text :deep(.highlight) {
        background: linear-gradient(120deg, 
                rgba(255, 235, 59, 0.4) 0%, 
                rgba(255, 193, 7, 0.3) 50%,
                rgba(255, 235, 59, 0.4) 100%);
        padding: 2px 4px;
        border-radius: 3px;
        font-weight: 600;
        color: var(--text-primary);
        position: relative;
        animation: highlightGlow 2s ease-in-out infinite alternate;
}

@keyframes highlightGlow {
        0% { box-shadow: 0 0 5px rgba(255, 235, 59, 0.3); }
        100% { box-shadow: 0 0 10px rgba(255, 235, 59, 0.6), 0 0 15px rgba(255, 235, 59, 0.3); }
}

.diary-text :deep(.strikethrough) {
        color: var(--text-secondary);
        opacity: 0.7;
        text-decoration: line-through;
        text-decoration-color: #d32f2f;
        text-decoration-thickness: 2px;
        position: relative;
        animation: strikeAnimation 0.8s ease-out;
}

@keyframes strikeAnimation {
        0% { text-decoration-color: transparent; }
        100% { text-decoration-color: #d32f2f; }
}

.diary-text :deep(.underline) {
        text-decoration: underline wavy var(--accent-primary);
        text-decoration-thickness: 2px;
        text-underline-offset: 4px;
        font-weight: 500;
        color: var(--accent-darker);
        animation: underlineWave 2s ease-in-out infinite;
}

@keyframes underlineWave {
        0%, 100% { text-decoration-color: var(--accent-primary); }
        50% { text-decoration-color: var(--accent-lighter); }
}

.diary-text :deep(.spoiler) {
        background: var(--text-secondary);
        color: var(--text-secondary);
        border-radius: 3px;
        padding: 2px 4px;
        cursor: pointer;
        transition: all 0.3s ease;
        user-select: none;
        position: relative;
        animation: spoilerPulse 1.5s ease-in-out infinite;
}

@keyframes spoilerPulse {
        0%, 100% { background: var(--text-secondary); }
        50% { background: rgba(var(--text-secondary-rgb), 0.8); }
}

.diary-text :deep(.spoiler:hover) {
        background: rgba(var(--accent-primary-rgb), 0.2);
        color: var(--text-primary);
}

.diary-text :deep(.spoiler.revealed) {
        background: transparent;
        color: var(--text-primary);
        font-style: italic;
        animation: revealText 0.5s ease-out;
}

@keyframes revealText {
        0% { 
                background: var(--text-secondary);
                color: var(--text-secondary);
                transform: scale(0.95);
        }
        100% { 
                background: transparent;
                color: var(--text-primary);
                transform: scale(1);
        }
}

.diary-text :deep(.bold) {
        font-weight: 700;
        color: var(--text-primary);
        text-shadow: 1px 1px 2px rgba(var(--text-primary-rgb), 0.1);
}

.diary-text :deep(.italic) {
        font-style: italic;
        color: var(--text-secondary);
}

/* 关键词标签 - 便签纸风格 */
.diary-keywords {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 20px;
        padding-top: 15px;
        border-top: 1px dashed var(--border-color);
}

.keyword-tag {
        background: linear-gradient(135deg, var(--accent-primary), var(--accent-darker));
        color: var(--accent-text);
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 8px;
        font-weight: 500;
        border: 1px solid rgba(var(--accent-primary-rgb), 0.3);
        box-shadow: 
                0 2px 4px rgba(0, 0, 0, 0.1),
                inset 0 1px 0 var(--opacity-20);
        transform: rotate(-1deg);
        transition: all 0.2s ease;
}

.keyword-tag:nth-child(even) {
        transform: rotate(1deg);
}

.keyword-tag:nth-child(3n) {
        transform: rotate(-0.5deg);
}

.keyword-tag:hover {
        transform: rotate(0deg) scale(1.05);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* 下拉菜单 */
.dropdown-menu {
        position: absolute;
        top: 100%;
        right: 0;
        background: var(--bg-card);
        backdrop-filter: blur(10px);
        border-radius: 8px;
        border: 1px solid var(--border-color);
        padding: 6px;
        min-width: 100px;
        z-index: 10;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        animation: dropdownSlide 0.2s ease-out;
}

@keyframes dropdownSlide {
        0% {
                opacity: 0;
                transform: translateY(-10px) scale(0.95);
        }
        100% {
                opacity: 1;
                transform: translateY(0) scale(1);
        }
}

.dropdown-item {
        background: none;
        border: none;
        color: var(--text-primary);
        padding: 8px 12px;
        text-align: left;
        cursor: pointer;
        border-radius: 6px;
        width: 100%;
        font-size: 14px;
        transition: all 0.2s ease;
}

.dropdown-item:hover {
        background: var(--bg-hover);
        transform: translateX(2px);
}

.dropdown-item.delete-item {
        color: #d32f2f;
}

.dropdown-item.delete-item:hover {
        background: rgba(211, 47, 47, 0.1);
}

/* 空状态 - 空白书页 */
.empty-book {
        width: 100%;
        min-height: 400px;
        display: flex;
        justify-content: center;
        align-items: center;
}

.empty-page {
        position: relative;
        width: 100%;
        max-width: 400px;
        min-height: 300px;
        background: transparent;
        display: flex;
        justify-content: center;
        align-items: center;
}

.empty-content {
        text-align: center;
        color: var(--text-secondary);
        animation: emptyBreathe 3s ease-in-out infinite;
}

@keyframes emptyBreathe {
        0%, 100% { transform: scale(1); opacity: 0.7; }
        50% { transform: scale(1.02); opacity: 1; }
}

.empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
        animation: bookSway 4s ease-in-out infinite;
        width: 60%;
        height: 60%;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-left: auto;
        margin-right: auto;
}

@keyframes bookSway {
        0%, 100% { transform: rotate(-2deg); }
        50% { transform: rotate(2deg); }
}

.empty-text {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 8px;
        color: var(--text-primary);
}

.empty-hint {
        font-size: 14px;
        opacity: 0.8;
        color: var(--text-secondary);
}

/* 响应式设计 */
@media (max-width: 768px) {
        .book-content {
                padding: 10px;
        }
        
        .book-pages {
                padding: 20px 15px;
        }
        
        .diary-header,
        .diary-content {
                margin-left: 25px;
        }
        
        .diary-text {
                font-size: 15px;
        }
        
        .diary-date {
                font-size: 13px;
        }
}

@media (max-width: 480px) {
        .book-pages {
                padding: 15px 10px;
        }
        
        .diary-header,
        .diary-content {
                margin-left: 20px;
        }
        
        .diary-text {
                font-size: 14px;
                line-height: 1.6;
        }
}


/* 深色模式适配 */
[data-theme="dark"] .book-cover {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
}

[data-theme="dark"] .book-pages {
        background: 
                linear-gradient(90deg, transparent 0%, transparent 40px, var(--border-color) 40px, var(--border-color) 42px, transparent 42px),
                repeating-linear-gradient(
                        0deg,
                        transparent 0px,
                        transparent 24px,
                        var(--border-color) 24px,
                        var(--border-color) 25px
                );
}

[data-theme="dark"] .diary-text {
        color: var(--text-primary);
}

[data-theme="dark"] .diary-date {
        color: var(--accent-primary);
}

[data-theme="dark"] .menu-button {
        background: var(--bg-card);
        color: var(--text-secondary);
        border-color: var(--border-color);
}

[data-theme="dark"] .dropdown-menu {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
}

[data-theme="dark"] .dropdown-item {
        color: var(--text-primary);
}

[data-theme="dark"] .dropdown-item.delete-item {
        color: #ff6b6b;
}
</style>
