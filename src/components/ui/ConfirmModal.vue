<template>
        <transition name="modal-fade">
                <div class="modal-overlay" @click.self="cancel">
                        <div class="modal-content">
                                <h3 class="modal-title">{{ title }}</h3>
                                <p class="modal-message">{{ message }}</p>
                                <div class="modal-actions">
                                        <button @click="cancel" class="modal-btn cancel">取消</button>
                                        <button @click="confirm" class="modal-btn confirm">确认</button>
                                </div>
                        </div>
                </div>
        </transition>
</template>

<script setup>
const props = defineProps({
        title: String,
        message: String,
        onConfirm: Function,
        onCancel: Function,
});

const confirm = () => props.onConfirm();
const cancel = () => props.onCancel();
</script>