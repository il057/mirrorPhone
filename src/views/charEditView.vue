<template>
        <div class="edit-page-container">
                <AppHeader :title="isNew ? '创建新角色' : '编辑资料'">
                        <template #right>
                                <button @click="saveChanges" class="header-action-button">保存</button>
                        </template>
                </AppHeader>

                <main class="edit-content content" v-if="actor">
                        <section class="form-section avatar-section">
                                <div class="avatar-wrapper">
                                        <div class="avatar">
                                                <span class="avatar-initial">{{ getInitial(actor.name) }}</span>
                                        </div>
                                </div>
                                <p class="avatar-prompt">更换头像</p>
                        </section>

                        <section class="form-section">
                                <div class="form-group">
                                        <label for="nickname">昵称</label>
                                        <input id="nickname" type="text" v-model="actor.name" placeholder="必填" />
                                </div>
                                <div class="form-group">
                                        <label for="realName">名字</label>
                                        <input id="realName" type="text" v-model="actor.realName" />
                                </div>
                                <div class="form-group">
                                        <label for="birthday">生日</label>
                                        <input id="birthday" type="date" v-model="actor.birthday" />
                                </div>
                                <div class="form-group">
                                        <label for="gender">性别</label>
                                        <select id="gender" v-model="actor.gender">
                                                <option>男</option>
                                                <option>女</option>
                                                <option>未知</option>
                                                <option value="custom">自定义...</option>
                                        </select>
                                </div>
                                <div class="form-group">
                                        <label for="group">分组</label>
                                        <select id="group" v-model="actor.groupIds[0]">
                                                <option :value="undefined">未分组</option>
                                                <option v-for="group in availableGroups" :key="group.id"
                                                        :value="group.id">{{ group.name
                                                        }}</option>
                                                <option value="new_group">新建分组...</option>
                                        </select>
                                </div>
                        </section>

                        <section class="form-section">
                                <div class="form-group textarea-group">
                                        <label for="persona">人设 (Persona)</label>
                                        <textarea id="persona" v-model="actor.persona" rows="8"></textarea>
                                </div>
                        </section>

                        <section class="form-section placeholder-section">
                                <h2>语音设定</h2>
                                <p>此功能待开发。</p>
                        </section>
                        <section class="form-section placeholder-section">
                                <h2>单人世界书</h2>
                                <p>此功能待开发。</p>
                        </section>
                        <section class="form-section placeholder-section">
                                <h2>上下文记忆条数</h2>
                                <p>此功能待开发。</p>
                        </section>

                        <section v-if="isNew" class="form-section placeholder-section">
                                <h2>初始关系设定</h2>
                                <p>此功能待开发。</p>
                        </section>
                        <section v-else class="form-section placeholder-section">
                                <h2>好感印象</h2>
                                <p>此功能待开发。</p>
                        </section>
                        <section class="form-section placeholder-section">
                                <h2>记忆摘要管理</h2>
                                <p>此功能待开发。</p>
                        </section>
                        <section class="form-section placeholder-section">
                                <h2>聊天背景</h2>
                                <p>此功能待开发。</p>
                        </section>
                        <section class="form-section placeholder-section">
                                <h2>聊天气泡样式</h2>
                                <p>此功能待开发。</p>
                        </section>

                        <section v-if="!isNew" class="form-section danger-zone">
                                <button class="danger-btn">拉黑</button>
                                <button class="danger-btn">清空聊天记录</button>
                                <button @click="deleteCharacter" class="danger-btn delete">删除角色</button>
                        </section>
                </main>
        </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useObservable } from '@vueuse/rxjs';
import { liveQuery } from 'dexie';
import db from '../services/database.js';
import AppHeader from '../components/layout/Header.vue';
import { showToast, showConfirm } from '../services/uiService.js';

const route = useRoute();
const router = useRouter();

const actorId = ref(route.params.id);
const isNew = computed(() => !actorId.value);

const actor = ref(null);

const availableGroups = useObservable(
        liveQuery(() => db.groups.filter(g => g.id !== 'group_special').toArray()),
        { initialValue: [] }
);

const getInitial = (name) => {
        if (!name) return '#';
        return name.charAt(0).toUpperCase();
};

watch(() => actor.value?.gender, (newGender) => {
        if (newGender === 'custom') {
                const customGender = prompt('请输入自定义性别:');
                actor.value.gender = customGender || '';
        }
});

watch(() => actor.value?.groupIds, async (newVal) => {
        const selectedGroup = newVal ? newVal[0] : undefined;
        if (selectedGroup === 'new_group') {
                const groupName = prompt('请输入新分组的名称:');
                if (groupName) {
                        try {
                                const maxOrderGroup = await db.groups.orderBy('order').last();
                                const newOrder = (maxOrderGroup?.order || 0) + 1;
                                const newId = `group_${Date.now()}`;
                                await db.groups.add({ id: newId, name: groupName, order: newOrder, worldbookIds: [] });
                                actor.value.groupIds = [newId];
                                showToast('分组已创建', 'success');
                        } catch (error) {
                                showToast(`创建失败: ${error.message}`, 'error');
                                actor.value.groupIds = [];
                        }
                } else {
                        actor.value.groupIds = [];
                }
        }
}, { deep: true });

onMounted(async () => {
        if (isNew.value) {
                actor.value = {
                        name: '',
                        realName: '',
                        birthday: '',
                        gender: '男',
                        groupIds: [],
                        persona: '',
                        specialCare: 0,
                        isGroup: 0
                };
        } else {
                const data = await db.actors.get(actorId.value);
                if (data) {
                        actor.value = { ...data };
                        if (!Array.isArray(actor.value.groupIds)) {
                                actor.value.groupIds = [];
                        }
                } else {
                        showToast('找不到该角色', 'error');
                        router.push('/');
                }
        }
});

const saveChanges = async () => {
        if (!actor.value.name) {
                showToast('昵称不能为空', 'error');
                return;
        }
        try {
                const dataToSave = { ...actor.value };
                dataToSave.groupIds = dataToSave.groupIds?.[0] ? [dataToSave.groupIds[0]] : [];
                if (isNew.value) {
                        dataToSave.id = `char_${Date.now()}`;
                        await db.actors.add(dataToSave);
                        showToast('角色创建成功', 'success');
                        router.push(`/profile/${dataToSave.id}`);
                } else {
                        await db.actors.put(dataToSave);
                        showToast('资料保存成功', 'success');
                        router.push(`/profile/${actorId.value}`);
                }
        } catch (error) {
                showToast(`保存失败: ${error.message}`, 'error');
                console.error(error);
        }
};

const deleteCharacter = async () => {
        const confirmed = await showConfirm(
                '删除角色',
                `确定要永久删除角色 "${actor.value.name}" 吗？所有相关数据（聊天记录、记忆等）都将被清除，此操作无法撤销。`
        );
        if (confirmed) {
                try {
                        await db.transaction('rw', db.actors, db.conversations, db.events, db.relationships, db.memories, async () => {
                                const id = actorId.value;
                                await db.actors.delete(id);
                                await db.conversations.delete(id);
                                await db.events.where({ actorId: id }).delete();
                                await db.events.where({ contextId: id }).delete();
                                await db.relationships.where({ sourceId: id }).or('targetId').equals(id).delete();
                                await db.memories.where({ actorId: id }).delete();
                        });
                        showToast('角色已删除', 'success');
                        router.push('/chat/contacts');
                } catch (error) {
                        showToast(`删除失败: ${error.message}`, 'error');
                        console.error(error);
                }
        }
};
</script>

<style scoped>
.edit-page-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
        background-color: var(--bg-primary);
}

.header-action-button {
        font-size: 16px;
        font-weight: 600;
        color: var(--accent-primary);
        background: none;
        border: none;
        cursor: pointer;
}

.edit-content {
        flex-grow: 1;
        overflow-y: auto;
        padding: 20px;
        padding-top: calc(var(--header-height) + 20px);
        padding-bottom: 50px;
}

.form-section {
        background-color: var(--bg-card);
        border-radius: 8px;
        padding: 0 15px;
        margin-bottom: 20px;
}

.avatar-section {
        background: none;
        padding: 0;
        text-align: center;
        margin-bottom: 30px;
}

.avatar-wrapper .avatar {
        width: 100px;
        height: 100px;
        border-radius: 12px;
        background-color: #555;
        display: flex;
        justify-content: center;
        align-items: center;
        font-weight: bold;
        margin: 0 auto;
}

.avatar-initial {
        color: var(--accent-primary);
        font-size: 50px;
}

.avatar-prompt {
        color: var(--accent-primary);
        font-size: 14px;
        margin-top: 10px;
        cursor: pointer;
}

.form-group {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid var(--border-color);
}

.form-section .form-group:last-child {
        border-bottom: none;
}

.textarea-group {
        flex-direction: column;
        align-items: flex-start;
}

.form-group label {
        color: var(--text-primary);
}

.form-group input,
.form-group select,
.form-group textarea {
        flex-grow: 1;
        padding: 8px;
        border-radius: 4px;
        border: none;
        background-color: transparent;
        color: var(--text-secondary);
        text-align: right;
        font-size: 16px;
}

.form-group input::placeholder {
        color: #555;
}

.form-group textarea {
        width: 100%;
        box-sizing: border-box;
        text-align: left;
        background-color: var(--bg-primary);
        margin-top: 10px;
        height: 120px;
        color: var(--text-primary);
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
        outline: none;
}

.placeholder-section {
        padding: 15px;
        text-align: center;
        color: var(--text-secondary);
}

.placeholder-section h2 {
        font-size: 16px;
        margin: 0 0 5px 0;
}

.danger-zone {
        background: none;
        padding: 0;
}

.danger-btn {
        width: 100%;
        text-align: center;
        padding: 15px;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;
        background-color: var(--bg-card);
        color: var(--text-primary);
        margin-bottom: 10px;
}

.danger-btn.delete {
        color: #f44336;
}
</style>