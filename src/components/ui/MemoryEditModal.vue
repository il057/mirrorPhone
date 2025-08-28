<template>
        <div v-if="isOpen" class="modal-overlay" @click="handleOverlayClick">
                <div class="modal-content" @click.stop>
                        <div class="modal-header">
                                <h3>{{ isEdit ? '编辑回忆' : '添加回忆' }}</h3>
                                <button class="close-button" @click="handleClose">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
                                                viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                        d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                </button>
                        </div>

                        <div class="modal-body">
                                <!-- 回忆类型选择 -->
                                <div class="form-group">
                                        <label>回忆类型</label>
                                        <div class="segmented-control">
                                                <label :class="{ active: formData.type === 'fact' }">
                                                        <input type="radio" v-model="formData.type" value="fact">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                                fill="currentColor" viewBox="0 0 16 16">
                                                                <path
                                                                        d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2" />
                                                                <path
                                                                        d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1z" />
                                                        </svg>
                                                        重要事实
                                                </label>
                                                <label :class="{ active: formData.type === 'date' }">
                                                        <input type="radio" v-model="formData.type" value="date">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                                fill="currentColor" viewBox="0 0 16 16">
                                                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                                                                <path
                                                                        d="M6.271 5.055a.5.5 0 0 1 .52.038L9 6.327a.5.5 0 0 1 0 .866L6.79 8.427a.5.5 0 0 1-.79-.407V5.98a.5.5 0 0 1 .271-.925z" />
                                                        </svg>
                                                        重要日期
                                                </label>
                                        </div>
                                </div>

                                <!-- 日期选择 (仅对重要日期显示) -->
                                <div v-if="formData.type === 'date'" class="form-group">
                                        <label>目标日期</label>
                                        <input v-model="formData.targetDate" type="date" class="form-input" required>
                                </div>

                                <!-- 回忆内容 -->
                                <div class="form-group">
                                        <label>{{ getContentLabel() }}</label>
                                        <textarea v-model="formData.content" :placeholder="getContentPlaceholder()"
                                                class="form-textarea" rows="3" required></textarea>
                                </div>

                                <!-- 关键词 -->
                                <div class="form-group">
                                        <label>关键词 <span class="optional">(选填)</span></label>
                                        <p class="field-description">输入1-2个日常对话中可能提到的关键词，用空格分隔</p>
                                        <input v-model="keywordsText" type="text" class="form-input"
                                                placeholder="例如：生日 礼物">
                                </div>

                                <!-- 相关角色选择 (仅从我的页面进入时显示) -->
                                <div v-if="showActorSelector" class="form-group">
                                        <label>和谁的回忆</label>
                                        <MainDropdown 
                                                v-model="formData.relatedActorId" 
                                                :options="actorOptions"
                                                placeholder="请选择角色"
                                        />
                                </div>
                        </div>

                        <div class="modal-footer">
                                <button type="button" class="button button-secondary" @click="handleClose">
                                        取消
                                </button>
                                <button type="button" class="button button-primary" @click="handleSave"
                                        :disabled="!isFormValid">
                                        {{ isEdit ? '保存' : '添加' }}
                                </button>
                        </div>
                </div>
        </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import db from '../../services/database.js';
import { createMemory, updateMemory } from '../../services/memoryService.js';
import MainDropdown from './MainDropdown.vue';

const props = defineProps({
        isOpen: {
                type: Boolean,
                default: false
        },
        memory: {
                type: Object,
                default: null
        },
        actorId: {
                type: String,
                required: true
        },
        relatedActorId: {
                type: String,
                default: null
        },
        onClose: {
                type: Function,
                required: true
        },
        onSave: {
                type: Function,
                required: true
        }
});

// 表单数据
const formData = ref({
        type: 'fact',
        content: '',
        targetDate: '',
        relatedActorId: props.relatedActorId || ''
});

// 关键词文本（用于显示和输入）
const keywordsText = ref('');

// 可用角色列表
const availableActors = ref([]);

// 角色选项 (为 MainDropdown 格式化)
const actorOptions = computed(() => {
        const options = [{ label: '不限定角色', value: '' }];
        availableActors.value.forEach(actor => {
                options.push({ label: actor.name, value: actor.id });
        });
        return options;
});

// 是否为编辑模式
const isEdit = computed(() => props.memory !== null);

// 是否显示角色选择器
const showActorSelector = computed(() => props.relatedActorId === null);

// 表单验证
const isFormValid = computed(() => {
        if (!formData.value.content.trim()) return false;
        if (formData.value.type === 'date' && !formData.value.targetDate) {
                return false;
        }
        return true;
});

// 获取内容标签文本
const getContentLabel = () => {
        switch (formData.value.type) {
                case 'fact':
                        return '回忆内容';
                case 'date':
                        return '日期描述';
                default:
                        return '内容';
        }
};

// 获取内容占位符文本
const getContentPlaceholder = () => {
        switch (formData.value.type) {
                case 'fact':
                        return '简要描述这个重要的回忆...';
                case 'date':
                        return '例如：在一起的日子、第一次见面、考试、旅行...';
                default:
                        return '输入内容...';
        }
};

// 加载可用角色
const loadAvailableActors = async () => {
        try {
                // 使用 .filter() 替代原来的 .where().and() 查询
                const actors = await db.actors.filter(actor =>
                        // 1. 确保 actor.id 存在
                        actor.id &&
                        // 2. 排除所有用户人格和特殊用户实体
                        !actor.id.startsWith('user_') && actor.id !== '__USER__' &&
                        // 3. 排除群组 (isGroup 不为 true 或 1)
                        !actor.isGroup &&
                        // 4. 排除隐藏的实体 (isHidden 不为 true 或 1)
                        !actor.isHidden
                ).toArray();

                availableActors.value = actors;
        } catch (error) {
                console.error('加载角色列表失败:', error);
        }
};

// 初始化表单数据
const initializeForm = () => {
        if (props.memory) {
                // 编辑模式 - 将旧的类型转换为新的类型
                let newType = props.memory.type;
                if (newType === 'anniversary' || newType === 'countdown') {
                        newType = 'date';
                }
                
                formData.value = {
                        type: newType,
                        content: props.memory.content,
                        targetDate: props.memory.targetDate ? new Date(props.memory.targetDate).toISOString().split('T')[0] : '',
                        relatedActorId: props.memory.relatedActorId || ''
                };
                keywordsText.value = props.memory.keywords ? props.memory.keywords.join(' ') : '';
        } else {
                // 新建模式
                formData.value = {
                        type: 'fact',
                        content: '',
                        targetDate: '',
                        relatedActorId: props.relatedActorId || ''
                };
                keywordsText.value = '';
        }
};

// 处理关闭
const handleClose = () => {
        props.onClose();
};

// 处理遮罩点击
const handleOverlayClick = () => {
        handleClose();
};

// 处理保存
const handleSave = async () => {
        try {
                // 解析关键词
                const keywords = keywordsText.value.trim() 
                        ? keywordsText.value.trim().split(/\s+/).filter(k => k.length > 0)
                        : [];

                const memoryData = {
                        actorId: props.actorId,
                        type: formData.value.type,
                        content: formData.value.content.trim(),
                        keywords: keywords,
                        targetDate: formData.value.targetDate || null,
                        relatedActorId: formData.value.relatedActorId || null
                };

                if (isEdit.value) {
                        // 更新现有回忆
                        await updateMemory(props.memory.id, memoryData);
                } else {
                        // 创建新回忆
                        await createMemory(memoryData);
                }

                props.onSave();
        } catch (error) {
                console.error('保存回忆失败:', error);
        }
};

// 监听类型变化，清除不必要的数据
watch(() => formData.value.type, (newType) => {
        if (newType === 'fact') {
                formData.value.targetDate = '';
        }
});

onMounted(() => {
        initializeForm();
        if (showActorSelector.value) {
                loadAvailableActors();
        }
});
</script>

<style scoped>
/* 模态框样式覆盖 */
.modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        padding: 20px;
        box-sizing: border-box;
}

.modal-content {
        background-color: var(--bg-card);
        border-radius: 12px;
        width: 100%;
        max-width: 500px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px 0 24px;
        border-bottom: 1px solid var(--border-color);
        margin-bottom: 20px;
        padding-bottom: 16px;
}

.modal-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary);
}

.close-button {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s ease;
}

.close-button:hover {
        color: var(--text-primary);
        background-color: rgba(255, 255, 255, 0.1);
}

.modal-body {
        padding: 0 24px 20px;
        flex: 1;
        overflow-y: auto;
        max-height: calc(90vh - 120px);
}

.form-group {
        margin-bottom: 20px;
}

.form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: var(--text-primary);
        font-size: 14px;
}

.optional {
        color: var(--text-secondary);
        font-weight: normal;
        font-size: 12px;
}

.field-description {
        margin: 4px 0 8px 0;
        font-size: 12px;
        color: var(--text-secondary);
        line-height: 1.4;
}

.form-input,
.form-textarea,
.form-select {
        width: 100%;
        padding: 12px;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        background: var(--input-bg);
        color: var(--text-primary);
        font-size: 14px;
        transition: all 0.2s ease;
        box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
        outline: none;
        border-color: var(--accent-primary);
        box-shadow: 0 0 0 2px rgba(var(--accent-primary-rgb), 0.1);
}

.form-textarea {
        resize: vertical;
        min-height: 80px;
        line-height: 1.5;
}

/* 表单元素间距 */
.form-group + .form-group {
        margin-top: 20px;
}

.modal-footer {
        padding: 16px 24px 24px;
        border-top: 1px solid var(--border-color);
        display: flex;
        justify-content: center;
        gap: 12px;
        flex-shrink: 0;
}

.button {
        padding: 10px 20px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        width: 100%;
}

.button-secondary {
        background: var(--button-secondary-bg);
        color: var(--text-primary);
        border: 1px solid var(--border-color);
}

.button-secondary:hover {
        background: var(--button-secondary-hover-bg);
}

.button-primary {
        background: var(--accent-primary);
        color: white;
}

.button-primary:hover:not(:disabled) {
        background: var(--accent-primary-hover);
}

.button-primary:disabled {
        background: var(--button-disabled-bg);
        color: var(--button-disabled-color);
        cursor: not-allowed;
        opacity: 0.6;
}

/* 响应式设计 */
@media (max-width: 480px) {
        .modal-overlay {
                padding: 10px;
        }
        
        .modal-header,
        .modal-body,
        .modal-footer {
                padding-left: 16px;
                padding-right: 16px;
        }
        
        .type-selector {
                flex-direction: column;
        }
        
        .type-option {
                flex-direction: row;
                justify-content: flex-start;
                text-align: left;
        }
        
        .modal-footer {
                flex-direction: column;
        }
        
        .button {
                width: 100%;
        }
}
</style>
