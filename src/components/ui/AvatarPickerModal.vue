<template>
        <transition name="modal-fade">
                <div class="modal-overlay" @click.self="handleCancel">
                        <div class="modal-content avatar-picker-modal">
                                <div class="modal-header">
                                        <h3 class="modal-title">选择头像</h3>
                                        <div class="header-actions">
                                                <button 
                                                        v-if="!isDeleteMode" 
                                                        @click="toggleDeleteMode" 
                                                        class="delete-toggle-btn"
                                                        title="删除头像"
                                                >
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                                <polyline points="3,6 5,6 21,6"></polyline>
                                                                <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                                                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                                                <line x1="14" y1="11" x2="14" y2="17"></line>
                                                        </svg>
                                                </button>
                                                <button 
                                                        v-if="isDeleteMode" 
                                                        @click="deleteSelectedAvatars" 
                                                        class="delete-confirm-btn"
                                                        :disabled="selectedForDelete.length === 0"
                                                >
                                                        删除选中 ({{ selectedForDelete.length }})
                                                </button>
                                                <button 
                                                        v-if="isDeleteMode" 
                                                        @click="cancelDeleteMode" 
                                                        class="delete-cancel-btn"
                                                >
                                                        取消
                                                </button>
                                        </div>
                                </div>

                                <div class="modal-body">
                                        <div v-if="!avatars || avatars.length === 0"
                                                class="empty-state">
                                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                                        <polyline points="21,15 16,10 5,21"></polyline>
                                                </svg>
                                                <p>还没有头像</p>
                                                <small>点击下方按钮上传第一个头像</small>
                                        </div>

                                        <div v-else class="avatar-grid">
                                                <div 
                                                        v-for="avatar in avatars" 
                                                        :key="avatar.url"
                                                        class="avatar-item"
                                                        :class="{ 
                                                                'delete-mode': isDeleteMode,
                                                                'selected-for-delete': selectedForDelete.includes(avatar.url)
                                                        }"
                                                        @click="handleAvatarClick(avatar.url)"
                                                        :title="avatar.description || ''"
                                                >
                                                        <img :src="avatar.url" :alt="'头像'" class="avatar-image" loading="lazy">
                                                        
                                                        <!-- 删除模式下的选择标记 -->
                                                        <div v-if="isDeleteMode" class="delete-checkbox">
                                                                <div class="checkbox" :class="{ checked: selectedForDelete.includes(avatar.url) }">
                                                                        <svg v-if="selectedForDelete.includes(avatar.url)" width="16" height="16" viewBox="0 0 24 24" fill="white">
                                                                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                                                        </svg>
                                                                </div>
                                                        </div>
                                                </div>
                                        </div>
                                </div>

                                <div class="modal-actions">
                                        <button @click="handleCancel" class="action-btn cancel">取消</button>
                                        <button @click="handleUpload" class="action-btn upload">上传新头像</button>
                                </div>
                        </div>
                </div>
        </transition>
</template>

<script setup>
import { ref, defineProps } from 'vue';

const props = defineProps({
        avatars: {
                type: Array,
                required: true,
        },
        onSelect: Function,
        onCancel: Function,
        onUpload: Function,
        onDelete: Function,
});

const isDeleteMode = ref(false);
const selectedForDelete = ref([]);

// 切换删除模式
const toggleDeleteMode = () => {
        isDeleteMode.value = true;
        selectedForDelete.value = [];
};

// 取消删除模式
const cancelDeleteMode = () => {
        isDeleteMode.value = false;
        selectedForDelete.value = [];
};

// 处理头像点击
const handleAvatarClick = (avatarUrl) => {
        if (isDeleteMode.value) {
                // 删除模式下，切换选中状态
                const index = selectedForDelete.value.indexOf(avatarUrl);
                if (index > -1) {
                        selectedForDelete.value.splice(index, 1);
                } else {
                        selectedForDelete.value.push(avatarUrl);
                }
        } else {
                // 普通模式下，直接选择并应用
                if (props.onSelect) {
                        props.onSelect(avatarUrl);
                }
        }
};

// 删除选中的头像
const deleteSelectedAvatars = async () => {
        if (props.onDelete && selectedForDelete.value.length > 0) {
                await props.onDelete(selectedForDelete.value);
                cancelDeleteMode();
        }
};

// 处理上传
const handleUpload = () => {
        if (props.onUpload) {
                props.onUpload();
        }
};

// 处理取消
const handleCancel = () => {
        if (props.onCancel) {
                props.onCancel();
        }
};
</script>

<style scoped>
.avatar-picker-modal {
        max-height: 80vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        width: 100%;
        max-width: 500px;
}

.modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid var(--border-color);
}

.modal-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary);
}

.header-actions {
        display: flex;
        gap: 8px;
        align-items: center;
}

.delete-toggle-btn {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 8px;
        border-radius: 6px;
        transition: all 0.2s ease;
}

.delete-toggle-btn:hover {
        color: #f44336;
}

.delete-confirm-btn {
        background-color: #f44336;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
}

.delete-confirm-btn:hover:not(:disabled) {
        background-color: #d32f2f;
}

.delete-confirm-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
}

.delete-cancel-btn {
        background-color: var(--bg-secondary);
        color: var(--text-primary);
        border: 1px solid var(--border-color);
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
}

.delete-cancel-btn:hover {
        background-color: var(--bg-primary);
}

.modal-body {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
}

.empty-state {
        text-align: center;
        color: var(--text-secondary);
        padding: 40px 20px;
}

.empty-state svg {
        margin-bottom: 16px;
        opacity: 0.5;
}

.empty-state p {
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 500;
}

.empty-state small {
        font-size: 14px;
        opacity: 0.7;
}

.avatar-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
        gap: 12px;
}

.avatar-item {
        aspect-ratio: 1/1;
        overflow: hidden;
        border-radius: 8px;
        position: relative;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 2px solid transparent;
}

.avatar-item:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.avatar-item.delete-mode {
        cursor: pointer;
}

.avatar-item.selected-for-delete {
        border-color: var(--accent-primary);
}

.avatar-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
}

.delete-checkbox {
        position: absolute;
        top: 4px;
        right: 4px;
}

.checkbox {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 1px solid white;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
}

.checkbox.checked {
        background-color: var(--accent-primary);
        border-color: var(--accent-primary);
}

.modal-actions {
        display: flex;
        gap: 12px;
        padding: 20px;
        border-top: 1px solid var(--border-color);
}

.action-btn {
        flex: 1;
        padding: 12px 20px;
        border: none;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 14px;
}

.action-btn.cancel {
        background-color: var(--bg-card);
        color: var(--text-primary);
        border: 1px solid var(--border-color);
}

.action-btn.cancel:hover {
        background-color: var(--bg-primary);
}

.action-btn.upload {
        background-color: var(--accent-primary);
        color: white;
}

.action-btn.upload:hover {
        background-color: var(--accent-darker);
}

/* 模态框动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
        transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
        opacity: 0;
}

/* 响应式设计 */
@media (max-width: 480px) {
        .avatar-grid {
                grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
                gap: 8px;
        }
        
        .modal-body {
                padding: 15px;
        }
        
        .modal-actions {
                padding: 15px;
        }
}
</style>
