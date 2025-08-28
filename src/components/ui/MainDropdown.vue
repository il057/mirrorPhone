<template>
        <div class="main-dropdown" :class="{ 'dropdown-open': isOpen }">
                <button 
                        class="dropdown-trigger" 
                        @click="toggleDropdown"
                        :class="{ 'active': isOpen }"
                >
                        <span class="selected-text">{{ selectedLabel || placeholder }}</span>
                        <svg 
                                class="dropdown-arrow" 
                                :class="{ 'rotated': isOpen }"
                                viewBox="0 0 24 24" 
                                width="16" 
                                height="16"
                        >
                                <path d="M7 10l5 5 5-5z" fill="currentColor"/>
                        </svg>
                </button>
                
                <Transition name="dropdown-fade">
                        <div v-if="isOpen" class="dropdown-content">
                                <div class="dropdown-list">
                                        <div 
                                                v-for="(option, index) in options" 
                                                :key="option.value || index"
                                                class="dropdown-item"
                                                :class="{ 
                                                        'selected': option.value === selectedValue,
                                                        'disabled': option.disabled 
                                                }"
                                                @click="selectOption(option)"
                                        >
                                                <span class="item-label">{{ option.label }}</span>
                                                <svg 
                                                        v-if="option.value === selectedValue" 
                                                        class="check-icon"
                                                        viewBox="0 0 24 24" 
                                                        width="16" 
                                                        height="16"
                                                >
                                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
                                                </svg>
                                        </div>
                                </div>
                        </div>
                </Transition>
        </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
        options: {
                type: Array,
                required: true,
                default: () => []
        },
        modelValue: {
                type: [String, Number, Object],
                default: null
        },
        placeholder: {
                type: String,
                default: '请选择...'
        },
        disabled: {
                type: Boolean,
                default: false
        }
})

const emit = defineEmits(['update:modelValue', 'change'])

const isOpen = ref(false)
const dropdownRef = ref(null)

const selectedValue = computed(() => props.modelValue)

const selectedLabel = computed(() => {
        if (!selectedValue.value) return ''
        const option = props.options.find(opt => opt.value === selectedValue.value)
        return option ? option.label : ''
})

const toggleDropdown = () => {
        if (props.disabled) return
        isOpen.value = !isOpen.value
}

const selectOption = (option) => {
        if (option.disabled) return
        
        emit('update:modelValue', option.value)
        emit('change', option)
        isOpen.value = false
}

const closeDropdown = (event) => {
        if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
                isOpen.value = false
        }
}

onMounted(() => {
        document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
        document.removeEventListener('click', closeDropdown)
})
</script>

<style scoped>
.main-dropdown {
        position: relative;
        width: 100%;
        max-width: 100%;
}

.dropdown-trigger {
        width: 100%;
        padding: 12px 16px;
        background-color: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        color: var(--text-primary);
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 14px;
        transition: all 0.2s ease;
        box-sizing: border-box;
}

.dropdown-trigger:hover {
        border-color: var(--accent-primary);
        background-color: var(--bg-secondary);
}

.dropdown-trigger.active {
        border-color: var(--accent-primary);
        box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.dropdown-trigger:disabled {
        opacity: 0.5;
        cursor: not-allowed;
}

.selected-text {
        flex: 1;
        text-align: left;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
}

.dropdown-arrow {
        margin-left: 8px;
        transition: transform 0.2s ease;
        color: var(--text-secondary);
        flex-shrink: 0;
}

.dropdown-arrow.rotated {
        transform: rotate(180deg);
}

.dropdown-content {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        background-color: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 199;
        max-height: 200px;
        overflow: hidden;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
}

.dropdown-list {
        max-height: 200px;
        overflow-y: auto;
        padding: 4px 0;
}

.dropdown-item {
        padding: 10px 16px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: all 0.2s ease;
        font-size: 14px;
        color: var(--text-primary);
}

.dropdown-item:hover {
        background-color: var(--bg-secondary);
}

.dropdown-item.selected {
        background-color: var(--accent-primary);
        color: var(--accent-text);
        font-weight: 500;
}

.dropdown-item.selected:hover {
        background-color: var(--accent-darker);
}

.dropdown-item.disabled {
        opacity: 0.5;
        cursor: not-allowed;
        color: var(--text-secondary);
}

.dropdown-item.disabled:hover {
        background-color: transparent;
}

.item-label {
        flex: 1;
        text-align: left;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
}

.check-icon {
        margin-left: 8px;
        color: currentColor;
        flex-shrink: 0;
}

/* 滚动条样式 */
.dropdown-list::-webkit-scrollbar {
        width: 4px;
}

.dropdown-list::-webkit-scrollbar-track {
        background: transparent;
}

.dropdown-list::-webkit-scrollbar-thumb {
        background: var(--text-secondary);
        border-radius: 2px;
        opacity: 0.3;
}

.dropdown-list::-webkit-scrollbar-thumb:hover {
        opacity: 0.5;
}

/* 动画效果 */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
        transition: all 0.2s ease;
}

.dropdown-fade-enter-from {
        opacity: 0;
        transform: translateY(-8px);
}

.dropdown-fade-leave-to {
        opacity: 0;
        transform: translateY(-8px);
}

/* 响应式设计 */
@media (max-width: 768px) {
        .dropdown-trigger {
                padding: 14px 16px;
                font-size: 16px; /* 移动端使用更大的字体 */
        }
        
        .dropdown-item {
                padding: 12px 16px;
                font-size: 16px;
        }
}

/* 深色主题优化 */
[data-theme="dark"] .dropdown-trigger.active {
        box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.3);
}

[data-theme="dark"] .dropdown-content {
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

/* 浅色主题优化 */
[data-theme="light"] .dropdown-trigger.active {
        box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

[data-theme="light"] .dropdown-content {
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

[data-theme="light"] .dropdown-item.selected {
        /* 在浅色主题下，确保文字颜色对比度足够 */
        color: #ffffff;
}
</style>
