<template>
        <div class="modal-overlay" @click="close">
                <div class="modal-content" @click.stop>
                        <div class="modal-header">
                                <h3>{{ paymentData.subtype === 'transfer' ? '转账详情' : '代付详情' }}</h3>
                                <button class="close-btn" @click="close">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                                fill="currentColor" viewBox="0 0 16 16">
                                                <path
                                                        d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
                                        </svg>
                                </button>
                        </div>

                        <div class="modal-body">
                                <div class="payment-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"
                                                fill="currentColor" class="bi bi-piggy-bank-fill" viewBox="0 0 16 16">
                                                <path
                                                        d="M7.964 1.527c-2.977 0-5.571 1.704-6.32 4.125h-.55A1 1 0 0 0 .11 6.824l.254 1.46a1.5 1.5 0 0 0 1.478 1.243h.263c.3.513.688.978 1.145 1.382l-.729 2.477a.5.5 0 0 0 .48.641h2a.5.5 0 0 0 .471-.332l.482-1.351c.635.173 1.31.267 2.011.267.707 0 1.388-.095 2.028-.272l.543 1.372a.5.5 0 0 0 .465.316h2a.5.5 0 0 0 .478-.645l-.761-2.506C13.81 9.895 14.5 8.559 14.5 7.069q0-.218-.02-.431c.261-.11.508-.266.705-.444.315.306.815.306.815-.417 0 .223-.5.223-.461-.026a1 1 0 0 0 .09-.255.7.7 0 0 0-.202-.645.58.58 0 0 0-.707-.098.74.74 0 0 0-.375.562c-.024.243.082.48.32.654a2 2 0 0 1-.259.153c-.534-2.664-3.284-4.595-6.442-4.595m7.173 3.876a.6.6 0 0 1-.098.21l-.044-.025c-.146-.09-.157-.175-.152-.223a.24.24 0 0 1 .117-.173c.049-.027.08-.021.113.012a.2.2 0 0 1 .064.199m-8.999-.65a.5.5 0 1 1-.276-.96A7.6 7.6 0 0 1 7.964 3.5c.763 0 1.497.11 2.18.315a.5.5 0 1 1-.287.958A6.6 6.6 0 0 0 7.964 4.5c-.64 0-1.255.09-1.826.254ZM5 6.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0" />
                                        </svg>
                                </div>

                                <div class="payment-amount">¥{{ paymentData.amount.toFixed(2) }}</div>

                                <div class="payment-details">
                                        <div class="detail-row">
                                                <span class="label">类型：</span>
                                                <span class="value">{{ paymentData.subtype === 'transfer' ? '转账' : '代付'
                                                        }}</span>
                                        </div>

                                        <div v-if="paymentData.message" class="detail-row">
                                                <span class="label">备注：</span>
                                                <span class="value">{{ paymentData.message }}</span>
                                        </div>

                                        <div v-if="paymentData.productInfo" class="detail-row">
                                                <span class="label">商品：</span>
                                                <span class="value">{{ paymentData.productInfo }}</span>
                                        </div>
                                </div>
                        </div>

                        <div class="modal-footer">
                                <button class="btn-secondary" @click="handleReject">
                                        拒绝
                                </button>
                                <button class="btn-primary" @click="handleAccept">
                                        接受
                                </button>
                        </div>
                </div>
        </div>
</template>

<script setup>
const props = defineProps({
  paymentData: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['accept', 'reject', 'close']);

const close = () => {
  emit('close');
};

const handleAccept = () => {
  emit('accept');
  close();
};

const handleReject = () => {
  emit('reject');
  close();
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

.modal-content {
  background: var(--bg-card);
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  color: var(--text-primary);
  background-color: var(--bg-secondary);
}

.modal-body {
  padding: 24px;
  text-align: center;
}

.payment-icon {
  color: var(--accent-primary);
  margin-bottom: 16px;
}

.payment-amount {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 24px;
}

.payment-details {
  text-align: left;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-light);
}

.detail-row:last-child {
  border-bottom: none;
}

.label {
  color: var(--text-secondary);
  font-size: 14px;
}

.value {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid var(--border-color);
}

.btn-secondary,
.btn-primary {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background-color: var(--border-color);
}

.btn-primary {
  background-color: var(--accent-primary);
  color: var(--accent-text);
}

.btn-primary:hover {
  background-color: var(--accent-darker);
  transform: translateY(-1px);
}
</style>
