<template>
  <div class="simple-clock-widget">
    <div class="clock-display">
      <div class="time-text">{{ currentTime }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  widgetSize: {
    type: Object,
    default: () => ({ col: 2, row: 2 })
  }
})

const now = ref(new Date())
let timer = null

const updateTime = () => {
  now.value = new Date()
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})

const currentTime = computed(() => {
  const hours = now.value.getHours().toString().padStart(2, '0')
  const minutes = now.value.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
})

const fontSize = computed(() => {
  // 根据widget大小调整字体大小
  const baseSize = Math.min(props.widgetSize.col, props.widgetSize.row)
  return `${Math.max(20, baseSize * 12)}px`
})
</script>

<style scoped>
.simple-clock-widget {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  box-sizing: border-box;
  
  /* 白色背景，圆角矩形，带虚线边框 - 模仿iOS时钟样式 */
  background: #ffffff;
  border-radius: 20px;
  border: 2px dashed #d1d5db;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 深色模式下的调整 */
[data-theme="dark"] .simple-clock-widget {
  background: #1f2937;
  border-color: #6b7280;
  color: #ffffff;
}

.clock-display {
  text-align: center;
  width: 100%;
}

.time-text {
  font-size: v-bind(fontSize);
  font-weight: 800;
  color: #000000;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
  letter-spacing: -0.02em;
  line-height: 1;
}

/* 深色模式下的文本颜色 */
[data-theme="dark"] .time-text {
  color: #ffffff;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .simple-clock-widget {
    padding: 6px;
    border-radius: 16px;
  }
}
</style>
