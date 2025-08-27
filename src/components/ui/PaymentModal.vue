<template>
        <div class="modal-overlay" @click="$emit('cancel')">
                <div class="modal-container" @click.stop>
                        <div class="modal-header">
                                <h3>{{ type === 'transfer' ? '转账' : '代付' }}</h3>
                                <button class="close-btn" @click="$emit('cancel')">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                                strokeWidth={1.5} stroke="currentColor" className="size-6">
                                                <path strokeLinecap="round" strokeLinejoin="round"
                                                        d="M6 18 18 6M6 6l12 12" />
                                        </svg>
                                </button>
                        </div>
                        <div class="modal-content">
                                <form @submit.prevent="handleSubmit">
                                        <!-- 转账模式 -->
                                        <div v-if="type === 'transfer'" class="form-group">
                                                <label for="amount">转账金额</label>
                                                <div class="amount-input">
                                                        <span class="currency">¥</span>
                                                        <input id="amount" v-model="amount" type="number" step="0.01"
                                                                min="0.01" placeholder="0.00" required />
                                                </div>
                                        </div>

                                        <!-- 代付模式 -->
                                        <div v-if="type === 'pay'" class="form-group">
                                                <label for="product">商品信息</label>
                                                <input id="product" v-model="productInfo" type="text"
                                                        placeholder="请输入商品信息" required />
                                        </div>

                                        <div v-if="type === 'pay'" class="form-group">
                                                <label for="payAmount">代付金额</label>
                                                <div class="amount-input">
                                                        <span class="currency">¥</span>
                                                        <input id="payAmount" v-model="amount" type="number" step="0.01"
                                                                min="0.01" placeholder="0.00" required />
                                                </div>
                                        </div>

                                        <!-- 通用留言 -->
                                        <div class="form-group">
                                                <label for="message">{{ type === 'transfer' ? '留言（可选）' : '备注（可选）'
                                                        }}</label>
                                                <textarea id="message" v-model="message"
                                                        :placeholder="type === 'transfer' ? '给对方留言...' : '备注信息...'"
                                                        rows="3"></textarea>
                                        </div>

                                        <div class="form-actions">
                                                <button type="button" class="btn-cancel" @click="$emit('cancel')">
                                                        取消
                                                </button>
                                                <button type="submit" class="btn-confirm" :disabled="!isValid">
                                                        {{ type === 'transfer' ? '转账' : '代付' }}
                                                </button>
                                        </div>
                                </form>
                        </div>
                </div>
        </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
        type: {
                type: String,
                required: true,
                validator: value => ['transfer', 'pay'].includes(value)
        }
});

const emit = defineEmits(['confirm', 'cancel']);

const amount = ref('');
const message = ref('');
const productInfo = ref('');

const isValid = computed(() => {
        if (!amount.value || parseFloat(amount.value) <= 0) return false;
        if (props.type === 'pay' && !productInfo.value.trim()) return false;
        return true;
});

const handleSubmit = () => {
        if (!isValid.value) return;

        const data = {
                amount: parseFloat(amount.value),
                message: message.value.trim(),
                type: props.type
        };

        if (props.type === 'pay') {
                data.productInfo = productInfo.value.trim();
        }

        emit('confirm', data);
};
</script>

<style scoped>
.modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
}

.modal-container {
        background-color: var(--bg-card);
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        max-width: 400px;
        width: 100%;
        max-height: 80vh;
        overflow: hidden;
}

.modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 20px 15px;
        border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
        margin: 0;
        color: var(--text-primary);
        font-size: 18px;
        font-weight: 600;
}

.close-btn {
        background: none;
        border: none;
        font-size: 24px;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s;
}

.close-btn:hover {
        color: var(--accent-primary)
}

.modal-content {
        padding: 20px;
}

.form-group {
        margin-bottom: 20px;
}

.form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: var(--text-primary);
        font-size: 14px;
}

.amount-input {
        position: relative;
        display: flex;
        align-items: center;
}

.currency {
        position: absolute;
        left: 12px;
        color: var(--text-secondary);
        font-weight: 500;
        z-index: 1;
}

.amount-input input {
        padding-left: 32px;
}

input,
textarea {
        width: 100%;
        padding: 12px;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        background-color: var(--bg-primary);
        color: var(--text-primary);
        font-size: 16px;
        transition: border-color 0.2s;
        box-sizing: border-box;
}

input:focus,
textarea:focus {
        outline: none;
        border-color: var(--accent-primary);
}

textarea {
        resize: vertical;
        min-height: 80px;
        font-family: inherit;
}

.form-actions {
        display: flex;
        gap: 12px;
        margin-top: 24px;
}

.btn-cancel,
.btn-confirm {
        flex: 1;
        padding: 12px 20px;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
}

.btn-cancel {
        background-color: var(--bg-secondary);
        color: var(--text-primary);
        border: 1px solid var(--border-color);
}

.btn-cancel:hover {
        background-color: var(--bg-primary);
}

.btn-confirm {
        background-color: var(--accent-primary);
        color: var(--text-inverse);
}

.btn-confirm:hover:not(:disabled) {
        background-color: var(--accent-darker);
}

.btn-confirm:disabled {
        opacity: 0.5;
        cursor: not-allowed;
}
</style>
      
