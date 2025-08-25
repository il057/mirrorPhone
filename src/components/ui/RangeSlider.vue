<template>
        <div class="range-slider-container">
                <label v-if="label" class="range-label">{{ label }}</label>
                <div class="range-wrapper">
                        <span class="range-min">{{ min }}</span>
                        <div class="range-slider">
                                <input
                                        type="range"
                                        :min="min"
                                        :max="max"
                                        :step="step"
                                        :value="modelValue"
                                        @input="handleInput"
                                        class="range-input"
                                />
                                <div class="range-value" :style="{ left: valuePosition }">
                                        {{ modelValue }}
                                </div>
                        </div>
                        <span class="range-max">{{ max }}</span>
                </div>
        </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
        modelValue: {
                type: Number,
                default: 0
        },
        min: {
                type: Number,
                default: -1000
        },
        max: {
                type: Number,
                default: 1000
        },
        step: {
                type: Number,
                default: 1
        },
        label: {
                type: String,
                default: ''
        }
});

const emit = defineEmits(['update:modelValue']);

const handleInput = (event) => {
        emit('update:modelValue', parseInt(event.target.value));
};

const valuePosition = computed(() => {
        const percentage = ((props.modelValue - props.min) / (props.max - props.min)) * 100;
        return `${Math.max(0, Math.min(100, percentage))}%`;
});
</script>

<style scoped>
.range-slider-container {
        margin: 15px 0;
}

.range-label {
        display: block;
        margin-bottom: 10px;
        font-weight: 500;
        color: var(--text-primary);
}

.range-wrapper {
        display: flex;
        align-items: center;
        gap: 15px;
}

.range-min,
.range-max {
        font-size: 12px;
        color: var(--text-secondary);
        min-width: 30px;
        text-align: center;
}

.range-slider {
        flex: 1;
        position: relative;
}

.range-input {
        width: 100%;
        height: 6px;
        background: var(--bg-secondary);
        border-radius: 3px;
        outline: none;
        -webkit-appearance: none;
        appearance: none;
}

.range-input::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--accent-primary);
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        transition: all 0.2s ease;
}

.range-input::-webkit-slider-thumb:hover {
        transform: scale(1.1);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.range-input::-moz-range-thumb {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--accent-primary);
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        border: none;
        transition: all 0.2s ease;
}

.range-input::-moz-range-thumb:hover {
        transform: scale(1.1);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.range-input::-moz-range-track {
        height: 6px;
        background: var(--bg-secondary);
        border-radius: 3px;
        border: none;
}

.range-value {
        position: absolute;
        top: -35px;
        transform: translateX(-50%);
        background: var(--accent-primary);
        color: var(--accent-text);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
        white-space: nowrap;
}

.range-value::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 4px solid transparent;
        border-top-color: var(--accent-primary);
}
</style>
