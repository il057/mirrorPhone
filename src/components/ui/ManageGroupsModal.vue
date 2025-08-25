<template>
        <transition name="modal-fade">
                <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
                        <div class="modal-content">
                                <div class="modal-header">
                                        <h3>管理分组</h3>
                                        <button @click="beginAddNewGroup" class="new-group-btn">新建分组</button>
                                </div>
                                <div class="modal-body">
                                        <ul class="group-list">
                                                <li v-if="isAdding" class="group-item">
                                                        <input ref="newGroupInput" type="text"
                                                                v-model.trim="newGroupName" placeholder="输入分组名"
                                                                @keyup.enter="saveNewGroup" />
                                                        <div class="actions">
                                                                <button @click="saveNewGroup"
                                                                        class="save-btn">保存</button>
                                                        </div>
                                                </li>
                                                <li v-for="group in groups" :key="group.id" class="group-item">
                                                        <template v-if="editingGroupId === group.id">
                                                                <input type="text" v-model="editingGroupName" />
                                                                <div class="actions">
                                                                        <button @click="saveEdit(group)"
                                                                                class="save-btn">保存</button>
                                                                </div>
                                                        </template>
                                                        <template v-else>
                                                                <span>{{ group.name }}</span>
                                                                <div class="actions">
                                                                        <button @click="startEdit(group)">编辑</button>
                                                                        <button @click="deleteGroup(group)"
                                                                                class="delete-btn">删除</button>
                                                                </div>
                                                        </template>
                                                </li>
                                        </ul>
                                </div>
                                <button @click="closeModal" class="close-modal-btn">完成</button>
                        </div>
                </div>
        </transition>
</template>

<script setup>
import { ref, nextTick, watchEffect } from 'vue';
import db from '../../services/database';
import { useObservable } from '@vueuse/rxjs';
import { liveQuery } from 'dexie';
import { showToast, showConfirm } from '../../services/uiService';

const props = defineProps({
        isOpen: Boolean,
        onClose: Function,
        groupTable: {
                type: String,
                required: true,
                validator: (value) => ['groups', 'worldbookGroups'].includes(value)
        }
});

const emit = defineEmits(['close']);

const isAdding = ref(false);
const newGroupName = ref('');
const newGroupInput = ref(null);
const editingGroupId = ref(null);
const editingGroupName = ref('');

const groups = ref([]);
watchEffect(() => {
        if (props.groupTable && db[props.groupTable]) {
                // 条件化查询：只有当表是 'groups' 时才按 'order' 排序
                const query = props.groupTable === 'groups'
                        ? db[props.groupTable].orderBy('order')
                        : db[props.groupTable].orderBy('name'); // worldbookGroups 按名称排序

                const observable = useObservable(
                        liveQuery(() =>
                                query
                                        .filter(group => group.id !== 'group_special') // 仍然排除特殊分组
                                        .toArray()
                        )
                );
                watchEffect(() => {
                        groups.value = observable.value;
                });
        }
});


const beginAddNewGroup = async () => {
        isAdding.value = true;
        await nextTick();
        newGroupInput.value?.focus();
};

const saveNewGroup = async () => {
        if (!newGroupName.value) {
                showToast('分组名不能为空', 'error');
                return;
        }
        try {
                const table = db[props.groupTable];
                const newId = `${props.groupTable}_${Date.now()}`;

                const newGroupData = {
                        id: newId,
                        name: newGroupName.value,
                };

                // 条件化添加 order 字段
                if (props.groupTable === 'groups') {
                        const maxOrderGroup = await table.orderBy('order').last();
                        newGroupData.order = (maxOrderGroup?.order || 0) + 1;
                }

                await table.add(newGroupData);

                showToast('分组已添加', 'success');
                newGroupName.value = '';
                isAdding.value = false;
        } catch (error) {
                showToast(`添加失败: ${error.message}`, 'error');
                console.error(error);
        }
};

const startEdit = (group) => {
        editingGroupId.value = group.id;
        editingGroupName.value = group.name;
};

const saveEdit = async (group) => {
        if (!editingGroupName.value) {
                showToast('分组名不能为空', 'error');
                return;
        }
        await db[props.groupTable].update(group.id, { name: editingGroupName.value });
        editingGroupId.value = null;
        editingGroupName.value = '';
        showToast('修改已保存', 'success');
};

const deleteGroup = async (group) => {
        const confirmed = await showConfirm('删除分组', `确定要删除分组 "${group.name}" 吗？`);
        if (confirmed) {
                await db[props.groupTable].delete(group.id);
                showToast('分组已删除', 'success');
        }
};

const closeModal = () => {
        isAdding.value = false;
        editingGroupId.value = null;
        if (props.onClose) {
                props.onClose();
        }
        emit('close');
};
</script>

<style scoped>
/* 样式保持不变 */
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
}

.modal-content {
        background-color: var(--bg-card);
        padding: 0;
        border-radius: 12px;
        width: 95%;
        max-width: 450px;
        text-align: left;
}

.modal-header {
        padding: 15px 20px;
        border-bottom: 1px solid var(--border-color);
        display: flex;
        justify-content: space-between;
        align-items: center;
}

.modal-header h3 {
        margin: 0;
        font-size: 16px;
}

.new-group-btn {
        background: none;
        border: none;
        color: var(--accent-primary);
        font-size: 14px;
        cursor: pointer;
}

.modal-body {
        padding: 10px 0;
        max-height: 60vh;
        overflow-y: auto;
}

.group-list {
        list-style: none;
        padding: 0;
        margin: 0;
}

.group-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 20px;
}

.group-item input[type="text"] {
        flex-grow: 1;
        padding: 8px;
        border-radius: 4px;
        border: 1px solid var(--border-color);
        background-color: var(--bg-primary);
        color: var(--text-primary);
        font-size: 14px;
}

.actions button {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        font-size: 14px;
        margin-left: 15px;
}

.actions .save-btn {
        color: var(--accent-primary);
        font-weight: bold;
}

.actions .delete-btn {
        color: #f44336;
}

.close-modal-btn {
        width: 100%;
        padding: 15px;
        border: none;
        background-color: var(--bg-secondary);
        color: var(--accent-primary);
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        border-top: 1px solid var(--border-color);
        border-radius: 0 0 12px 12px;
}
</style>