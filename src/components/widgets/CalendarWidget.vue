<template>
        <div class="calendar-widget widget">
                <header class="calendar-header">{{ headerText }}</header>
                <div class="calendar-grid">
                        <div v-for="day in weekDays" :key="day" class="week-day">{{ day }}</div>
                        <div v-for="day in calendarDays" :key="day.date.toISOString()" class="day-cell" :class="{
                                'today': day.isToday,
                                'other-month': !day.isCurrentMonth
                        }">
                                {{ day.dayOfMonth }}
                        </div>
                </div>
        </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
        widgetSize: {
                type: Object,
                default: () => ({ col: 2, row: 2 }) // 默认为 2x2
        }
});

// --- 动态样式 ---
// 根据组件大小调整字体
const headerFontSize = computed(() => {
        const baseSize = props.widgetSize.col * 0.4;
        return `${Math.max(1, baseSize)}rem`;
});

const dayFontSize = computed(() => {
        const baseSize = props.widgetSize.col * 0.28;
        return `${Math.max(0.8, baseSize)}rem`;
});


// --- 日历核心逻辑 ---
const today = ref(new Date());
const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

// 格式化头部显示的年月
const headerText = computed(() => {
        return today.value.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long'
        });
});

// 生成日历网格所需的数据
const calendarDays = computed(() => {
        const days = [];
        const currentYear = today.value.getFullYear();
        const currentMonth = today.value.getMonth();

        // 获取当月第一天
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        // 获取当月第一天是星期几 (0-6, 周日-周六)
        const firstDayOfWeek = firstDayOfMonth.getDay();

        // 计算日历网格的起始日期（通常是上个月的某一天）
        const startDate = new Date(firstDayOfMonth);
        startDate.setDate(startDate.getDate() - firstDayOfWeek);

        // 生成 42 个单元格 (6行 x 7列) 来填充日历
        for (let i = 0; i < 42; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);

                const isToday = date.getFullYear() === today.value.getFullYear() &&
                        date.getMonth() === today.value.getMonth() &&
                        date.getDate() === today.value.getDate();

                days.push({
                        date: date,
                        dayOfMonth: date.getDate(),
                        isCurrentMonth: date.getMonth() === currentMonth,
                        isToday: isToday
                });
        }

        return days;
});

</script>

<style scoped>
.calendar-widget {
        width: 100%;
        height: 100%;
        color: white;
        display: flex;
        flex-direction: column;
        padding: 10px;
        box-sizing: border-box;
        overflow: hidden;
}

.calendar-header {
        font-size: v-bind('headerFontSize');
        font-weight: 600;
        padding-bottom: 8px;
        text-align: left;
        margin-left: 5px;
}

.calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
        width: 100%;
        flex-grow: 1;
}

.week-day {
        font-size: v-bind('dayFontSize');
        font-weight: 300;
        opacity: 0.7;
        text-align: center;
}

.day-cell {
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: v-bind('dayFontSize');
        font-weight: 400;
        border-radius: 50%;
        aspect-ratio: 1 / 1;
        /* 保持圆形 */
        cursor: default;
}

/* 非本月的日期样式 */
.other-month {
        opacity: 0.3;
}

/* 今天的高亮样式 */
.today {
        background-color: var(--accent-primary);
        /* 使用 CSS 变量 */
        font-weight: 700;
}
</style>