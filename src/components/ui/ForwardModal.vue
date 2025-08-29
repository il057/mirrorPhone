<template>
        <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
                <div class="modal-content forward-modal">
                        <div class="modal-header">
                                <h3>选择转发对象</h3>
                                <button class="close-btn" @click="handleClose">&times;</button>
                        </div>

                        <div class="modal-body">
                                <div class="preview-section">
                                        <h4>转发预览 ({{ messageCount }} 条消息)</h4>
                                        <div class="preview-card">
                                                <div class="preview-title">{{ currentCharName }}和{{ userPersonaName }}的消息</div>
                                                <div class="preview-messages">
                                                        <div v-for="(msg, index) in previewMessages" :key="index" class="preview-message">
                                                                {{ getAuthorName(msg) }}：{{ getMessageContent(msg) }}
                                                        </div>
                                                        <div v-if="messageCount > previewMessages.length" class="more-messages">
                                                                还有 {{ messageCount - previewMessages.length }} 条消息...
                                                        </div>
                                                </div>
                                        </div>
                                </div>

                                <div class="characters-section">
                                        <h4>选择接收角色</h4>
                                        <div class="characters-list">
                                                <div
                                                        v-for="character in availableCharacters"
                                                        :key="character.id"
                                                        class="character-item"
                                                        :class="{ selected: selectedCharacter?.id === character.id }"
                                                        @click="selectCharacter(character)"
                                                >
                                                        <div class="character-avatar">
                                                                <img v-if="character.currentAvatar" :src="character.currentAvatar" :alt="character.name" />
                                                                <div v-else class="avatar-placeholder">{{ character.name.charAt(0) }}</div>
                                                        </div>
                                                        <div class="character-info">
                                                                <div class="character-name">{{ character.name }}</div>
                                                                <div class="character-description">{{ character.description || '暂无描述' }}</div>
                                                        </div>
                                                </div>
                                        </div>
                                </div>
                        </div>

                        <div class="modal-footer">
                                <button class="btn btn-secondary" @click="handleClose">取消</button>
                                <button 
                                        class="btn btn-primary" 
                                        @click="handleForward"
                                        :disabled="!selectedCharacter"
                                >
                                        转发
                                </button>
                        </div>
                </div>
        </div>
</template> 
				

<script setup>
import { ref, computed, onMounted } from 'vue';
import db from '../../services/database.js';
import { getUserPersonaForGroup } from '../../services/userPersonaService.js';

const props = defineProps({
        visible: {
                type: Boolean,
                default: false
        },
        messages: {
                type: Array,
                default: () => []
        },
        currentCharName: {
                type: String,
                default: ''
        },
        currentCharId: {
                type: String,
                default: ''
        }
});

const emit = defineEmits(['close', 'forward']);

const selectedCharacter = ref(null);
const availableCharacters = ref([]);
const userPersonaName = ref('用户');

// 计算消息数量
const messageCount = computed(() => props.messages.length);

// 预览消息（只显示前2条）
const previewMessages = computed(() => {
        return props.messages.slice(0, 2);
});

// 获取作者名称
const getAuthorName = (message) => {
        if (message.actorId === '__USER__') {
                return userPersonaName.value || '你';
        } else if (message.actorId === 'system') {
                return '系统';
        } else {
                // 从availableCharacters和当前角色中查找角色名称
                if (message.actorId === props.currentCharId) {
                        return props.currentCharName;
                }
                const char = availableCharacters.value.find(c => c.id === message.actorId);
                return char?.name || message.actorId;
        }
};

// 获取消息内容
const getMessageContent = (message) => {
        if (message.content?.type === 'text') {
                return message.content.content || message.content.text || '[消息]';
        } else if (message.content?.type === 'voice_message') {
                return '[语音消息]';
        } else if (message.content?.type === 'payment') {
                const paymentType = message.content.subtype === 'transfer' ? '转账' : '代付';
                return `[${paymentType}: ¥${message.content.amount || 0}]`;
        } else if (message.content?.type === 'music-card') {
                const song = message.content.song || {};
                return `[音乐分享: ${song.name || '歌曲'}]`;
        } else if (message.content?.type === 'call') {
                const callType = message.content.callType === 'voice' ? '语音' : '视频';
                return `[${callType}通话邀请]`;
        } else if (message.content?.type === 'pat') {
                return `[拍一拍: ${message.content.message || '拍了拍'}]`;
        } else if (message.content?.type === 'system') {
                return message.content.content || '[系统消息]';
        } else {
                return message.content?.content || message.content?.text || '[消息]';
        }
};

// 加载可用角色
const loadAvailableCharacters = async () => {
        try {
                // 获取当前角色信息
                const currentActor = await db.actors.get(props.currentCharId);
                if (!currentActor) {
                        console.error('当前角色不存在');
                        return;
                }
                
                // 获取当前角色的分组ID
                const currentGroupIds = currentActor.groupIds || [];
                
                // 获取所有非群组角色
                const actors = await db.actors.where('isGroup').equals(0).toArray();
                
                // 过滤角色：1) 不是当前角色 2) 在相同分组中
                availableCharacters.value = actors.filter(actor => {
                        // 排除当前角色
                        if (actor.id === props.currentCharId) {
                                return false;
                        }
                        
                        // 如果当前角色没有分组，则不能转发给任何角色
                        if (currentGroupIds.length === 0) {
                                return false;
                        }
                        
                        // 检查是否有共同的分组
                        const actorGroupIds = actor.groupIds || [];
                        const hasCommonGroup = currentGroupIds.some(groupId => 
                                actorGroupIds.includes(groupId)
                        );
                        
                        return hasCommonGroup;
                });
        } catch (error) {
                console.error('加载角色列表失败:', error);
        }
};

// 加载用户人格名称
const loadUserPersona = async () => {
        try {
                // 获取当前角色信息
                const currentActor = await db.actors.get(props.currentCharId);
                if (!currentActor) {
                        console.error('当前角色不存在');
                        userPersonaName.value = '用户';
                        return;
                }
                
                // 获取当前角色的分组ID
                const currentGroupIds = currentActor.groupIds || [];
                
                if (currentGroupIds.length > 0) {
                        // 使用第一个分组ID获取用户人格
                        const persona = await getUserPersonaForGroup(currentGroupIds[0]);
                        userPersonaName.value = persona?.name || '用户';
                } else {
                        // 没有分组时使用默认名称
                        userPersonaName.value = '用户';
                }
        } catch (error) {
                console.error('加载用户人格失败:', error);
                userPersonaName.value = '用户';
        }
};

// 选择角色
const selectCharacter = (character) => {
        selectedCharacter.value = character;
};

// 处理关闭
const handleClose = () => {
        selectedCharacter.value = null;
        emit('close');
};

// 处理遮罩点击
const handleOverlayClick = (event) => {
        if (event.target.classList.contains('modal-overlay')) {
                handleClose();
        }
};

// 处理转发
const handleForward = () => {
        if (!selectedCharacter.value) {
                return;
        }
        
        emit('forward', {
                targetCharacter: selectedCharacter.value,
                messages: props.messages,
                currentCharName: props.currentCharName,
                userPersonaName: userPersonaName.value
        });
        
        handleClose();
};

// 组件挂载时加载数据
onMounted(() => {
        loadAvailableCharacters();
        loadUserPersona();
});
</script>

<style scoped>

.forward-modal {
        width: 90%;
        max-width: 500px;
        max-height: 80vh;
        background: var(--bg-card);
        border-radius: 12px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
}

.modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
        margin: 0;
        color: var(--text-color);
        font-size: 18px;
}

.close-btn {
        background: none;
        border: none;
        font-size: 24px;
        color: var(--text-color);
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
        padding: 20px;
}

.preview-section {
        margin-bottom: 24px;
}

.preview-section h4 {
        margin: 0 0 12px 0;
        color: var(--text-color);
        font-size: 16px;
}

.preview-card {
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 12px;
        background: var(--chat-bg);
}

.preview-title {
        font-weight: 600;
        color: var(--text-color);
        margin-bottom: 8px;
        font-size: 14px;
}

.preview-messages {
        max-height: 120px;
        overflow-y: auto;
}

.preview-message {
        padding: 4px 0;
        color: var(--text-secondary);
        font-size: 13px;
        border-bottom: 1px solid var(--border-color);
}

.preview-message:last-child {
        border-bottom: none;
}

.more-messages {
        padding: 8px 0 4px 0;
        color: var(--text-tertiary);
        font-size: 12px;
        font-style: italic;
}

.characters-section h4 {
        margin: 0 0 16px 0;
        color: var(--text-color);
        font-size: 16px;
}

.characters-list {
        max-height: 300px;
        overflow-y: auto;
}

.character-item {
        display: flex;
        align-items: center;
        padding: 12px;
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 0.2s;
        margin-bottom: 8px;
        border: 2px solid transparent;
}

.character-item:hover {
        background: var(--hover-bg);
}

.character-item.selected {
        border-color: var(--primary-color);
        background: var(--primary-bg);
}

.character-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        margin-right: 12px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
}

.character-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
}

.avatar-placeholder {
        width: 100%;
        height: 100%;
        background: var(--primary-color);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 16px;
}

.character-info {
        flex: 1;
}

.character-name {
        font-weight: 600;
        color: var(--text-color);
        margin-bottom: 4px;
}

.character-description {
        color: var(--text-secondary);
        font-size: 13px;
        line-height: 1.4;
}

.modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 16px 20px;
        border-top: 1px solid var(--border-color);
}

.btn {
        padding: 8px 16px;
        border-radius: 6px;
        border: none;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s;
}

.btn-secondary {
        background: var(--button-secondary-bg);
        color: var(--text-color);
}

.btn-secondary:hover {
        background: var(--button-secondary-hover);
}

.btn-primary {
        background: var(--primary-color);
        color: white;
}

.btn-primary:hover:not(:disabled) {
        background: var(--primary-hover);
}

.btn-primary:disabled {
        background: var(--disabled-bg);
        color: var(--disabled-color);
        cursor: not-allowed;
}
</style>
