<template>
        <div class="page-container">
                <AppHeader title="离线总结">
                        <template #right>
                                <button @click="isDropdownOpen = !isDropdownOpen" class="header-action-button">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <circle cx="12" cy="12" r="1"></circle>
                                                <circle cx="19" cy="12" r="1"></circle>
                                                <circle cx="5" cy="12" r="1"></circle>
                                        </svg>
                                </button>
                        </template>
                </AppHeader>

                <main class="summary-content content">
                        <div v-if="summaries.length === 0" class="empty-state">
                                <div class="empty-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" 
                                             fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                <polyline points="14,2 14,8 20,8"></polyline>
                                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                                <polyline points="10,9 9,9 8,9"></polyline>
                                        </svg>
                                </div>
                                <p>还没有任何离线总结</p>
                        </div>
                        <div v-else class="summary-list">
                                <!-- 按显示模式分组 -->
                                <div v-if="displayMode === 'group'">
                                        <div v-for="groupData in groupedSummaries" :key="groupData.groupId" class="group-section">
                                                <div class="group-header">
                                                        <h3 class="group-name">{{ groupData.groupName }}</h3>
                                                        <span class="summary-count">{{ groupData.summaries.length }}个总结</span>
                                                </div>
                                                <div class="group-summaries">
                                                        <SummaryCard
                                                                v-for="summary in groupData.summaries"
                                                                :key="summary.id"
                                                                :summary="summary"
                                                                @view-details="viewSummaryDetails"
                                                        />
                                                </div>
                                        </div>
                                </div>
                                <div v-else>
                                        <!-- 按时间排序显示 -->
                                        <SummaryCard
                                                v-for="summary in sortedSummaries"
                                                :key="summary.id"
                                                :summary="summary"
                                                @view-details="viewSummaryDetails"
                                        />
                                </div>
                        </div>
                </main>

                <HeaderDropdownMenu :is-open="isDropdownOpen" @close="isDropdownOpen = false">
                        <li @click="goToOfflineSettings">离线总结设置</li>
                        <li @click="toggleDisplayMode">
                                <span>切换为{{ displayMode === 'time' ? '分组' : '时间' }}显示</span>
                        </li>
                        <li @click="testOfflineSummary">测试生成总结</li>
                        <li @click="clearAllSummaries">清空所有总结</li>
                </HeaderDropdownMenu>

                <!-- 总结详情弹窗 -->
                <div v-if="selectedSummary" class="modal-overlay" @click="closeSummaryDetails">
                        <div class="summary-modal" @click.stop>
                                <div class="modal-header">
                                        <h3>{{ selectedSummary.groupName }} 的故事</h3>
                                        <button @click="closeSummaryDetails" class="close-btn">×</button>
                                </div>
                                <div class="modal-body">
                                        <div class="story-content">
                                                <p class="story-text">{{ selectedSummary.story }}</p>
                                        </div>
                                        <div v-if="selectedSummary.relationshipChanges && selectedSummary.relationshipChanges.length > 0" class="relationship-changes">
                                                <h4>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" 
                                                             fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                                        </svg>
                                                        关系变化
                                                </h4>
                                                <div v-for="change in selectedSummary.relationshipChanges" :key="`${change.sourceId}-${change.targetId}`" class="change-item">
                                                        <div class="change-description">{{ change.changeDescription }}</div>
                                                        <div class="change-details">
                                                                <span v-if="change.scoreChange" class="score-change" 
                                                                      :class="{ positive: change.scoreChange > 0, negative: change.scoreChange < 0 }">
                                                                        好感度{{ change.scoreChange > 0 ? '+' : '' }}{{ change.scoreChange }}
                                                                </span>
                                                                <span v-if="change.newTags && change.newTags.length > 0" class="new-tags">
                                                                        新印象：{{ change.newTags.map(tag => `${tag.name}(${tag.strength})`).join('、') }}
                                                                </span>
                                                        </div>
                                                </div>
                                        </div>
                                </div>
                                <div class="modal-footer">
                                        <div class="summary-meta">
                                                <span class="timestamp">{{ formatTimestamp(selectedSummary.timestamp) }}</span>
                                        </div>
                                </div>
                        </div>
                </div>
        </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useObservable } from '@vueuse/rxjs';
import { liveQuery } from 'dexie';
import AppHeader from '../components/layout/Header.vue';
import HeaderDropdownMenu from '../components/ui/HeaderDropdownMenu.vue';
import SummaryCard from '../components/ui/SummaryCard.vue';
import { showToast, showConfirmModal, showPersistentToast, closePersistentToast } from '../services/uiService.js';
import { generateOfflineSummary } from '../services/aiChatAPIService.js';
import db from '../services/database.js';

const router = useRouter();
const isDropdownOpen = ref(false);
const displayMode = ref('time'); // 'time' or 'group'
const selectedSummary = ref(null);

// 响应式数据
const summaries = useObservable(
        liveQuery(() => db.offlineSummaries.orderBy('timestamp').reverse().toArray()),
        { initialValue: [] }
);

const groups = useObservable(
        liveQuery(() => db.groups.toArray()),
        { initialValue: [] }
);

// 计算属性
const sortedSummaries = computed(() => {
        return summaries.value.map(summary => {
                const group = groups.value.find(g => g.id === summary.groupId);
                return {
                        ...summary,
                        groupName: group?.name || '未知分组',
                        story: summary.summaryContent?.story || '暂无故事内容',
                        relationshipChanges: summary.relationshipChanges || []
                };
        });
});

const groupedSummaries = computed(() => {
        const grouped = {};
        
        sortedSummaries.value.forEach(summary => {
                if (!grouped[summary.groupId]) {
                        grouped[summary.groupId] = {
                                groupId: summary.groupId,
                                groupName: summary.groupName,
                                summaries: []
                        };
                }
                grouped[summary.groupId].summaries.push(summary);
        });

        return Object.values(grouped).sort((a, b) => {
                const latestA = Math.max(...a.summaries.map(s => s.timestamp));
                const latestB = Math.max(...b.summaries.map(s => s.timestamp));
                return latestB - latestA;
        });
});

// 方法
const loadSummaries = async () => {
        // 数据通过响应式订阅自动加载
        console.log("离线总结数据已通过响应式订阅加载");
};

const goToOfflineSettings = () => {
        isDropdownOpen.value = false;
        router.push('/personal-settings#offline-summary');
};

const toggleDisplayMode = () => {
        displayMode.value = displayMode.value === 'time' ? 'group' : 'time';
        isDropdownOpen.value = false;
        showToast(`已切换为${displayMode.value === 'time' ? '时间' : '分组'}显示`, 'success');
};

const testOfflineSummary = async () => {
        isDropdownOpen.value = false;
        
        // 首先测试持久化Toast
        const testToast = showPersistentToast('test-persistent', '正在初始化测试...', 'loading', true, false);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 获取所有启用了离线总结的分组
        testToast.update('正在检查启用的分组...', 'loading');
        const enabledGroups = await db.groups.where('offlineSummaryEnabled').equals(1).toArray();
        
        if (enabledGroups.length === 0) {
                testToast.update('没有启用离线总结的分组，请先在设置中启用', 'warning');
                setTimeout(() => testToast.close(), 3000);
                return;
        }

        testToast.update(`找到 ${enabledGroups.length} 个启用的分组，开始生成...`, 'loading');
        await new Promise(resolve => setTimeout(resolve, 500));

        // 创建持久化Toast来显示进度
        let successCount = 0;
        let errorCount = 0;
        
        try {
                // 为每个启用的分组生成总结
                for (let i = 0; i < enabledGroups.length; i++) {
                        const group = enabledGroups[i];
                        const progressText = `正在为分组 ${group.name} 生成离线总结... (${i + 1}/${enabledGroups.length})`;
                        
                        testToast.update(progressText, 'loading');
                        
                        try {
                                const summaryId = await generateOfflineSummary(group.id, {
                                        onProgress: (message) => {
                                                const fullMessage = `[${group.name}] ${message} (${i + 1}/${enabledGroups.length})`;
                                                testToast.update(fullMessage, 'loading');
                                        }
                                });
                                
                                if (summaryId) {
                                        successCount++;
                                        console.log(`✅ 分组 ${group.name} 生成成功，ID: ${summaryId}`);
                                } else {
                                        errorCount++;
                                        console.warn(`⚠️ 分组 ${group.name} 生成失败，可能是事件数据不足`);
                                }
                        } catch (error) {
                                errorCount++;
                                console.error(`❌ 分组 ${group.name} 生成失败:`, error);
                                testToast.update(`分组 ${group.name} 生成失败: ${error.message}`, 'error');
                                await new Promise(resolve => setTimeout(resolve, 2000)); // 显示错误2秒
                        }
                }
                
                // 所有分组处理完成
                const resultMessage = `生成完成！成功: ${successCount}, 失败: ${errorCount}`;
                const resultType = errorCount === 0 ? 'success' : (successCount > 0 ? 'warning' : 'error');
                
                testToast.update(resultMessage, resultType);
                setTimeout(() => {
                        testToast.close();
                }, 3000);
                
        } catch (error) {
                console.error('批量生成离线总结失败:', error);
                testToast.update('生成失败: ' + error.message, 'error');
                setTimeout(() => {
                        testToast.close();
                }, 3000);
        }
};

const clearAllSummaries = async () => {
        isDropdownOpen.value = false;
        
        const confirmed = await showConfirmModal(
                '清空所有总结',
                '确定要删除所有离线总结吗？此操作不可撤销。',
                '删除',
                '取消'
        );
        
        if (confirmed) {
                try {
                        await db.offlineSummaries.clear();
                        showToast('已清空所有离线总结', 'success');
                } catch (error) {
                        console.error('清空离线总结失败:', error);
                        showToast('清空失败，请重试', 'error');
                }
        }
};

const viewSummaryDetails = (summary) => {
        selectedSummary.value = summary;
};

const closeSummaryDetails = () => {
        selectedSummary.value = null;
};

// 清除离线摘要未读状态
const clearOfflineSummariesUnreadStatus = async () => {
        try {
                // 更新全局设置，记录用户最后查看离线摘要的时间
                const settings = await db.globalSettings.get('global') || {};
                await db.globalSettings.put({
                        ...settings,
                        id: 'global',
                        lastViewedOfflineSummaries: Date.now()
                });
                console.log('已清除离线摘要未读状态');
        } catch (error) {
                console.error('清除离线摘要未读状态失败:', error);
        }
};

const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
        });
};

onMounted(() => {
        loadSummaries();
        
        // 清除离线摘要未读状态
        clearOfflineSummariesUnreadStatus();
        
        // 处理锚点跳转
        if (window.location.hash === '#offline-summary') {
                // 如果从设置页面跳转过来，可以显示特定提示
                showToast('离线总结功能已启用', 'info');
        }
});
</script>

<style scoped>
.summary-content {
        padding-left: 10px;
        padding-right: 10px;
        padding-top: calc(10px + var(--header-height));
        padding-bottom: 10px;
}

.empty-state {
        text-align: center;
        margin-top: 80px;
        color: var(--text-secondary);
}

.empty-icon {
        margin-bottom: 16px;
        color: var(--text-secondary);
        opacity: 0.6;
}

.empty-state p {
        margin: 8px 0;
}

.group-section {
        margin-bottom: 32px;
}

.group-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 8px;
        border-bottom: 2px solid var(--accent-primary);
}

.group-name {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary);
}

.summary-count {
        font-size: 12px;
        color: var(--text-secondary);
        background-color: var(--bg-secondary);
        padding: 4px 8px;
        border-radius: 12px;
}

.group-summaries {
        margin-left: 8px;
}

.header-action-button {
        background: none;
        border: none;
        color: var(--text-primary);
        cursor: pointer;
        padding: 5px;
        border-radius: 4px;
        transition: background-color 0.2s ease;
}

.header-action-button:hover {
        background-color: var(--bg-secondary);
}

/* 模态框样式 */
.modal-overlay {
        padding: 20px;
        box-sizing: border-box;
}

.summary-modal {
        background-color: var(--bg-card);
        border-radius: 16px;
        max-width: 600px;
        width: 100%;
        max-height: 80vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid var(--border-color);
        background-color: var(--bg-secondary);
}

.modal-header h3 {
        margin: 0;
        font-size: 18px;
        color: var(--text-primary);
}

.close-btn {
        background: none;
        border: none;
        font-size: 24px;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 0;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s ease;
}

.close-btn:hover {
        color: var(--text-primary);
}

.modal-body {
        padding: 24px;
        flex: 1;
        overflow-y: auto;
        margin-bottom: 0;
}



.story-text {
        margin: 0;
        font-size: 16px;
        line-height: 1.6;
        color: var(--text-primary);
}

.relationship-changes h4 {
        margin: 0 0 16px 0;
        font-size: 16px;
        color: var(--text-primary);
        display: flex;
        align-items: center;
        gap: 8px;
}

.relationship-changes h4 svg {
        color: var(--accent-primary);
}

.change-item {
        background-color: var(--bg-secondary);
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 12px;
}

.change-description {
        font-size: 14px;
        color: var(--text-primary);
        margin-bottom: 8px;
        line-height: 1.4;
}

.change-details {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
}

.score-change {
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 12px;
        font-weight: 500;
        background-color: var(--bg-primary);
}

.score-change.positive {
        background-color: rgba(76, 175, 80, 0.15);
        color: #4CAF50;
}

.score-change.negative {
        background-color: rgba(244, 67, 54, 0.15);
        color: #F44336;
}

.new-tags {
        font-size: 12px;
        color: var(--text-secondary);
        background-color: var(--bg-primary);
        padding: 4px 8px;
        border-radius: 12px;
}

.modal-footer {
        padding: 16px 24px;
        border-top: 1px solid var(--border-color);
        background-color: var(--bg-secondary);
}

.summary-meta {
        text-align: center;
}

.timestamp {
        font-size: 12px;
        color: var(--text-secondary);
}
</style>