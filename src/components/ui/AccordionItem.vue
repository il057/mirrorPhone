<template>
        <div class="accordion-item">
                <div class="accordion-header" @click="toggleExpanded" :class="{ expanded: isExpanded }">
                        <h3>{{ title }}</h3>
                        <svg class="accordion-icon" :class="{ rotated: isExpanded }" viewBox="0 0 24 24" width="20" height="20">
                                <path d="M7 10l5 5 5-5z" fill="currentColor"/>
                        </svg>
                </div>
                <transition name="accordion">
                        <div v-show="isExpanded" class="accordion-content">
                                <slot></slot>
                        </div>
                </transition>
        </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
        title: {
                type: String,
                required: true
        },
        defaultExpanded: {
                type: Boolean,
                default: false
        }
});

const isExpanded = ref(props.defaultExpanded);

const toggleExpanded = () => {
        isExpanded.value = !isExpanded.value;
};
</script>

<style scoped>
.accordion-item {
        background-color: var(--bg-card);
        border-radius: 8px;
        margin-bottom: 15px;
        overflow: visible;
}

.accordion-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        cursor: pointer;
        background-color: var(--bg-card);
        transition: background-color 0.2s ease;
        border-bottom: 1px solid var(--border-color);
}

.accordion-header:hover {
        background-color: var(--bg-secondary);
}

.accordion-header.expanded {
        background-color: var(--bg-secondary);
}

.accordion-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
}

.accordion-icon {
        transition: transform 0.3s ease;
        color: var(--text-secondary);
}

.accordion-icon.rotated {
        transform: rotate(180deg);
}

.accordion-content {
        padding: 20px;
}

/* 手风琴动画 */
.accordion-enter-active,
.accordion-leave-active {
        transition: all 0.3s ease;
        overflow: hidden;
}

.accordion-enter-from,
.accordion-leave-to {
        max-height: 0;
        opacity: 0;
}

.accordion-enter-to,
.accordion-leave-from {
        max-height: 1000px;
        opacity: 1;
}
</style>
