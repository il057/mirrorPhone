<template>
        <div class="clock-widget widget">
                <div class="time">{{ formattedTime }}</div>
                <div v-if="isDateVisible" class="date">{{ formattedDate }}</div>
        </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';

const props = defineProps({
        widgetSize: {
                type: Object,
                default: () => ({ col: 4, row: 2 })
        }
});

const currentTime = ref(new Date());
let timer = null;

// Formats the time to HH:MM
const formattedTime = ref('');
// Formats the date to "Day, Month Date"
const formattedDate = ref('');

// 根据小组件大小调整字体大小
const timeFontSize = computed(() => {
        const baseSize = props.widgetSize.col * 1.7;
        return `${Math.max(2, Math.min(8, baseSize))}rem`;
});

const dateFontSize = computed(() => {
        const baseSize = props.widgetSize.col * 0.3;
        return `${Math.max(1, Math.min(2, baseSize))}rem`;
});

// 新增：创建一个计算属性来控制日期的可见性
const isDateVisible = computed(() => {
        // 解析出rem前面的数值并进行比较
        return parseFloat(dateFontSize.value) > 1;
});

const updateTime = () => {
        currentTime.value = new Date();

        const hours = currentTime.value.getHours().toString().padStart(2, '0');
        const minutes = currentTime.value.getMinutes().toString().padStart(2, '0');
        formattedTime.value = `${hours}:${minutes}`;

        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        formattedDate.value = currentTime.value.toLocaleDateString('zh-CN', options);
};

onMounted(() => {
        updateTime(); // Initial call to display time immediately
        timer = setInterval(updateTime, 1000); // Update every second
});

onUnmounted(() => {
        clearInterval(timer); // Clean up the interval when the component is destroyed
});
</script>

<style scoped>
.clock-widget {
        width: 100%;
        height: 100%;
        /* Consistent with iOS widget style */
        color: white;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        box-sizing: border-box;
        overflow: hidden;
}

.time {
        font-size: v-bind('timeFontSize');
        /* Adjust size based on widget dimensions */
        font-weight: 100;
        line-height: 1;
}

.date {
        font-size: v-bind('dateFontSize');
        font-weight: 300;
        opacity: 0.8;
        margin-top: 5px;
}
</style>