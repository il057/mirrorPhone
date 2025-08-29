<template>
        <div v-if="isMounted" 
             :class="['persistent-toast', `toast-${type}`, { 'toast-visible': isVisible }]"
             :style="{ top: finalTopPosition }">
                <div class="toast-content">
                        <div v-if="showSpinner" class="toast-spinner">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M21 12a9 9 0 11-6.219-8.56"/>
                                </svg>
                        </div>
                        <span class="toast-message">{{ message }}</span>
                        <button v-if="showCloseButton" @click="closeToast" class="toast-close">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                        </button>
                </div>
        </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';

const props = defineProps({
        message: String,
        type: {
                type: String,
                default: 'info',
        },
        topOffset: {
                type: Number,
                default: 20
        },
        persistent: {
                type: Boolean,
                default: false
        },
        showSpinner: {
                type: Boolean,
                default: false
        },
        showCloseButton: {
                type: Boolean,
                default: false
        },
        onClose: Function,
        onUpdate: Function,
});

// isMounted 控制元素是否在DOM中
const isMounted = ref(false);
// isVisible 控制触发动画的 class
const isVisible = ref(false);

// 计算最终的top位置，考虑安全区域
const finalTopPosition = computed(() => {
        const safeAreaTop = 'env(safe-area-inset-top, 0px)';
        return `calc(${safeAreaTop} + ${props.topOffset}px)`;
});

// 监听消息变化，实现更新动画
watch(() => props.message, (newMessage, oldMessage) => {
        if (newMessage !== oldMessage && oldMessage) {
                // 触发更新动画
                isVisible.value = false;
                setTimeout(() => {
                        isVisible.value = true;
                }, 150);
        }
});

const closeToast = () => {
        isVisible.value = false;
        setTimeout(() => {
                if (props.onClose) {
                        props.onClose();
                }
        }, 300);
};

onMounted(() => {
        // 1. 先将元素挂载到DOM中 (此时它是透明的)
        isMounted.value = true;

        // 2. 使用一个极短的延迟，确保浏览器渲染了初始状态后，再添加 .toast-visible class 来触发进入动画
        setTimeout(() => {
                isVisible.value = true;
        }, 10); // 10ms 延迟

        // 3. 如果不是持久化Toast，设置定时器自动隐藏
        if (!props.persistent) {
                setTimeout(() => {
                        isVisible.value = false;
                        // 4. 在隐藏动画（0.3秒）结束后，调用父级的 onClose 来彻底移除组件
                        setTimeout(() => {
                                if (props.onClose) {
                                        props.onClose();
                                }
                        }, 300); // 300ms 必须匹配 CSS transition 的时长
                }, 2500);
        }
});

// 暴露更新方法给父组件
defineExpose({
        updateMessage: (newMessage) => {
                // 触发props的update事件
                if (props.onUpdate) {
                        props.onUpdate(newMessage);
                }
        },
        close: closeToast
});
</script>

<style scoped>
.persistent-toast {
        position: fixed;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 16px;
        border-radius: 999px;
        color: var(--text-primary);
        font-weight: 600;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        text-align: center;
        max-width: 90%;
        font-size: 0.875rem;
        font-weight: 500;
        
        /* 初始状态：透明 */
        opacity: 0;
        
        /* 定义过渡效果 */
        transition: opacity 0.3s ease, top 0.3s ease;
}

.persistent-toast.toast-visible {
        opacity: 1;
}

.toast-content {
        display: flex;
        align-items: center;
        gap: 8px;
}

.toast-spinner {
        display: flex;
        align-items: center;
}

.toast-spinner svg {
        animation: spin 1s linear infinite;
}

@keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
}

.toast-message {
        flex: 1;
}

.toast-close {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        padding: 2px;
        border-radius: 2px;
        opacity: 0.7;
        transition: opacity 0.2s ease;
}

.toast-close:hover {
        opacity: 1;
}

.persistent-toast.toast-success {
        background-color: rgba(110, 184, 128, 0.65);
}

.persistent-toast.toast-error {
        background-color: rgba(220, 38, 38, 0.65);
}

.persistent-toast.toast-info {
        background-color: rgba(55, 65, 81, 0.65);
}

.persistent-toast.toast-warning {
        background-color: rgba(245, 158, 11, 0.65);
}

.persistent-toast.toast-loading {
        background-color: rgba(59, 130, 246, 0.65);
}
</style>
