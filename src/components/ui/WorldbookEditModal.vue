<template>
        <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
                <div class="modal-content worldbook-modal">
                        <div class="modal-header">
                                <h3>{{ isEditing ? '编辑世界书' : '新建世界书' }}</h3>
                        </div>
                        
                        <div class="modal-body">
                                <div class="form-group">
                                        <label>世界书名称</label>
                                        <input 
                                                type="text" 
                                                v-model.trim="formData.name" 
                                                placeholder="输入世界书名称"
                                                class="modal-input"
                                        />
                                </div>

                                <div class="form-group">
                                        <label>分组</label>
                                        <div class="group-selector">
                                                <MainDropdown
                                                        v-model="formData.groupId"
                                                        :options="groupOptions"
                                                        placeholder="选择分组"
                                                />
                                                <button @click="openGroupManagement" class="group-manage-btn">
                                                        管理分组
                                                </button>
                                        </div>
                                </div>

                                <div class="form-group form-group-compact">
                                        <label>触发类型</label>
                                        <div class="segmented-control">
                                                <label :class="{ active: formData.type === 'always' }">
                                                        <input 
                                                                type="radio" 
                                                                v-model="formData.type" 
                                                                value="always"
                                                        />
                                                        <span>始终触发</span>
                                                </label>
                                                <label :class="{ active: formData.type === 'keywords' }">
                                                        <input 
                                                                type="radio" 
                                                                v-model="formData.type" 
                                                                value="keywords"
                                                        />
                                                        <span>关键词触发</span>
                                                </label>
                                        </div>
                                </div>

                                <div v-if="formData.type === 'keywords'" class="form-group form-group-compact">
                                        <label>关键词（用逗号分隔）</label>
                                        <input 
                                                type="text" 
                                                v-model.trim="formData.keywords" 
                                                placeholder="关键词1,关键词2,关键词3"
                                                class="modal-input"
                                        />
                                </div>

                                <div class="form-group">
                                        <label>内容</label>
                                        <textarea 
                                                v-model="formData.content" 
                                                placeholder="输入世界书内容..."
                                                class="modal-input content-textarea"
                                                rows="8"
                                        ></textarea>
                                </div>
                        </div>

                        <div class="modal-actions">
                                <button @click="closeModal" class="modal-btn cancel">取消</button>
                                <button @click="saveWorldbook" class="modal-btn confirm" :disabled="!canSave">
                                        {{ isEditing ? '保存' : '创建' }}
                                </button>
                        </div>
                </div>
        </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import MainDropdown from './MainDropdown.vue';
import db from '../../services/database';
import { showToast, showManageGroupsModal } from '../../services/uiService';
import { useObservable } from '@vueuse/rxjs';
import { liveQuery } from 'dexie';

const props = defineProps({
        isOpen: Boolean,
        worldbook: Object, // 编辑时传入的世界书数据
        onClose: Function,
        onSave: Function
});

const emit = defineEmits(['close', 'save']);

const isEditing = computed(() => !!props.worldbook);

const formData = ref({
        name: '',
        content: '',
        type: 'always',
        keywords: '',
        groupId: ''
});

// 获取分组列表
const groups = ref([]);
const groupsObservable = useObservable(
        liveQuery(() => db.worldbookGroups.orderBy('name').toArray())
);
watch(groupsObservable, (newGroups) => {
        if (newGroups) {
                groups.value = newGroups;
        }
}, { immediate: true });

// 转换为MainDropdown所需的格式
const groupOptions = computed(() => {
        return groups.value.map(group => ({
                label: group.name,
                value: group.id
        }));
});

// 初始化表单数据
watch(() => props.worldbook, (worldbook) => {
        if (worldbook) {
                formData.value = {
                        name: worldbook.name || '',
                        content: worldbook.content || '',
                        type: worldbook.type || 'always',
                        keywords: worldbook.keywords || '',
                        groupId: worldbook.groupId || ''
                };
        } else {
                formData.value = {
                        name: '',
                        content: '',
                        type: 'always',
                        keywords: '',
                        groupId: ''
                };
        }
}, { immediate: true });

// 验证表单是否可以保存
const canSave = computed(() => {
        if (!formData.value.name.trim()) return false;
        if (!formData.value.groupId) return false;
        if (formData.value.type === 'keywords' && !formData.value.keywords.trim()) return false;
        return true;
});

// 解析关键词
const parseKeywords = (keywordsStr) => {
        if (!keywordsStr) return [];
        // 支持中文逗号和英文逗号
        return keywordsStr.split(/[，,]/).map(k => k.trim()).filter(k => k);
};

// 保存世界书
const saveWorldbook = async () => {
        if (!canSave.value) {
                showToast('请填写完整信息', 'error');
                return;
        }

        try {
                const now = new Date().toISOString();
                const worldbookData = {
                        name: formData.value.name,
                        content: formData.value.content,
                        type: formData.value.type,
                        keywords: formData.value.type === 'keywords' ? parseKeywords(formData.value.keywords).join(',') : '',
                        groupId: formData.value.groupId,
                        updateTime: now
                };

                if (isEditing.value) {
                        // 编辑模式
                        await db.worldbooks.update(props.worldbook.id, worldbookData);
                        showToast('世界书已更新', 'success');
                } else {
                        // 新建模式
                        const newId = `worldbook_${Date.now()}`;
                        await db.worldbooks.add({
                                id: newId,
                                ...worldbookData,
                                createTime: now
                        });
                        showToast('世界书已创建', 'success');
                }

                if (props.onSave) {
                        props.onSave();
                }
                emit('save');
                closeModal();
        } catch (error) {
                console.error('保存世界书失败:', error);
                showToast('保存失败', 'error');
        }
};

// 打开分组管理
const openGroupManagement = () => {
        showManageGroupsModal('worldbookGroups');
};

// 关闭模态框
const closeModal = () => {
        if (props.onClose) {
                props.onClose();
        }
        emit('close');
};
</script>

<style scoped>
.worldbook-modal {
        max-width: 500px;
        width: 95%;
        max-height: 85vh;
        padding: 0;
        text-align: left;
}

.modal-header {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 15px 20px;
        border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
        margin: 0;
        font-size: 18px;
        text-align: center;
}

.modal-body {
        padding: 20px;
        max-height: 60vh;
        overflow-y: auto;
}

.form-group {
        margin-bottom: 20px;
}

.form-group-compact {
        margin-bottom: 15px;
}

.form-group label {
        display: block;
        margin-bottom: 8px;
        color: var(--text-primary);
        font-weight: 500;
        text-align: left;
}

.group-selector {
        display: flex;
        gap: 10px;
        align-items: center;
}

.group-selector select {
        flex: 1;
}

.group-manage-btn {
        margin-top: 10px;
        background: none;
        border: 1px solid var(--border-color);
        color: var(--text-secondary);
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        white-space: nowrap;
        height: 44px;
}

.group-manage-btn:hover {
        background-color: var(--bg-secondary);
        color: var(--accent-primary);
}

.keywords-help {
        font-size: 12px;
        color: var(--text-secondary);
        margin-top: 5px;
        text-align: left;
}

.content-textarea {
        resize: vertical;
        min-height: 150px;
        font-family: inherit;
        line-height: 1.5;
}

.modal-actions {
        padding: 15px 20px;
        border-top: 1px solid var(--border-color);
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
}

.modal-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
}

.segmented-control label {
        margin-bottom: 0;
        text-align: center;
}
</style>
