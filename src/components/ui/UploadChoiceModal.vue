<template>
        <transition name="modal-fade">
                <div class="modal-overlay" @click.self="handleCancel">
                        <div class="modal-content">
                                <h3 class="modal-title">添加图片</h3>
                                <div class="modal-body space-y-4">
                                        <button @click="handleLocal" class="modal-btn choice-btn">从本地上传</button>
                                        <div>
                                                
                                                <input type="url" v-model="urlInput" class="modal-input"
                                                        placeholder="使用URL: https://...">
                                        </div>
                                </div>
                                <div class="modal-actions">
                                        <button @click="handleCancel" class="modal-btn cancel">取消</button>
                                        <button @click="handleUrl" class="modal-btn confirm">确认</button>
                                </div>
                                <input type="file" ref="fileInput" @change="handleFileChange" accept="image/*"
                                        style="display: none;" />
                        </div>
                </div>
        </transition>
</template>

<script setup>
import { ref } from 'vue';
import { showToast } from '../../services/uiService';

const props = defineProps({
        onSelect: Function,
        onCancel: Function,
});

const fileInput = ref(null);
const urlInput = ref('');

const handleLocal = () => {
        fileInput.value.click();
};

const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
                props.onSelect({ type: 'local', value: file });
        }
};

const handleUrl = () => {
        if (!urlInput.value.trim().startsWith('http')) {
                showToast("Please enter a valid URL.",  "error" );
                return;
        }
        props.onSelect({ type: 'url', value: urlInput.value });
};

const handleCancel = () => {
        props.onCancel();
};
</script>

<style scoped>
.space-y-4>*:not([hidden])~*:not([hidden]) {
        margin-top: 1rem;
}

.choice-btn {
        width: 100%;
        background-color: var(--bg-secondary);
        color: var(--text-primary);
}
</style>