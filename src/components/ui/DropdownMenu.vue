<template>
        <div v-if="isOpen" class="dropdown-container" @click.stop>
                <div class="dropdown-menu">
                        <ul>
                                <slot></slot>
                        </ul>
                </div>
        </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';

const props = defineProps({
        isOpen: Boolean,
});

const emit = defineEmits(['close']);

// 点击外部关闭下拉菜单
const handleClickOutside = (event) => {
        if (props.isOpen) {
                emit('close');
        }
};

onMounted(() => {
        document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
        document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.dropdown-container {
        position: absolute;
        top: 100%;
        right: 0;
        z-index: 199;
}

.dropdown-menu {
        background-color: var(--bg-card);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        width: 100px;
        overflow: hidden;
        border: 1px solid var(--border-color);
        text-align: center;
        margin-top: 4px;
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
}

:deep(li:hover) {
        background-color: var(--bg-secondary);
}
</style>