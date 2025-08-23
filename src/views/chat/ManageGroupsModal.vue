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
import { ref, nextTick } from 'vue';
import db from '../../services/database';
import { useObservable } from '@vueuse/rxjs';
import { liveQuery } from 'dexie';
import { showToast, showConfirm } from '../../services/uiService';

defineProps({
        isOpen: Boolean,
});
const emit = defineEmits(['close']);

const isAdding = ref(false);
const newGroupName = ref('');
const newGroupInput = ref(null);
const editingGroupId = ref(null);
const editingGroupName = ref('');

const groups = useObservable(
        liveQuery(() =>
                db.groups
                        .orderBy('order')
                        .filter(group => group.id !== 'group_special')
                        .toArray()
        )
);

const beginAddNewGroup = async () => {
        isAdding.value = true;
        await nextTick(); // Wait for the DOM to update
        newGroupInput.value?.focus();
};

const saveNewGroup = async () => {
        if (!newGroupName.value) {
                showToast('分组名不能为空', 'error');
                return;
        }
        try {
                const maxOrderGroup = await db.groups.orderBy('order').last();
                const newOrder = (maxOrderGroup?.order || 0) + 1;

                const newId = `group_${Date.now()}`;

                await db.groups.add({
                        id: newId, // Add the ID to the object being saved
                        name: newGroupName.value,
                        order: newOrder,
                        worldbookIds: []
                });

                showToast('分组已添加', 'success');
                newGroupName.value = '';
                isAdding.value = false;
        } catch (error) {
                showToast(`添加失败: ${error.message}`, 'error');
                console.error(error); // Log the full error for debugging
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
        await db.groups.update(group.id, { name: editingGroupName.value });
        editingGroupId.value = null;
        editingGroupName.value = '';
        showToast('修改已保存', 'success');
};

const deleteGroup = async (group) => {
        const confirmed = await showConfirm('删除分组', `确定要删除分组 "${group.name}" 吗？此操作不会删除分组内的好友。`);
        if (confirmed) {
                // Here you would also handle removing the groupId from actors, but for now we just delete the group
                await db.groups.delete(group.id);
                showToast('分组已删除', 'success');
        }
};

const closeModal = () => {
        isAdding.value = false;
        editingGroupId.value = null;
        emit('close');
};
</script>

<style scoped>
.modal-overlay {
        /* ... existing styles from main.css ... */
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