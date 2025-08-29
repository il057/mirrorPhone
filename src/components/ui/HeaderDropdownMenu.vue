<template>
        <div v-if="isOpen" class="dropdown-overlay" @click.self="$emit('close')">
                <div class="dropdown-menu">
                        <ul>
                                <slot></slot>
                        </ul>
                </div>
        </div>
</template>

<script setup>
defineProps({
        isOpen: Boolean,
});
defineEmits(['close']);
</script>

<style scoped>
.dropdown-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 201;
        /* Below modal overlay */
}

.dropdown-menu {
        position: absolute;
        top: calc(var(--header-height) - 10px);
        right: 15px;
        background-color: var(--bg-card);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        width: 150px;
        overflow: hidden;
        border: 1px solid var(--border-color);
        text-align: center;
}

.dropdown-menu ul {
        list-style: none;
        padding: 5px 0;
        margin: 0;
}

/* Use :deep() to style slotted list items from the parent */
:deep(li) {
        padding: 10px 15px;
        cursor: pointer;
        font-size: 14px;
        color: var(--text-primary);
        transition: background-color 0.2s ease;
}

:deep(li:hover) {
        background-color: var(--bg-secondary);
        color: var(--accent-primary);
}
</style>
