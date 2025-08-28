<template>
        <transition name="modal-fade">
                <div class="modal-overlay" @click.self="handleCancel">
                        <div class="modal-content">
                                <h3 class="modal-title">{{ title }}</h3>
                                <div class="modal-body">
                                        <textarea v-if="isTextarea" v-model="inputValue" :placeholder="placeholder"
                                                class="modal-input" rows="3"></textarea>
                                        <input v-else v-model="inputValue" :placeholder="placeholder"
                                                class="modal-input" />
                                </div>
                                <div class="modal-actions">
                                        <button @click="handleCancel" class="modal-btn cancel">取消</button>
                                        <button @click="handleConfirm" class="modal-btn confirm">确认</button>
                                </div>
                        </div>
                </div>
        </transition>
</template>

<script setup>
import { ref } from 'vue';
import { showToast } from '../../services/uiService';

const props = defineProps({
        title: String,
        placeholder: String,
        isTextarea: Boolean,
        isOptional: Boolean,
        initialValue: String,
        onConfirm: Function,
        onCancel: Function,
});

const inputValue = ref(props.initialValue || '');

const handleConfirm = () => {
        if (!props.isOptional && !inputValue.value.trim()) {
                showToast("输入不能为空！", "error" );
                return;
        }
        props.onConfirm(inputValue.value);
};

const handleCancel = () => {
        props.onCancel();
};
</script>

