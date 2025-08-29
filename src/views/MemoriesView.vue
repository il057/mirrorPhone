<template>
        <div class="page-container">
                <AppHeader :title="pageTitle" :overrideBackAction="handleBack">
                        <template #right>
                                <button class="header-action-button add-memory-btn" @click="showAddMemoryModal"
                                        title="添加回忆">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                                fill="currentColor" viewBox="0 0 16 16">
                                                <path
                                                        d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                                        </svg>
                                </button>
                        </template>
                </AppHeader>

                <main class="page-content">
                        <!-- 重要日期置顶区域 -->
                        <div v-if="dateMemories.length > 0" class="countdown-section">
                                <div v-for="memory in dateMemories" :key="memory.id" class="countdown-card"
                                        :class="{ 'past': isDatePast(memory.targetDate) }">
                                        <div class="countdown-content">
                                                <div class="countdown-main">
                                                        <h3 class="countdown-title">{{ memory.content }}</h3>
                                                        <div class="countdown-time">{{ getDateDisplay(memory.targetDate)
                                                                }}</div>
                                                        <div v-if="memory.relatedActorId && !actorId"
                                                                class="countdown-actor">
                                                                和{{ getActorNameSync(memory.relatedActorId) }}
                                                        </div>
                                                </div>
                                                <div class="countdown-menu">
                                                        <button class="menu-button" @click.stop="toggleMenu(memory.id)">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16"
                                                                        height="16" fill="currentColor"
                                                                        viewBox="0 0 16 16">
                                                                        <path
                                                                                d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3" />
                                                                </svg>
                                                        </button>
                                                        <div v-if="openMenuId === memory.id" class="dropdown-menu">
                                                                <button class="dropdown-item"
                                                                        @click="editMemory(memory)">
                                                                        编辑
                                                                </button>
                                                                <button class="dropdown-item delete-item"
                                                                        @click="deleteMemory(memory)">
                                                                        删除
                                                                </button>
                                                        </div>
                                                </div>
                                        </div>
                                        <div v-if="memory.keywords && memory.keywords.length > 0"
                                                class="memory-keywords">
                                                <span v-for="keyword in memory.keywords" :key="keyword"
                                                        class="keyword-tag">#{{ keyword }}</span>
                                        </div>
                                </div>
                        </div>

                        <!-- 事实回忆区域 -->
                        <div v-if="facts.length > 0" class="facts-section">
                                <h3 class="section-title">重要回忆</h3>
                                <div v-for="memory in facts" :key="memory.id" class="fact-card">
                                        <div class="fact-content">
                                                <div class="fact-main">
                                                        <p class="fact-text">{{ memory.content }}</p>
                                                        <div class="fact-time">{{ formatFactTime(memory.timestamp) }}
                                                        </div>
                                                        <div v-if="memory.relatedActorId && !actorId"
                                                                class="fact-actor">
                                                                和{{ getActorNameSync(memory.relatedActorId) }}
                                                        </div>
                                                </div>
                                                <div class="fact-menu">
                                                        <button class="menu-button" @click.stop="toggleMenu(memory.id)">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16"
                                                                        height="16" fill="currentColor"
                                                                        viewBox="0 0 16 16">
                                                                        <path
                                                                                d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3" />
                                                                </svg>
                                                        </button>
                                                        <div v-if="openMenuId === memory.id" class="dropdown-menu">
                                                                <button class="dropdown-item"
                                                                        @click="editMemory(memory)">
                                                                        编辑
                                                                </button>
                                                                <button class="dropdown-item delete-item"
                                                                        @click="deleteMemory(memory)">
                                                                        删除
                                                                </button>
                                                        </div>
                                                </div>
                                        </div>
                                        <div v-if="memory.keywords && memory.keywords.length > 0"
                                                class="memory-keywords">
                                                <span v-for="keyword in memory.keywords" :key="keyword"
                                                        class="keyword-tag">#{{ keyword }}</span>
                                        </div>
                                </div>
                        </div>

                        <!-- 空状态 -->
                        <div v-if="memories.length === 0" class="empty-state">
                                <p class="empty-text">暂无回忆</p>
                                <p class="empty-hint">点击右上角的 + 按钮添加第一个回忆</p>
                        </div>
                </main>
        </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useObservable } from '@vueuse/rxjs';
import { liveQuery } from 'dexie';
import db from '../services/database.js';
import AppHeader from '../components/layout/Header.vue';
import DropdownMenu from '../components/ui/DropdownMenu.vue';
import { showMemoryEditModal } from '../services/memoryService.js';
import { showConfirm } from '../services/uiService.js';
import { applyActorTheme, restoreOriginalTheme } from '../services/themeService.js';

const route = useRoute();
const router = useRouter();

// 实时时间更新
const currentTime = ref(new Date());
let timeUpdateInterval = null;

// 获取查询参数
const actorId = computed(() => route.query.actorId || null);

// 角色信息
const relatedActor = ref(null);
const actorNames = ref(new Map()); // 缓存角色名称

// 页面标题
const pageTitle = computed(() => {
        if (actorId.value && actorId.value !== '__USER__' && relatedActor.value) {
                return `和${relatedActor.value.name}的回忆`;
        }
        return '我的回忆';
});

// 获取当前用户的ID（始终使用 __USER__）
const getCurrentUserPersonaId = async () => {
        return '__USER__';
};

// 获取角色名称 (同步版本用于模板显示)
const getActorNameSync = (actorId) => {
        if (!actorId) return '';
        return actorNames.value.get(actorId) || '加载中...';
};

// 获取角色名称 (异步版本用于加载)
const getActorName = async (actorId) => {
        if (!actorId) return '';
        if (actorNames.value.has(actorId)) {
                return actorNames.value.get(actorId);
        }
        try {
                const actor = await db.actors.get(actorId);
                const name = actor ? actor.name : '未知角色';
                actorNames.value.set(actorId, name);
                return name;
        } catch (error) {
                console.error('获取角色名称失败:', error);
                return '未知角色';
        }
};

// 预加载角色名称
const preloadActorNames = async () => {
        const uniqueActorIds = new Set();
        memories.value.forEach(memory => {
                if (memory.relatedActorId) {
                        uniqueActorIds.add(memory.relatedActorId);
                }
        });
        
        for (const actorId of uniqueActorIds) {
                await getActorName(actorId);
        }
};

// 加载相关角色信息
const loadRelatedActor = async () => {
        if (actorId.value && actorId.value !== '__USER__') {
                try {
                        relatedActor.value = await db.actors.get(actorId.value);
                } catch (error) {
                        console.error('加载角色信息失败:', error);
                }
        }
};

// 响应式观察回忆数据
const memories = useObservable(
        liveQuery(async () => {
                const currentUserPersonaId = await getCurrentUserPersonaId();
                
                let query = db.memories.where('actorId').equals(currentUserPersonaId);
                
                // 如果指定了特定角色，筛选与该角色相关的回忆
                if (actorId.value && actorId.value !== '__USER__') {
                        const allMemories = await query.toArray();
                        return allMemories.filter(memory => memory.relatedActorId === actorId.value);
                }
                
                return await query.reverse().toArray();
        }),
        { initialValue: [] }
);

// 计算属性：日期回忆（合并倒计时和纪念日）
const dateMemories = computed(() => {
        return memories.value.filter(memory => 
                memory.type === 'date' || memory.type === 'countdown' || memory.type === 'anniversary'
        ).sort((a, b) => {
                // 按日期排序：即将到来的在前，已过去的在后
                const dateA = new Date(a.targetDate);
                const dateB = new Date(b.targetDate);
                const now = new Date();
                
                const isAPast = dateA < now;
                const isBPast = dateB < now;
                
                if (isAPast && !isBPast) return 1;
                if (!isAPast && isBPast) return -1;
                
                return dateA - dateB;
        });
});

// 计算属性：事实回忆
const facts = computed(() => {
        return memories.value.filter(memory => memory.type === 'fact')
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
});

// 判断日期是否已过去
const isDatePast = (targetDate) => {
        return new Date(targetDate) < new Date();
};

// 格式化倒计时（实时更新，精确到秒）
const getDateDisplay = (targetDate) => {
        const target = new Date(targetDate);
        const now = currentTime.value;
        const diffMs = target.getTime() - now.getTime();
        const isPast = diffMs < 0;
        const absDiffMs = Math.abs(diffMs);

        const days = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((absDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((absDiffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((absDiffMs % (1000 * 60)) / 1000);

        let timeStr = '';
        if (days > 0) timeStr += `${days}天`;
        if (hours > 0) timeStr += `${hours}小时`;
        if (minutes > 0) timeStr += `${minutes}分钟`;
        timeStr += `${seconds}秒`;

        return isPast ? `过去了${timeStr}` : `还有${timeStr}`;
};

const openMenuId = ref(null); // 用于存储当前打开菜单的回忆ID

const toggleMenu = (memoryId) => {
        if (openMenuId.value === memoryId) {
                openMenuId.value = null; // 如果再次点击，则关闭菜单
        } else {
                openMenuId.value = memoryId; // 否则，打开此菜单
        }
};

const closeMenu = () => {
        openMenuId.value = null;
};

// 格式化事实回忆时间
const formatFactTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) {
                return '今天';
        } else if (days === 1) {
                return '昨天';
        } else if (days < 30) {
                return `${days}天前`;
        } else if (days < 365) {
                const months = Math.floor(days / 30);
                return `${months}个月前`;
        } else {
                const years = Math.floor(days / 365);
                return `${years}年前`;
        }
};

// 显示添加回忆模态框
const showAddMemoryModal = async () => {
        const currentUserPersonaId = await getCurrentUserPersonaId();
        await showMemoryEditModal(null, currentUserPersonaId, actorId.value);
};

// 编辑回忆
const editMemory = async (memory) => {
        const currentUserPersonaId = await getCurrentUserPersonaId();
        await showMemoryEditModal(memory, currentUserPersonaId, actorId.value);
};

// 删除回忆
const deleteMemory = async (memory) => {
        const confirmed = await showConfirm(
                '删除回忆',
                `确定要删除这条回忆吗？\n\n"${memory.content.substring(0, 50)}${memory.content.length > 50 ? '...' : ''}"`
        );
        
        if (confirmed) {
                try {
                        await db.memories.delete(memory.id);
                } catch (error) {
                        console.error('删除回忆失败:', error);
                }
        }
};

// 处理返回按钮
const handleBack = () => {
        // 根据来源返回不同页面
        if (actorId.value && actorId.value !== '__USER__') {
                // 从角色档案进入，返回角色档案
                router.push(`/profile/${actorId.value}`);
        } else {
                // 从我的页面进入，返回我的页面
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
        
        // 启动时间更新定时器
        timeUpdateInterval = setInterval(() => {
                currentTime.value = new Date();
        }, 1000);
        window.addEventListener('click', closeMenu);

});

// 监听记忆数据变化，预加载角色名称
watch(memories, (newMemories) => {
        if (newMemories.length > 0) {
                preloadActorNames();
        }
}, { immediate: true });

onUnmounted(() => {
        // 清理定时器
        if (timeUpdateInterval) {
                clearInterval(timeUpdateInterval);
        }
        window.removeEventListener('click', closeMenu);
        
        // 恢复原始主题色
        restoreOriginalTheme();
});
</script>

<style scoped>
.page-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
        background: var(--background-primary);
}

.page-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        padding-bottom: calc(16px + var(--safe-bottom, 0px));
}

.add-memory-btn {
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

.add-memory-btn:hover {
        color: var(--accent-primary);
}

/* 倒计时区域 */
.countdown-section {
        margin-bottom: 24px;
}

.countdown-card {
        background: var(--card-bg);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        border: 1px solid var(--border-color);
        transition: all 0.2s ease;
}

.countdown-card:hover {
        border-color: var(--accent-primary);
}

.countdown-card.past {
        opacity: 0.7;
        background: var(--card-bg-secondary);
}

.countdown-content {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
}

.countdown-main {
        flex: 1;
}

.countdown-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 8px 0;
}

.countdown-time {
        font-size: 18px;
        color: var(--accent-primary);
        font-weight: 700;
        background: linear-gradient(135deg, var(--accent-primary), var(--accent-lighter));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 4px;
        text-shadow: 0 0 10px var(--accent-primary);
}

.countdown-date {
        font-size: 13px;
        color: var(--text-secondary);
        font-weight: 400;
}

/* 事实回忆区域 */
.facts-section {
        margin-bottom: 24px;
}

.section-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 16px 0;
        padding-left: 4px;
}

.fact-card {
        background: var(--card-bg);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        border: 1px solid var(--border-color);
        transition: all 0.2s ease;
}

.fact-card:hover {
        border-color: var(--accent-primary);
}

.fact-content {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
}

.fact-main {
        flex: 1;
}

.fact-text {
        font-size: 15px;
        color: var(--text-primary);
        line-height: 1.5;
        margin: 0 0 8px 0;
}

.fact-time {
        font-size: 13px;
        color: var(--text-secondary);
}

.countdown-actor,
.fact-actor {
        font-size: 12px;
        color: var(--accent-primary);
        margin-top: 4px;
}

/* 菜单按钮 */
.fact-menu,
.countdown-menu {
        margin-left: 12px;
        position: relative;
}

.menu-button {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 8px;
        border-radius: 4px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
}

.menu-button:hover {
        color: var(--text-primary);
}

/* 关键词标签 */
.memory-keywords {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
}

.keyword-tag {
        background: var(--accent-primary);
        color: white;
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 12px;
        font-weight: 500;
}

/* 下拉菜单项 */
.dropdown-item.delete-item {
        color: var(--error-color, #ff4757);
}

.dropdown-item.delete-item:hover {
        background-color: rgba(255, 71, 87, 0.1);
}

/* 空状态 */
.empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        text-align: center;
}

.empty-text {
        font-size: 18px;
        color: var(--text-primary);
        margin: 0 0 8px 0;
        font-weight: 500;
}

.empty-hint {
        font-size: 14px;
        color: var(--text-secondary);
        margin: 0;
}

/* 响应式设计 */
@media (max-width: 480px) {
        .page-content {
                padding: 12px;
        }
        
        .countdown-card,
        .fact-card {
                padding: 12px;
        }
        
        .countdown-title {
                font-size: 15px;
        }
        
        .fact-text {
                font-size: 14px;
        }
}

.dropdown-menu {
        position: absolute;
        top: 100%;
        right: 0;
        background-color: var(--bg-card);
        border-radius: 8px;
        border: 1px solid var(--border-color);
        padding: 6px;
        min-width: 100px;
        z-index: 10;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        display: flex;
        flex-direction: column;
        gap: 4px;
        /* 为菜单项之间添加一些间距 */
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
        transition: background-color 0.2s ease;
}
</style>
