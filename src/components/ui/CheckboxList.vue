<template>
        <div class="checkbox-list">
                <div 
                        v-for="option in options" 
                        :key="option.value"
                        class="checkbox-item"
                        :class="{ disabled: option.disabled }"
                >
                        <label class="checkbox-label">
                                <input 
                                        type="checkbox"
                                        :value="option.value"
                                        :checked="isChecked(option.value)"
                                        :disabled="option.disabled"
                                        @change="toggleOption(option.value, $event)"
                                        class="checkbox-input"
                                />
                                <span class="checkbox-custom"></span>
                                <span class="checkbox-text">{{ option.label }}</span>
                                <span v-if="option.description" class="checkbox-description">{{ option.description }}</span>
                        </label>
                </div>
        </div>
</template>

<script setup>
const props = defineProps({
        modelValue: {
                type: Array,
                default: () => []
        },
        options: {
                type: Array,
                required: true
        }
});

const emit = defineEmits(['update:modelValue', 'change']);

const isChecked = (value) => {
        return props.modelValue.includes(value);
};

const toggleOption = (value, event) => {
        const isChecked = event.target.checked;
        let newValue;
        
        if (isChecked) {
                newValue = [...props.modelValue, value];
        } else {
                newValue = props.modelValue.filter(v => v !== value);
        }
        
        emit('update:modelValue', newValue);
        emit('change', newValue);
};
</script>

<style scoped>
.checkbox-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
}

.checkbox-item.disabled {
        opacity: 0.5;
}

.checkbox-label {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        cursor: pointer;
        user-select: none;
}

.checkbox-item.disabled .checkbox-label {
        cursor: not-allowed;
}

.checkbox-input {
        display: none;
}

.checkbox-custom {
        width: 18px;
        height: 18px;
        border: 2px solid var(--border-color);
        border-radius: 3px;
        background-color: var(--bg-secondary);
        position: relative;
        flex-shrink: 0;
        transition: all 0.2s ease;
}

.checkbox-input:checked + .checkbox-custom {
        background-color: var(--accent-primary);
        border-color: var(--accent-primary);
}

.checkbox-input:checked + .checkbox-custom::after {
        content: '';
        position: absolute;
        left: 5px;
        top: 2px;
        width: 5px;
        height: 9px;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
}

.checkbox-input:disabled + .checkbox-custom {
        background-color: var(--bg-primary);
        border-color: var(--text-secondary);
}

.checkbox-text {
        color: var(--text-primary);
        font-weight: 500;
        line-height: 1.4;
}

.checkbox-description {
        color: var(--text-secondary);
        font-size: 12px;
        margin-top: 2px;
        display: block;
        line-height: 1.3;
}

.checkbox-label:hover .checkbox-custom {
        border-color: var(--accent-primary);
}

.checkbox-item.disabled .checkbox-label:hover .checkbox-custom {
        border-color: var(--text-secondary);
}
</style>
