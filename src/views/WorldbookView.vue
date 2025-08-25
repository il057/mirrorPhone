<template>
        <div class="page-container">
                <AppHeader title="世界书">
                        <template #right>
                                <button @click="isDropdownOpen = true" class="header-action-button">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                                stroke-linecap="round" stroke-linejoin="round">
                                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                        </svg>
                                </button>
                        </template>
                </AppHeader>

                <main class="content-area">
                        <div class="empty-state">
                                <p>你的世界书空空如也。</p>
                                <button @click="handleDropdownAction('addWorldbook')">创建第一本世界书</button>
                        </div>
                </main>

                <DropdownMenu :is-open="isDropdownOpen" @close="isDropdownOpen = false">
                        <li @click="handleDropdownAction('addWorldbook')">新建世界书</li>
                        <li @click="handleDropdownAction('manageGroups')">管理分组</li>
                </DropdownMenu>
        </div>
</template>

<script setup>
import { ref } from 'vue';
import AppHeader from '../components/layout/Header.vue';
import DropdownMenu from '../components/ui/DropdownMenu.vue';
import { showManageGroupsModal, showToast } from '../services/uiService.js';

const isDropdownOpen = ref(false);

const handleDropdownAction = (action) => {
        isDropdownOpen.value = false; // Close dropdown after action
        switch (action) {
                case 'manageGroups':
                        showManageGroupsModal('worldbookGroups');
                        break;
                case 'addWorldbook':
                        showToast('新建世界书功能待开发', 'info');
                        break;
                default:
                        showToast(`${action} 功能待开发`, 'info');
                        break;
        }
};
</script>

<style scoped>

.content-area {
        flex-grow: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        justify-content: center;
        align-items: center;
}

.empty-state {
        text-align: center;
        color: var(--text-secondary);
}

.empty-state button {
        margin-top: 15px;
        padding: 8px 16px;
        background-color: var(--accent-primary);
        color: var(--text-inverse);
        border: none;
        border-radius: 999px;
        font-weight: 600;
        cursor: pointer;
}

.header-action-button {
        color: var(--text-primary);
        background: none;
        border: none;
        padding: 5px;
        cursor: pointer;
}
</style>