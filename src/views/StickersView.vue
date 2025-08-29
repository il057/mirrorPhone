<template>
        <div class="page-container">
                <AppHeader :title="headerTitle" :override-back-action="() => $router.push('/chat/me')">
                        <template #left>
                                <button v-if="!isEditMode && !isReordering" @click="$router.push('/chat/me')"
                                        class="header-action-button">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <polyline points="15 18 9 12 15 6"></polyline>
                                        </svg>
                                </button>
                                <button v-if="isEditMode" @click="handleExportSelected"
                                        :disabled="selectedItems.size === 0" class="header-action-button">
                                        导出所选
                                </button>
                        </template>

                        <template #right>
                                <button v-if="!isEditMode && !isReordering" @click="isDropdownOpen = !isDropdownOpen"
                                        class="header-action-button">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <circle cx="12" cy="12" r="1"></circle>
                                                <circle cx="19" cy="12" r="1"></circle>
                                                <circle cx="5" cy="12" r="1"></circle>
                                        </svg>
                                </button>
                                <button v-if="isEditMode || isReordering" @click="handleDone"
                                        class="header-action-button">
                                        完成
                                </button>
                        </template>
                </AppHeader>

                <main class="sticker-content" ref="gridContainerRef" @mousedown="handleInteractionStart"
                        @touchstart.prevent="handleInteractionStart">
                        <div v-if="!localStickers || localStickers.length === 0" class="empty-state">
                                <p>这里空空如也，快来添加你的第一个表情包吧！</p>
                        </div>

                        <!-- 简单的列表显示，不需要拖拽功能 -->
                        <div v-if="!isReordering" class="sticker-grid">
                                <div class="sticker-item add-button"
                                        @click="!isEditMode && !isReordering && handleAddSticker()">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"
                                                fill="currentColor" viewBox="0 0 16 16">
                                                <path
                                                        d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                                        </svg>
                                </div>
                                <div v-for="sticker in localStickers" :key="sticker.id" class="sticker-item"
                                        :data-id="sticker.id" :class="{ 'is-selected': selectedItems.has(sticker.id) }">
                                        <img :src="sticker.url" :alt="sticker.name" />
                                        <div v-if="isEditMode" class="selection-overlay">
                                                <div class="checkmark"></div>
                                        </div>
                                </div>
                        </div>

                        <!-- 改进的排序模式 -->
                        <div v-if="isReordering" class="sticker-reorder-container">
                                <!-- 搜索与分类工具 - 修改样式以贴近header -->
                                <div class="reorder-tools">
                                        <input v-model="searchTerm" placeholder="搜索表情" class="search-input" />
                                        <div class="quick-jump-buttons">
                                                <button @click="scrollToTop" class="jump-btn">顶部</button>
                                                <button @click="scrollToBottom" class="jump-btn">底部</button>
                                        </div>
                                </div>

                                <div class="sticker-grid" ref="reorderGridRef">
                                        <div v-for="(sticker, index) in filteredStickers" :key="sticker.id"
                                                class="sticker-item is-reordering" :data-index="index">
                                                <img :src="sticker.url" :alt="sticker.name" />
                                                <!-- 修改拖动逻辑，只有按住拖动按钮才能移动 -->
                                                <div class="drag-handle" @mousedown.stop="startDrag($event, index)"
                                                        @touchstart.stop.prevent="startDrag($event, index)">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36"
                                                                viewBox="0 0 36 36">
                                                                <circle cx="15" cy="12" r="1.5" fill="currentColor"
                                                                        class="clr-i-outline clr-i-outline-path-1" />
                                                                <circle cx="15" cy="24" r="1.5" fill="currentColor"
                                                                        class="clr-i-outline clr-i-outline-path-2" />
                                                                <circle cx="21" cy="12" r="1.5" fill="currentColor"
                                                                        class="clr-i-outline clr-i-outline-path-3" />
                                                                <circle cx="21" cy="24" r="1.5" fill="currentColor"
                                                                        class="clr-i-outline clr-i-outline-path-4" />
                                                                <circle cx="21" cy="18" r="1.5" fill="currentColor"
                                                                        class="clr-i-outline clr-i-outline-path-5" />
                                                                <circle cx="15" cy="18" r="1.5" fill="currentColor"
                                                                        class="clr-i-outline clr-i-outline-path-6" />
                                                                <path fill="none" d="M0 0h36v36H0z" />
                                                        </svg>
                                                </div>
                                                <div class="sticker-name">{{ sticker.name }}</div>
                                                <!-- 添加直接调整位置的按钮 -->
                                                <div class="position-buttons">
                                                        <button @click.stop="moveToStart(index)" class="position-btn"
                                                                title="移到最前">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16"
                                                                        height="16" fill="currentColor"
                                                                        class="bi bi-caret-up-fill" viewBox="0 0 16 16">
                                                                        <path
                                                                                d="m7.247 4.86-4.796 5.481c-.566.647-.106 1.659.753 1.659h9.592a1 1 0 0 0 .753-1.659l-4.796-5.48a1 1 0 0 0-1.506 0z" />
                                                                </svg>
                                                        </button>
                                                        <button @click.stop="moveToEnd(index)" class="position-btn"
                                                                title="移到最后">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16"
                                                                        height="16" fill="currentColor"
                                                                        class="bi bi-caret-down-fill"
                                                                        viewBox="0 0 16 16">
                                                                        <path
                                                                                d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
                                                                </svg>
                                                        </button>
                                                </div>
                                        </div>
                                </div>
                        </div>
                </main>

                <HeaderDropdownMenu :is-open="isDropdownOpen" @close="isDropdownOpen = false">
                        <li @click="handleDropdownAction('bulkAdd')">批量导入</li>
                        <li @click="handleDropdownAction('exportAll')">全部导出</li>
                        <li @click="handleDropdownAction('reorder')">排序</li>
                        <li @click="handleDropdownAction('edit')">编辑</li>
                </HeaderDropdownMenu>

                <transition name="footer-slide">
                        <footer v-if="isEditMode" class="edit-footer">
                                <button @click="handleDeleteSelected" :disabled="selectedItems.size === 0"
                                        class="footer-btn delete-btn">删除</button>
                        </footer>
                </transition>
        </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useObservable } from '@vueuse/rxjs';
import { liveQuery } from 'dexie';
import { useRouter } from 'vue-router';
import db from '../services/database.js';
import AppHeader from '../components/layout/Header.vue';
import HeaderDropdownMenu from '../components/ui/HeaderDropdownMenu.vue';
import { showToast, showUploadChoiceModal, promptForInput, showConfirm } from '../services/uiService.js';
import { uploadToCloudinary } from '../services/cloudinaryService.js';
import { useSelection } from '../services/selectionService.js';

const router = useRouter();
const stickers = useObservable(liveQuery(() => db.stickers.orderBy('order').toArray()), { initialValue: [] });
const localStickers = ref([]);
const reorderGridRef = ref(null);
const searchTerm = ref('');

// 过滤后的表情列表，用于搜索功能
const filteredStickers = computed(() => {
        if (!searchTerm.value.trim()) return localStickers.value;
        const term = searchTerm.value.toLowerCase();
        return localStickers.value.filter(s => 
                s.name?.toLowerCase().includes(term)
        );
});

// 确保 localStickers 始终是一个数组
watch(stickers, (newStickers) => {
        try {
                if (Array.isArray(newStickers)) {
                        localStickers.value = newStickers.slice();
                } else if (newStickers && typeof newStickers.toArray === 'function') {
                        newStickers.toArray().then(arr => {
                                localStickers.value = Array.isArray(arr) ? arr.slice() : [];
                        }).catch(err => {
                                console.error('Error converting to array:', err);
                                localStickers.value = [];
                        });
                } else {
                        localStickers.value = [];
                        console.warn('stickers is not an array or iterable:', newStickers);
                }
        } catch (error) {
                console.error('Error processing stickers data:', error);
                localStickers.value = [];
        }
}, { immediate: true });

const isDropdownOpen = ref(false);
const isReordering = ref(false);

const gridContainerRef = ref(null);
const { isEditMode, selectedItems, toggleEditMode, handleInteractionStart, resetSelection } = useSelection(gridContainerRef);

// 修复标题显示 - 确保显示正确的选择数量
const headerTitle = computed(() => {
        if (isReordering.value) return '排序表情';
        if (isEditMode.value) return `已选择 ${selectedItems.size || 0} 项`;
        return '我的表情';
});

// 新增：快速跳转功能
const scrollToTop = () => {
        const container = document.querySelector('.sticker-content');
        if (container) {
                container.scrollTo({ top: 0, behavior: 'smooth' });
        }
};

const scrollToBottom = () => {
        const container = document.querySelector('.sticker-content');
        if (container) {
                container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        }
};

// 新增：移动到首位和末位的功能
const moveToStart = (index) => {
        if (index === 0) return; // 已经在首位
        
        const item = localStickers.value.splice(index, 1)[0];
        localStickers.value.unshift(item);
};

const moveToEnd = (index) => {
        if (index === localStickers.value.length - 1) return; // 已经在末位
        
        const item = localStickers.value.splice(index, 1)[0];
        localStickers.value.push(item);
};
    
// --- Core Actions ---
const handleAddSticker = async () => {
        const choice = await showUploadChoiceModal();
        if (!choice) return;

        try {
                const imageUrl = choice.type === 'local' ? await uploadToCloudinary(choice.value) : choice.value;
                const name = await promptForInput('表情名称', '为你的表情起个名字', false, false);

                if (name === null) return showToast('操作已取消', 'info');
                if (!name) return showToast('表情名称不能为空', 'error');

                if (!db.stickers) {
                        showToast('数据库未初始化，无法添加表情。', 'error');
                        return;
                }
                const highestOrder = await db.stickers.orderBy('order').last();
                await db.stickers.add({ url: imageUrl, name, order: (highestOrder?.order || 0) + 1 });
                showToast('表情已添加', 'success');
        } catch (error) {
                showToast(`添加失败: ${error.message}`, 'error');
                console.error(error);
        }
};

const handleDropdownAction = (action) => {
        isDropdownOpen.value = false;
        switch (action) {
                case 'bulkAdd': handleBulkAdd(); break;
                case 'exportAll': handleExportAll(); break;
                case 'edit': toggleEditMode(); break;
                case 'reorder': startReorder(); break;
        }
};

const handleBulkAdd = async () => {
        const jsonInput = await promptForInput('批量导入', '请粘贴JSON数组', true, false);
        if (!jsonInput) return;

        try {
                const items = JSON.parse(jsonInput);
                if (
                        !Array.isArray(items) ||
                        !items.every(i => i && typeof i === 'object' && i.name && i.url)
                ) {
                        throw new Error("格式无效，需要一个包含 name 和 url 字段的对象数组。");
                }

                const highestOrder = await db.stickers.orderBy('order').last();
                let currentOrder = highestOrder?.order || 0;
                const stickersWithOrder = items.map(s => ({ ...s, order: ++currentOrder }));

                await db.stickers.bulkAdd(stickersWithOrder);
                showToast(`成功导入 ${items.length} 个表情`, 'success');
        } catch (error) {
                showToast(`导入失败: ${error.message}`, 'error');
        }
};

const exportStickers = (stickersToExport) => {
        if (stickersToExport.length === 0) return showToast("没有可导出的表情。", "info");

        const content = JSON.stringify(stickersToExport.map(({ name, url }) => ({ name, url })), null, 2);
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mirrorPhone_Stickers_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
};

const handleExportAll = async () => {
        const allStickers = await db.stickers.toArray();
        exportStickers(allStickers);
};

const handleExportSelected = async () => {
        const selected = await db.stickers.bulkGet(Array.from(selectedItems.value));
        exportStickers(selected.filter(Boolean));
};

const handleDeleteSelected = async () => {
        if (selectedItems.value.size === 0) return;
        const confirmed = await showConfirm('删除表情', `确定要删除所选的 ${selectedItems.value.size} 个表情吗？`);
        if (confirmed) {
                await db.stickers.bulkDelete(Array.from(selectedItems.value));
                showToast('表情已删除', 'success');
                resetSelection();
        }
};

const startReorder = () => {
        isReordering.value = true;
        // 确保在排序模式下，表情列表可以看到第一项
        setTimeout(() => scrollToTop(), 100);
};

const saveReorder = async () => {
        const updates = localStickers.value.map((sticker, index) => ({
                key: sticker.id,
                changes: { order: index }
        }));
        try {
                await db.stickers.bulkUpdate(updates);
                showToast('排序已保存', 'success');
        } catch (error) {
                showToast(`保存排序失败: ${error.message}`, 'error');
        } finally {
                isReordering.value = false;
        }
};

const handleDone = () => {
        if (isEditMode.value) {
                toggleEditMode();
        } else if (isReordering.value) {
                saveReorder();
        }
};

// 改进拖拽功能，修改为只有按住拖动手柄才能拖拽
const startDrag = (event, index) => {
        if (!isReordering.value) return;
        event.preventDefault();
        
        // 获取被拖拽的元素
        const draggedItem = event.target.closest('.sticker-item');
        if (!draggedItem) return;
        
        // 标记为正在拖动状态
        draggedItem.classList.add('is-dragging');
        
        // 获取初始位置
        const startY = event.clientY || (event.touches && event.touches[0].clientY);
        const startX = event.clientX || (event.touches && event.touches[0].clientX);
        
        // 滚动控制变量
        let autoScrollSpeed = 0;
        let autoScrollTimer = null;
        const container = document.querySelector('.sticker-content');
        
        const handleMove = (e) => {
                e.preventDefault();
                
                const currentX = e.clientX || (e.touches && e.touches[0].clientX);
                const currentY = e.clientY || (e.touches && e.touches[0].clientY);
                
                // 处理自动滚动
                if (container) {
                        const containerRect = container.getBoundingClientRect();
                        const scrollThreshold = 60; // 滚动触发区域高度
                        
                        // 计算距离顶部和底部的距离
                        const topDistance = currentY - containerRect.top;
                        const bottomDistance = containerRect.bottom - currentY;
                        
                        // 清除之前的自动滚动
                        if (autoScrollTimer) {
                                clearInterval(autoScrollTimer);
                                autoScrollTimer = null;
                        }
                        
                        // 设置自动滚动速度
                        if (topDistance < scrollThreshold) {
                                autoScrollSpeed = -10 * (1 - topDistance / scrollThreshold);
                                startAutoScroll();
                        } else if (bottomDistance < scrollThreshold) {
                                autoScrollSpeed = 10 * (1 - bottomDistance / scrollThreshold);
                                startAutoScroll();
                        } else {
                                autoScrollSpeed = 0;
                        }
                }
                
                // 查找目标位置
                const items = document.querySelectorAll('.sticker-item.is-reordering');
                if (!items.length) return;
                
                for (let i = 0; i < items.length; i++) {
                        const currentIndex = parseInt(items[i].dataset.index);
                        if (currentIndex === index) continue;
                        
                        const targetRect = items[i].getBoundingClientRect();
                        if (currentX >= targetRect.left && currentX <= targetRect.right &&
                            currentY >= targetRect.top && currentY <= targetRect.bottom) {
                                
                                // 获取目标元素的索引
                                const targetIndex = filteredStickers.value[i] ? 
                                        localStickers.value.findIndex(s => s.id === filteredStickers.value[i].id) : i;
                                
                                if (targetIndex !== -1) {
                                        // 交换数组中的位置
                                        const temp = localStickers.value[index];
                                        localStickers.value[index] = localStickers.value[targetIndex];
                                        localStickers.value[targetIndex] = temp;
                                        
                                        // 更新索引
                                        index = targetIndex;
                                        
                                        // 重新调整数组
                                        const newStickers = [...localStickers.value];
                                        localStickers.value = newStickers;
                                }
                                return;
                        }
                }
        };
        
        const startAutoScroll = () => {
                if (autoScrollTimer) return;
                
                autoScrollTimer = setInterval(() => {
                        if (autoScrollSpeed !== 0 && container) {
                                container.scrollTop += autoScrollSpeed;
                        } else if (autoScrollSpeed === 0) {
                                clearInterval(autoScrollTimer);
                                autoScrollTimer = null;
                        }
                }, 16); // 约60fps
        };
        
        const stopDrag = (e) => {
                // 停止自动滚动
                if (autoScrollTimer) {
                        clearInterval(autoScrollTimer);
                        autoScrollTimer = null;
                }
                
                // 移除拖动样式
                draggedItem.classList.remove('is-dragging');
                
                // 移除事件监听
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('touchmove', handleMove);
                document.removeEventListener('mouseup', stopDrag);
                document.removeEventListener('touchend', stopDrag);
                document.removeEventListener('touchcancel', stopDrag);
        };
        
        // 添加事件监听
        document.addEventListener('mousemove', handleMove, { passive: false });
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('touchend', stopDrag);
        document.addEventListener('touchcancel', stopDrag);
};
</script>

<style scoped>
/* General Styles */
.page-container {
        overflow: hidden;
}

.header-action-button {
        background: none;
        border: none;
        color: var(--text-primary);
        cursor: pointer;
        padding: 5px;
}

.sticker-content {
        position: relative;
        flex-grow: 1;
        overflow-y: auto;
        padding: 10px;
        padding-bottom: 80px;
}

.empty-state {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        color: var(--text-secondary);
        pointer-events: none;
        width: 100%;
}

/* Grid Styles */
.sticker-grid {
        top: 40%;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 10px;
}

.sticker-item {
        position: relative;
        aspect-ratio: 1 / 1;
        border-radius: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        overflow: hidden;
        transition: transform 0.1s, box-shadow 0.1s;
        background-color: var(--bg-secondary);
}

.sticker-item.is-selecting {
        transform: scale(0.95);
        box-shadow: var(--accent-glow-shadow);
}

.sticker-item img {
        width: 100%;
        padding: 8px;
        user-select: none;
        -webkit-user-drag: none;
}

/* Add Button Styles */
.add-button {
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px dashed var(--border-color);
        color: var(--text-secondary);
        cursor: pointer;
}

.add-button:hover {
        background-color: var(--bg-card);
}

/* Selection Styles */
.selection-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.4);
        opacity: 0;
        transition: opacity 0.2s ease;
}

.sticker-item.is-selected .selection-overlay {
        opacity: 1;
}

.checkmark {
        position: absolute;
        top: 5px;
        right: 5px;
        width: 22px;
        height: 22px;
        background-color: var(--accent-primary);
        border-radius: 6px;
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
}

.checkmark::after {
        content: '';
        width: 6px;
        height: 11px;
        border: solid white;
        border-width: 0 3px 3px 0;
        transform: rotate(45deg);
        margin-top: -2px;
}

/* 重新排序相关样式 */
.sticker-reorder-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: 100%;
}

.reorder-tools {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 0;
        margin-top: -5px; 
        background-color: var(--bg-primary);
        position: sticky;
        top: -10px; 
        z-index: 15;
}

.search-input {
        flex: 1;
        padding: 8px 12px;
        border-radius: 20px;
        border: 1px solid var(--border-color);
        background-color: var(--bg-secondary);
        color: var(--text-primary);
        outline: none;
}

.quick-jump-buttons {
        display: flex;
        gap: 8px;
        margin-left: 10px;
}

.jump-btn {
        padding: 6px 12px;
        border-radius: 16px;
        border: 1px solid var(--border-color);
        background-color: var(--bg-secondary);
        color: var(--text-primary);
        cursor: pointer;
}

.jump-btn:active {
        background-color: var(--bg-card);
}

.reorder-grid {
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
}

.is-reordering {
        position: relative;
        cursor: default; /* 默认不是拖动光标 */
        transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.is-dragging {
        z-index: 100;
        transform: scale(1.05);
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}

.sticker-name {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 4px;
        font-size: 12px;
        text-align: center;
        color: var(--text-primary);
        background-color: rgba(0, 0, 0, 0.5);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
}

.drag-handle {
        position: absolute;
        top: 5px;
        right: 5px;
        width: 28px; /* 增加大小以便于触摸 */
        height: 28px;
        background-color: rgba(0, 0, 0, 0.6);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        cursor: grab;
        z-index: 10;
}

.drag-handle:hover, .drag-handle:active {
        background-color: var(--accent-primary);
}

/* 使用更明显的视觉提示表示可拖动区域 */
.is-reordering .drag-handle::after {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: 2px solid rgba(255,255,255,0.5);
        box-sizing: border-box;
        animation: pulse 1.5s infinite;
}

@keyframes pulse {
        0% { transform: scale(1); opacity: 0.7; }
        50% { transform: scale(1.1); opacity: 0.9; }
        100% { transform: scale(1); opacity: 0.7; }
}

/* 调整位置按钮样式，增加点击面积 */
.position-buttons {
        position: absolute;
        top: 5px;
        left: 5px;
        display: flex;
        gap: 4px;
}

.position-btn {
        width: 28px; /* 增加大小以便于触摸 */
        height: 28px;
        border-radius: 50%;
        background-color: rgba(0, 0, 0, 0.6);
        border: none;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0;
}

.position-btn:active {
        background-color: var(--accent-primary);
}

/* Footer Styles */
.edit-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        height: calc(40px + var(--safe-bottom));
        padding-bottom: calc(10px + var(--safe-bottom));
        background-color: var(--bg-card);
        border-top: 1px solid var(--border-color);
        display: flex;
        justify-content: space-between;
        align-items: center;
        z-index: 100;
}

.footer-btn {
        background: none;
        border: none;
        color: var(--accent-primary);
        font-size: 16px;
        font-weight: 600;
        padding: 10px 15px;
        cursor: pointer;
}

.footer-btn.delete-btn {
        color: #f44336;
}

.footer-btn:disabled {
        color: var(--text-secondary);
        opacity: 0.5;
}

.footer-slide-enter-active,
.footer-slide-leave-active {
        transition: transform 0.3s ease-out;
}

.footer-slide-enter-from,
.footer-slide-leave-to {
        transform: translateY(100%);
}

/* Hide scrollbar for Chrome, Safari and Opera */
.sticker-content::-webkit-scrollbar {
        display: none;
}

/* Hide scrollbar for IE and Edge */
.sticker-content {
        -ms-overflow-style: none;
        scrollbar-width: none;
}

/* 禁用选择功能 */
.sticker-reorder-container {
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        touch-action: none;
}
</style>