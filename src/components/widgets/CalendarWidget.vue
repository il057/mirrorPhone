<template>
        <div class="calendar-widget widget">
                <header class="calendar-header">{{ headerText }}</header>
                <div class="calendar-grid">
                        <div v-for="day in weekDays" :key="day" class="week-day">{{ day }}</div>
                        <div v-for="day in calendarDays" :key="day.date.toISOString()" class="day-cell" :class="{
                                'today': day.isToday,
                                'other-month': !day.isCurrentMonth,
                                'has-event': day.hasEvent,
                                'has-birthday': day.hasBirthday,
                                'has-memory': day.hasMemory
                        }">
                                <span class="day-number">{{ day.dayOfMonth }}</span>
                                <div v-if="day.eventDots && day.eventDots.length > 0" class="event-dots">
                                        <div v-for="dot in day.eventDots" :key="dot.type" class="event-dot" :class="dot.type"></div>
                                </div>
                        </div>
                </div>
        </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useObservable } from '@vueuse/rxjs';
import { liveQuery } from 'dexie';
import db from '../../services/database.js';

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

// 获取所有相关数据
const memories = useObservable(
        liveQuery(async () => {
                return await db.memories
                        .where('type')
                        .anyOf(['date', 'countdown', 'anniversary'])
                        .toArray();
        }),
        { initialValue: [] }
);

const actors = useObservable(
        liveQuery(async () => {
                return await db.actors
                        .filter(actor => 
                                actor.birthday && 
                                !actor.isGroup && 
                                !actor.id.startsWith('user_') && 
                                actor.id !== '__USER__'
                        )
                        .toArray();
        }),
        { initialValue: [] }
);

// 格式化头部显示的年月
const headerText = computed(() => {
        return today.value.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long'
        });
});

// 检查指定日期是否有事件
const getEventsForDate = (date) => {
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD格式
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const monthDay = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`; // MM-DD格式
        
        const events = [];
        
        // 检查回忆中的日期
        memories.value.forEach(memory => {
                if (memory.targetDate) {
                        const targetDate = new Date(memory.targetDate);
                        const targetDateStr = targetDate.toISOString().split('T')[0];
                        
                        if (targetDateStr === dateStr) {
                                events.push({
                                        type: memory.type === 'countdown' ? 'countdown' : 'anniversary',
                                        title: memory.content
                                });
                        }
                }
        });
        
        // 检查生日
        actors.value.forEach(actor => {
                if (actor.birthday) {
                        const birthday = actor.birthday;
                        // 支持多种生日格式：MM-DD 或 YYYY-MM-DD
                        const birthdayParts = birthday.split('-');
                        let birthdayMonthDay = '';
                        
                        if (birthdayParts.length === 2) {
                                // MM-DD格式
                                birthdayMonthDay = birthday;
                        } else if (birthdayParts.length === 3) {
                                // YYYY-MM-DD格式，取MM-DD部分
                                birthdayMonthDay = `${birthdayParts[1]}-${birthdayParts[2]}`;
                        }
                        
                        if (birthdayMonthDay === monthDay) {
                                events.push({
                                        type: 'birthday',
                                        title: `${actor.name}的生日`
                                });
                        }
                }
        });
        
        return events;
};

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

                const events = getEventsForDate(date);
                const eventDots = events.map(event => ({ type: event.type }));
                
                days.push({
                        date: date,
                        dayOfMonth: date.getDate(),
                        isCurrentMonth: date.getMonth() === currentMonth,
                        isToday: isToday,
                        hasEvent: events.length > 0,
                        hasBirthday: events.some(e => e.type === 'birthday'),
                        hasMemory: events.some(e => e.type === 'countdown' || e.type === 'anniversary'),
                        eventDots: eventDots
                });
        }

        return days;
});

onMounted(() => {
        // 每分钟更新一次当前时间，确保"今天"标记准确
        const updateTimer = setInterval(() => {
                today.value = new Date();
        }, 60000);

        onUnmounted(() => {
                clearInterval(updateTimer);
        });
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
        flex-direction: column;
        justify-content: center;
        align-items: center;
        font-size: v-bind('dayFontSize');
        font-weight: 400;
        border-radius: 50%;
        aspect-ratio: 1 / 1;
        cursor: default;
        position: relative;
}

.day-number {
        z-index: 2;
}

/* 非本月的日期样式 */
.other-month {
        opacity: 0.3;
}

/* 今天的高亮样式 */
.today {
        background-color: var(--accent-primary);
        font-weight: 700;
}

/* 事件标记点 */
.event-dots {
        position: absolute;
        bottom: 2px;
        display: flex;
        gap: 1px;
        z-index: 1;
}

.event-dot {
        width: 3px;
        height: 3px;
        border-radius: 50%;
        opacity: 0.8;
}

.event-dot.birthday {
        background-color: #ff6b6b; /* 红色表示生日 */
}

.event-dot.countdown {
        background-color: #4ecdc4; /* 青色表示倒计时 */
}

.event-dot.anniversary {
        background-color: #ffe66d; /* 黄色表示纪念日 */
}
</style>