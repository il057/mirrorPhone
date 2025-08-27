<template>
        <div v-if="isVisible" class="modal-overlay" @click.self="closeModal">
                <div class="modal-content write-post-modal">
                        <div class="modal-header">
                                <h3 class="modal-title">{{ isEditMode ? '编辑动态' : '发布动态' }}</h3>
                                <button class="close-btn" @click="closeModal">×</button>
                        </div>
                        
                        <div class="modal-body">
                                <!-- 文本输入区域 -->
                                <div class="text-input-section">
                                        <textarea 
                                                v-model="postText" 
                                                placeholder="分享新鲜事..." 
                                                class="post-textarea"
                                                :rows="isImagePost ? 3 : 6"
                                        ></textarea>
                                </div>
                                
                                <!-- 图片区域 - 仅在图片动态时显示 -->
                                <div v-if="isImagePost" class="image-section">
                                        <!-- 图片模式选择 -->
                                        <div class="segmented-control">
                                                <input 
                                                        type="radio" 
                                                        id="text-description" 
                                                        value="description" 
                                                        v-model="imageMode"
                                                >
                                                <label for="text-description" :class="{ active: imageMode === 'description' }">
                                                        文字描述图片
                                                </label>
                                                
                                                <input 
                                                        type="radio" 
                                                        id="upload-image" 
                                                        value="upload" 
                                                        v-model="imageMode"
                                                >
                                                <label for="upload-image" :class="{ active: imageMode === 'upload' }">
                                                        上传图片
                                                </label>
                                                
                                                <input 
                                                        type="radio" 
                                                        id="album-select" 
                                                        value="album" 
                                                        v-model="imageMode"
                                                >
                                                <label for="album-select" :class="{ active: imageMode === 'album' }">
                                                        从相册选择
                                                </label>
                                        </div>
                                        
                                        <!-- 图片描述文本框 -->
                                        <div class="image-description-section" :class="{ 'required': imageMode === 'description' }">
                                                <div v-if="imageMode !== 'description'" class="description-toggle">
                                                        <button 
                                                                type="button" 
                                                                class="toggle-description-btn"
                                                                @click="showDescription = !showDescription"
                                                        >
                                                                {{ showDescription ? '收起描述' : '添加描述' }}
                                                        </button>
                                                </div>
                                                
                                                <div v-if="imageMode === 'description' || showDescription" class="description-input">
                                                        <textarea 
                                                                v-model="imageDescription" 
                                                                :placeholder="imageMode === 'description' ? '请描述图片内容...' : '为图片添加描述...'"
                                                                class="description-textarea"
                                                                rows="3"
                                                        ></textarea>
                                                </div>
                                        </div>
                                        
                                        <!-- 图片选择/上传区域 -->
                                        <div v-if="imageMode !== 'description'" class="image-upload-area">
                                                <div v-if="selectedImages.length === 0" class="upload-placeholder">
                                                        <button 
                                                                type="button" 
                                                                class="add-image-btn"
                                                                @click="handleImageSelection"
                                                        >
                                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                                                        <circle cx="8.5" cy="8.5" r="1.5"/>
                                                                        <polyline points="21,15 16,10 5,21"/>
                                                                </svg>
                                                                {{ imageMode === 'upload' ? '上传图片' : '选择图片' }}
                                                        </button>
                                                </div>
                                                
                                                <div v-else class="selected-images">
                                                        <div v-for="(image, index) in selectedImages" :key="index" class="image-item">
                                                                <img :src="image.url" :alt="image.description || '图片'" class="preview-image">
                                                                <button 
                                                                        type="button" 
                                                                        class="remove-image-btn"
                                                                        @click="removeImage(index)"
                                                                >
                                                                        ×
                                                                </button>
                                                        </div>
                                                        
                                                        <button 
                                                                v-if="selectedImages.length < 9"
                                                                type="button" 
                                                                class="add-more-btn"
                                                                @click="handleImageSelection"
                                                        >
                                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                                        <line x1="12" y1="5" x2="12" y2="19"/>
                                                                        <line x1="5" y1="12" x2="19" y2="12"/>
                                                                </svg>
                                                        </button>
                                                </div>
                                        </div>
                                </div>
                                
                                <!-- 谁可以看设置 - 编辑模式下隐藏 -->
                                <div v-if="!isEditMode" class="visibility-section">
                                        <div class="visibility-header" @click="showVisibilityOptions = !showVisibilityOptions">
                                                <span class="visibility-label">谁可以看</span>
                                                <span class="visibility-value">{{ visibilityText }}</span>
                                                <svg 
                                                        class="chevron-icon" 
                                                        :class="{ 'expanded': showVisibilityOptions }"
                                                        width="16" 
                                                        height="16" 
                                                        viewBox="0 0 24 24" 
                                                        fill="none" 
                                                        stroke="currentColor" 
                                                        stroke-width="2"
                                                >
                                                        <polyline points="6,9 12,15 18,9"/>
                                                </svg>
                                        </div>
                                        
                                        <!-- 手风琴展开内容 -->
                                        <div v-if="showVisibilityOptions" class="visibility-options">
                                                <div class="visibility-mode-selector">
                                                        <label class="radio-option">
                                                                <input 
                                                                        type="radio" 
                                                                        value="public" 
                                                                        v-model="visibilityMode"
                                                                >
                                                                <span class="radio-text">公开</span>
                                                        </label>
                                                        
                                                        <label class="radio-option">
                                                                <input 
                                                                        type="radio" 
                                                                        value="group" 
                                                                        v-model="visibilityMode"
                                                                >
                                                                <span class="radio-text">选择分组</span>
                                                        </label>
                                                        
                                                        <label class="radio-option">
                                                                <input 
                                                                        type="radio" 
                                                                        value="friends" 
                                                                        v-model="visibilityMode"
                                                                >
                                                                <span class="radio-text">选择好友</span>
                                                        </label>
                                                </div>
                                                
                                                <!-- 分组选择 -->
                                                <div v-if="visibilityMode === 'group'" class="group-selection">
                                                        <div class="selection-header">选择分组</div>
                                                        <div class="checkbox-list">
                                                                <label v-for="group in availableGroups" :key="group.id" class="checkbox-item">
                                                                        <input 
                                                                                type="checkbox" 
                                                                                :value="group.id" 
                                                                                v-model="selectedGroups"
                                                                        >
                                                                        <span class="checkbox-text">{{ group.name }}</span>
                                                                </label>
                                                        </div>
                                                </div>
                                                
                                                <!-- 好友选择 -->
                                                <div v-if="visibilityMode === 'friends'" class="friends-selection">
                                                        <div class="selection-header">选择好友</div>
                                                        <div class="checkbox-list">
                                                                <label v-for="friend in availableFriends" :key="friend.id" class="checkbox-item">
                                                                        <input 
                                                                                type="checkbox" 
                                                                                :value="friend.id" 
                                                                                v-model="selectedFriends"
                                                                        >
                                                                        <div class="friend-item">
                                                                                <div class="avatar">
                                                                                        <img v-if="friend.avatar" :src="friend.avatar" :alt="friend.name">
                                                                                        <span v-else class="avatar-initial">{{ getInitial(friend.name) }}</span>
                                                                                </div>
                                                                                <span class="checkbox-text">{{ friend.name }}</span>
                                                                        </div>
                                                                </label>
                                                        </div>
                                                </div>
                                        </div>
                                </div>
                        </div>
                        
                        <!-- 底部按钮 -->
                        <div class="modal-footer">
                                <button type="button" class="cancel-btn" @click="closeModal">
                                        取消
                                </button>
                                <button type="button" class="publish-btn" @click="publishPost" :disabled="!canPublish">
                                        {{ isEditMode ? '保存' : '发表' }}
                                </button>
                        </div>
                </div>
        </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { showUploadChoiceModal, showAlbumPickerModal } from '../../services/uiService.js';
import { uploadToCloudinary } from '../../services/cloudinaryService.js';
import db from '../../services/database.js';

// 组件属性
const props = defineProps({
        isVisible: {
                type: Boolean,
                default: false
        },
        postType: {
                type: String, // 'text' 或 'image'
                default: 'text'
        },
        editData: {
                type: Object,
                default: null
        },
        isEditMode: {
                type: Boolean,
                default: false
        }
});

// 事件
const emit = defineEmits(['close', 'publish']);

// 响应式数据
const postText = ref('');
const isImagePost = computed(() => props.postType === 'image');
const imageMode = ref('upload'); // 'description', 'upload', 'album'
const imageDescription = ref('');
const showDescription = ref(true);
const selectedImages = ref([]);

// 可见性设置
const showVisibilityOptions = ref(false);
const visibilityMode = ref('public'); // 'public', 'group', 'friends'
const selectedGroups = ref([]);
const selectedFriends = ref([]);
const availableGroups = ref([]);
const availableFriends = ref([]);

// 计算属性
const visibilityText = computed(() => {
        switch (visibilityMode.value) {
                case 'public':
                        return '公开';
                case 'group':
                        if (selectedGroups.value.length === 0) return '选择分组';
                        if (selectedGroups.value.length === 1) {
                                const group = availableGroups.value.find(g => g.id === selectedGroups.value[0]);
                                return group?.name || '选择分组';
                        }
                        return `${selectedGroups.value.length}个分组`;
                case 'friends':
                        if (selectedFriends.value.length === 0) return '选择好友';
                        if (selectedFriends.value.length === 1) {
                                const friend = availableFriends.value.find(f => f.id === selectedFriends.value[0]);
                                return friend?.name || '选择好友';
                        }
                        return `${selectedFriends.value.length}位好友`;
                default:
                        return '公开';
        }
});

const canPublish = computed(() => {
        if (!isImagePost.value) {
                return postText.value.trim().length > 0;
        }

        if (imageMode.value === 'description') {
                return imageDescription.value.trim().length > 0;
        } else {
                return selectedImages.value.length > 0 || postText.value.trim().length > 0;
        }
});

// 方法
const closeModal = () => {
        emit('close');
        if (!props.isEditMode) {
                resetForm();
        }
};

const resetForm = () => {
        postText.value = '';
        imageDescription.value = '';
        showDescription.value = true;
        selectedImages.value = [];
        showVisibilityOptions.value = false;
        visibilityMode.value = 'public';
        selectedGroups.value = [];
        selectedFriends.value = [];
        imageMode.value = 'upload';
};

const getInitial = (name) => {
        if (!name) return 'U';
        return name.charAt(0).toUpperCase();
};

const handleImageSelection = async () => {
        try {
                let newImage = null;

                // 判断当前是“上传”模式还是“相册”模式
                if (imageMode.value === 'upload') {
                        // “上传”模式会弹出包含“本地上传”和“URL”的选项
                        const choice = await showUploadChoiceModal();
                        if (!choice) return;

                        if (choice.type === 'local') {
                                const imageUrl = await uploadToCloudinary(choice.value);
                                if (imageUrl) {
                                        newImage = { url: imageUrl, description: '' };
                                }
                        } else { // 处理 URL 输入的情况
                                newImage = { url: choice.value, description: '' };
                        }

                } else if (imageMode.value === 'album') {
                        // “相册”模式直接打开相册选择器
                        const selectedPhoto = await showAlbumPickerModal();
                        if (selectedPhoto) {
                                newImage = {
                                        url: selectedPhoto.url,
                                        description: selectedPhoto.description || ''
                                };
                        }
                }

                // 如果成功获取了新图片
                if (newImage) {
                        // 使用创建一个新数组的方式来确保 Vue 的响应式更新
                        selectedImages.value = [...selectedImages.value, newImage];
                }

        } catch (error) {
                console.error('选择图片失败:', error);
        }
};

// 监听 selectedImages 的变化来构建结构化描述
watch(selectedImages, (newImages, oldImages) => {
        // 仅当图片数量增加时才自动更新描述
        if (newImages.length > oldImages.length) {
                let currentDescriptions = imageDescription.value.split('\n').filter(line => line.trim() !== '');

                const newImage = newImages[newImages.length - 1];
                const newDescriptionLine = `第${newImages.length}张：${newImage.description || ''}`;

                // 查找是否已有 "第x张：" 的占位符
                const existingLineIndex = currentDescriptions.findIndex(line => line.startsWith(`第${newImages.length}张：`));

                if (existingLineIndex > -1) {
                        // 如果存在，替换它
                        currentDescriptions[existingLineIndex] = newDescriptionLine;
                } else {
                        // 否则，添加新行
                        currentDescriptions.push(newDescriptionLine);
                }

                imageDescription.value = currentDescriptions.join('\n');
        } else if (newImages.length < oldImages.length) {
                // 如果图片被移除了，重新生成描述
                imageDescription.value = newImages.map((img, index) => `第${index + 1}张：${img.description || ''}`).join('\n');
        }

        // 如果添加了图片，确保描述框可见
        if (newImages.length > 0) {
                showDescription.value = true;
        }
}, { deep: true });

const removeImage = (index) => {
        const newImages = [...selectedImages.value];
        newImages.splice(index, 1);
        selectedImages.value = newImages;
};

const publishPost = () => {
        const postData = {
                text: postText.value.trim(),
                images: [],
                imageDescription: '',
                placeholders: [], // 存放占位符描述
                type: isImagePost.value ? 'image' : 'text',
                visibility: {
                        mode: visibilityMode.value,
                        groups: selectedGroups.value,
                        friends: selectedFriends.value
                }
        };

        // 如果是编辑模式，添加eventId
        if (props.isEditMode && props.editData) {
                postData.eventId = props.editData.id;
        }

        if (isImagePost.value) {
                // 如果是“文字描述图片”模式
                if (imageMode.value === 'description') {
                        // 将换行分隔的描述拆分成数组，存入 placeholders 字段
                        postData.placeholders = imageDescription.value.trim().split('\n').filter(d => d.trim() !== '');
                } else {
                        // 否则，正常添加图片和可能的描述
                        postData.images = selectedImages.value;
                        if (showDescription.value && imageDescription.value.trim()) {
                                postData.imageDescription = imageDescription.value.trim();
                        }
                }
        }

        emit('publish', postData);
        closeModal();
};

const loadGroups = async () => {
        try {
                const groups = await db.groups.filter(g => g.id !== 'group_special').toArray();
                availableGroups.value = groups;
        } catch (error) {
                console.error('加载分组失败:', error);
        }
};

const loadFriends = async () => {
        try {
                const friends = await db.actors.filter(a => a.isGroup !== 1 && !a.id.startsWith('user_')).toArray();
                availableFriends.value = friends;
        } catch (error) {
                console.error('加载好友失败:', error);
        }
};

onMounted(() => {
        loadGroups();
        loadFriends();
        // 默认将描述框设为可见，并切换图片模式为上传
        if (props.postType === 'image') {
                imageMode.value = 'upload';
                showDescription.value = true;
        }
});

// 监听编辑数据变化，填充表单
watch(() => props.editData, (newEditData) => {
        if (newEditData && props.isEditMode) {
                // 正确设置文本内容
                if (newEditData.content && newEditData.content.text) {
                        postText.value = newEditData.content.text;
                } else {
                        postText.value = '';
                }
                
                // 如果有图片，设置图片相关内容
                if (newEditData.content && newEditData.content.images && newEditData.content.images.length > 0) {
                        // 将图片URL转换为selectedImages格式
                        selectedImages.value = newEditData.content.images.map(url => ({
                                url: url,
                                description: ''
                        }));
                        
                        // 如果有图片描述，也填充进去
                        if (newEditData.content.imageDescription) {
                                imageDescription.value = newEditData.content.imageDescription;
                        }
                } else {
                        selectedImages.value = [];
                        imageDescription.value = '';
                }
        } else {
                // 非编辑模式时清空
                selectedImages.value = [];
                imageDescription.value = '';
        }
}, { immediate: true });
</script>

<style scoped>
.write-post-modal {
        width: 90%;
        max-width: 500px;
        max-height: 80vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
}

.modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 15px;
        border-bottom: 1px solid var(--border-color);
}

.modal-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
}

.close-btn {
        background: none;
        border: none;
        font-size: 24px;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
}

.modal-body {
        flex: 1;
        overflow-y: auto;
        padding: 20px 0;
}

.text-input-section {
        margin-bottom: 20px;
}

.post-textarea {
        width: 100%;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 12px;
        background-color: var(--bg-primary);
        color: var(--text-primary);
        font-size: 16px;
        resize: vertical;
        min-height: 100px;
        box-sizing: border-box;
}

.post-textarea:focus {
        outline: none;
        border-color: var(--accent-primary);
}

.image-section {
        margin-bottom: 20px;
}

.segmented-control {
        display: flex;
        background: var(--bg-secondary);
        border-radius: 8px;
        padding: 4px;
        margin-bottom: 15px;
        overflow: hidden;
}

.segmented-control input[type="radio"] {
        display: none;
}

.segmented-control label {
        flex: 1;
        text-align: center;
        padding: 8px 12px;
        font-size: 14px;
        cursor: pointer;
        border-radius: 6px;
        transition: all 0.2s ease;
        color: var(--text-secondary);
        font-weight: 500;
}

.segmented-control label.active,
.segmented-control label:hover {
        background: var(--accent-primary);
        color: white;
}

.image-description-section {
        margin: 15px 0;
}

.image-description-section.required .description-input {
        border: 2px solid var(--accent-primary);
        border-radius: 8px;
        padding: 1px;
}

.description-toggle {
        margin-bottom: 10px;
}

.toggle-description-btn {
        background: none;
        border: 1px solid var(--border-color);
        color: var(--text-secondary);
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
}

.toggle-description-btn:hover {
        background-color: var(--bg-secondary);
        color: var(--text-primary);
}

.description-textarea {
        width: 100%;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 12px;
        background-color: var(--bg-primary);
        color: var(--text-primary);
        font-size: 14px;
        resize: vertical;
        box-sizing: border-box;
}

.description-textarea:focus {
        outline: none;
        border-color: var(--accent-primary);
}

.image-upload-area {
        margin-top: 15px;
}

.upload-placeholder {
        text-align: center;
        padding: 40px 20px;
        border: 2px dashed var(--border-color);
        border-radius: 8px;
}

.add-image-btn {
        background: none;
        border: none;
        color: var(--text-secondary);
        font-size: 16px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
}

.add-image-btn:hover {
        color: var(--accent-primary);
}

.selected-images {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
}

.image-item {
        position: relative;
        aspect-ratio: 1;
        border-radius: 8px;
        overflow: hidden;
}

.preview-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
}

.remove-image-btn {
        position: absolute;
        top: 5px;
        right: 5px;
        width: 24px;
        height: 24px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
}

.add-more-btn {
        aspect-ratio: 1;
        border: 2px dashed var(--border-color);
        border-radius: 8px;
        background: none;
        color: var(--text-secondary);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
}

.add-more-btn:hover {
        border-color: var(--accent-primary);
        color: var(--accent-primary);
}

.visibility-section {
        border: 1px solid var(--border-color);
        border-radius: 8px;
        margin-bottom: 20px;
}

.visibility-header {
        padding: 15px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
}

.visibility-label {
        font-weight: 600;
        color: var(--text-primary);
}

.visibility-value {
        color: var(--text-secondary);
        font-size: 14px;
}

.chevron-icon {
        transition: transform 0.2s ease;
        color: var(--text-secondary);
}

.chevron-icon.expanded {
        transform: rotate(180deg);
}

.visibility-options {
        border-top: 1px solid var(--border-color);
        padding: 15px;
}

.visibility-mode-selector {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 20px;
}

.radio-option {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
}

.radio-option input[type="radio"] {
        accent-color: var(--accent-primary);
}

.radio-text {
        color: var(--text-primary);
}

.selection-header {
        font-weight: 600;
        margin-bottom: 10px;
        color: var(--text-primary);
}

.checkbox-list {
        max-height: 200px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 8px;
}

.checkbox-item {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        padding: 5px 0;
}

.checkbox-item input[type="checkbox"] {
        accent-color: var(--accent-primary);
}

.friend-item {
        display: flex;
        align-items: center;
        gap: 10px;
}

.friend-item .avatar {
        width: 32px;
        height: 32px;
        font-size: 14px;
}

.checkbox-text {
        color: var(--text-primary);
}

.modal-footer {
        display: flex;
        gap: 10px;
        padding-top: 15px;
        border-top: 1px solid var(--border-color);
}

.cancel-btn {
        flex: 1;
        padding: 12px;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        background: var(--bg-secondary);
        color: var(--text-primary);
        font-size: 16px;
        cursor: pointer;
}

.cancel-btn:hover {
        background: var(--bg-primary);
}

.publish-btn {
        flex: 1;
        padding: 12px;
        border: none;
        border-radius: 8px;
        background: var(--accent-primary);
        color: white;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
}

.publish-btn:disabled {
        background: var(--text-secondary);
        cursor: not-allowed;
}

.publish-btn:not(:disabled):hover {
        background: var(--accent-darker);
}
</style>
