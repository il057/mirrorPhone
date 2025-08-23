<template>
        <div class="clock-widget">
                <div class="time">{{ formattedTime }}</div>
                <div class="date">{{ formattedDate }}</div>
        </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const currentTime = ref(new Date());
let timer = null;

// Formats the time to HH:MM
const formattedTime = ref('');
// Formats the date to "Day, Month Date"
const formattedDate = ref('');

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
        background-color: rgba(30, 30, 30, 0.7);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-radius: 20px;
        /* Consistent with iOS widget style */
        color: white;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 15px;
        box-sizing: border-box;
        overflow: hidden;
}

.time {
        font-size: 3rem;
        /* Adjust size based on widget dimensions */
        font-weight: 600;
        line-height: 1;
}

.date {
        font-size: 0.9rem;
        font-weight: 400;
        opacity: 0.8;
        margin-top: 5px;
}
</style>
    
