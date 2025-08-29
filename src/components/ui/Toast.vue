<template>
        <div v-if="isMounted" 
             :class="['toast-notification', `toast-${type}`, { 'toast-visible': isVisible }]"
             :style="{ top: finalTopPosition }">
                {{ message }}
        </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';

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
        onClose: Function,
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

onMounted(() => {
        // 1. 先将元素挂载到DOM中 (此时它是透明的)
        isMounted.value = true;

        // 2. 使用一个极短的延迟，确保浏览器渲染了初始状态后，再添加 .toast-visible class 来触发进入动画
        setTimeout(() => {
                isVisible.value = true;
        }, 10); // 10ms 延迟

        // 3. 设置定时器，在 2.5 秒后开始隐藏 Toast
        setTimeout(() => {
                isVisible.value = false;
                // 4. 在隐藏动画（0.3秒）结束后，调用父级的 onClose 来彻底移除组件
                setTimeout(props.onClose, 300); // 300ms 必须匹配 CSS transition 的时长
        }, 2500);
});
</script>