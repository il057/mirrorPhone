<template>
        <div class="page-container">
                <AppHeader :title="isEditMode ? `已选择 ${selectedItems.size} 项` : '相册'">
                        <template #right>
                                <button @click="isDropdownOpen = !isDropdownOpen" class="header-action-button">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                                stroke-linecap="round" stroke-linejoin="round">
                                                <circle cx="12" cy="12" r="1"></circle>
                                                <circle cx="19" cy="12" r="1"></circle>
                                                <circle cx="5" cy="12" r="1"></circle>
                                        </svg>
                                </button>
                        </template>
                </AppHeader>

                <main class="album-content content" ref="gridContainerRef" @mousedown="handleInteractionStart"
                        @touchstart.prevent="handleInteractionStart">
                        <div v-if="!photos || photos.length === 0" class="empty-state">
                                <p>相册是空的，点击右上角添加第一张照片吧！</p>
                        </div>
                        <div v-else class="photo-grid">
                                <div v-for="photo in photos" :key="photo.id" class="photo-item" :data-id="photo.id"
                                        :class="{ 'is-selected': selectedItems.has(photo.id) }">
                                        <img :src="photo.url" :alt="photo.description" />
                                        <div v-if="isEditMode" class="selection-overlay">
                                                <div class="checkmark"></div>
                                        </div>
                                </div>
                        </div>
                </main>

                <HeaderDropdownMenu :is-open="isDropdownOpen" @close="isDropdownOpen = false">
                        <li @click="handleDropdownAction('add')">添加图片</li>
                        <li @click="handleDropdownAction('edit')">编辑</li>
                </HeaderDropdownMenu>

                <transition name="footer-slide">
                        <footer v-if="isEditMode" class="edit-footer">
                                <button @click="handleDeleteSelected" :disabled="selectedItems.size === 0"
                                        class="footer-btn delete-btn">删除</button>
                                <button @click="handleDoneEditing" class="footer-btn">完成</button>
                        </footer>
                </transition>
        </div>
</template>

<script setup>
import { ref } from 'vue';
import { useObservable } from '@vueuse/rxjs';
import { liveQuery } from 'dexie';
import db from '../services/database.js';
import AppHeader from '../components/layout/Header.vue';
import HeaderDropdownMenu from '../components/ui/HeaderDropdownMenu.vue';
import { showToast, showUploadChoiceModal, promptForInput, showConfirm } from '../services/uiService.js';
import { uploadToCloudinary } from '../services/cloudinaryService.js';
import { useSelection } from '../services/selectionService.js';

const photos = useObservable(liveQuery(() => db.globalAlbum.orderBy('id').reverse().toArray()), { initialValue: [] });
const isDropdownOpen = ref(false);

const gridContainerRef = ref(null);
const { isEditMode, selectedItems, toggleEditMode, handleInteractionStart, resetSelection } = useSelection(gridContainerRef);


const handleAddPhoto = async () => {
        // This logic is now correct from the bug fix step
        const choice = await showUploadChoiceModal();
        if (!choice) return;

        let imageUrl;
        try {
                if (choice.type === 'local') {
                        showToast('正在上传...', 'info');
                        imageUrl = await uploadToCloudinary(choice.value);
                } else {
                        imageUrl = choice.value;
                }

                const description = await promptForInput('添加描述', '这张照片背后有什么故事吗？（可选）', true, true);

                if (description === null) {
                        showToast('操作已取消', 'info');
                        return;
                }

                await db.globalAlbum.add({
                        url: imageUrl,
                        description: description || '',
                        createdAt: new Date(),
                });

                showToast('照片已成功添加！', 'success');
        } catch (error) {
                console.error('添加照片失败:', error);
                showToast(`添加失败: ${error.message}`, 'error');
        }
};

const handleDropdownAction = (action) => {
        isDropdownOpen.value = false;
        if (action === 'add') {
                handleAddPhoto();
        } else if (action === 'edit') {
                toggleEditMode();
        }
};

const handleDoneEditing = () => {
        toggleEditMode();
};

const handleDeleteSelected = async () => {
        if (selectedItems.value.size === 0) return;

        const confirmed = await showConfirm('删除照片', `确定要删除所选的 ${selectedItems.value.size} 张照片吗？`);
        if (confirmed) {
                try {
                        await db.globalAlbum.bulkDelete(Array.from(selectedItems.value));
                        showToast('照片已删除', 'success');
                        resetSelection();
                } catch (error) {
                        showToast(`删除失败: ${error.message}`, 'error');
                }
        }
};

</script>

<style scoped>
.page-container {
        overflow: hidden;
}

.header-action-button {
        font-size: 24px;
        background: none;
        border: none;
        color: var(--text-primary);
        cursor: pointer;
        padding: 5px;
}

.album-content {
        flex-grow: 1;
        overflow-y: auto;
        padding-left: 10px;
        padding-right: 10px;
        padding-bottom: 80px;
        padding-top: calc(10px + var(--header-height));
        /* Space for edit footer */
}

.photo-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 5px;
}

.photo-item {
        position: relative;
        aspect-ratio: 1 / 1;
        border-radius: 4px;
        overflow: hidden;
        transition: transform 0.1s ease;
        user-select: none;
        -webkit-user-drag: none;
}

.photo-item.is-selecting {
        transform: scale(0.95);
        box-shadow: var(--accent-glow-shadow);
}

.photo-item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
}

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

.photo-item.is-selected .selection-overlay {
        opacity: 1;
}

.checkmark {
        position: absolute;
        top: 5px;
        right: 5px;
        width: 20px;
        height: 20px;
        background-color: var(--accent-primary);
        border-radius: 5px;
        border: 2px solid white;
        display: flex;
        justify-content: center;
        align-items: center;
}

.checkmark::after {
        content: '';
        position: absolute;
        left: 6px;
        top: 3px;
        width: 5px;
        height: 10px;
        border: solid white;
        border-width: 0 3px 3px 0;
        transform: rotate(45deg);
}

.empty-state {
        text-align: center;
        margin-top: 50px;
        color: var(--text-secondary);
}

/* Edit Footer */
.edit-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        height: calc(60px + var(--safe-bottom));
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
</style>