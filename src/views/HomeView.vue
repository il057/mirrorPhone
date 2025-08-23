<template>
        <div class="home-screen" @click.self="isEditMode = false">
                <!-- Top Buttons for Edit Mode -->
                <div v-if="isEditMode" class="top-buttons">
                        <button @click="openWidgetDrawer" class="add-button">+</button>
                        <button @click="isEditMode = false" class="done-button">完成</button>
                </div>

                <div class="app-grid">
                        <div v-for="(item, index) in screenItems" :key="item.id" class="grid-item" :class="{
                                'edit-mode': isEditMode,
                                'dragging': draggingIndex === index
                                }" :style="{
                                gridColumn: `span ${item.gridSpan.col}`,
                                gridRow: `span ${item.gridSpan.row}`
                                }" :draggable="isEditMode" @dragstart="handleDragStart(index)" @dragover.prevent
                                @drop.prevent="handleDrop(index)" @dragend="handleDragEnd"
                                @mousedown="onMouseDown(item)" @mouseup="onMouseUp" @mousemove="onMouseMove"
                                @click.prevent="handleClick(item)">
                                <button v-if="isEditMode && item.type === 'widget'" @click.stop="deleteItem(index)"
                                        class="delete-button">-</button>

                                <!-- 如果是 App，渲染 AppIcon -->
                                <AppIcon v-if="item.type === 'app'" :name="item.name">
                                        <component :is="item.component" />
                                </AppIcon>

                                <!-- 如果是 Widget，直接渲染 Widget 组件 -->
                                <component v-else-if="item.type === 'widget'" :is="item.component"
                                        class="widget-component" />
                        </div>
                </div>

                <!-- Widget Drawer -->
                <div v-if="isWidgetDrawerOpen" class="widget-drawer-overlay" @click="isWidgetDrawerOpen = false">
                        <div class="widget-drawer" @click.stop>
                                <h2>添加小组件</h2>
                                <div class="widget-list">
                                        <!-- 循环可用的 widget -->
                                        <div v-for="widget in availableWidgets" :key="widget.name" class="widget-option"
                                                @click="addWidgetToScreen(widget)">
                                                <p>{{ widget.name }}</p>
                                                <!-- 这里可以放一个小组件的预览图或样式 -->
                                                <div class="widget-preview" :class="widget.previewClass"></div>
                                        </div>
                                </div>
                        </div>
                </div>
        </div>
</template>

<script setup>
import { ref, shallowRef, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import db from '../services/database.js';

import AppIcon from '../components/AppIcon.vue';

// Import App Icons
import IconAlbum from '../components/icons/IconAlbum.vue';
import IconChat from '../components/icons/IconChat.vue';
import IconMusic from '../components/icons/IconMusic.vue';
import IconPersonalization from '../components/icons/IconPersonalization.vue';
import IconSettings from '../components/icons/IconSettings.vue';
import IconWorldbook from '../components/icons/IconWorldbook.vue';

// Import widget components
import ClockWidget from '../components/widgets/ClockWidget.vue';
//import MusicPlayerWidget from '../components/widgets/MusicPlayerWidget.vue';
//import PhotoWidget from '../components/widgets/PhotoWidget.vue';
//import CalendarWidget from '../components/widgets/CalendarWidget.vue';

// --- State Management ---
const isEditMode = ref(false);
const draggingIndex = ref(null);
const isWidgetDrawerOpen = ref(false); // State for the new widget drawer
const router = useRouter();

// This map links a simple string name to the actual imported component.
// This is crucial for saving/loading from localStorage.
const componentMap = {
        'IconChat': IconChat,
        'IconSettings': IconSettings,
        'IconPersonalization': IconPersonalization,
        'IconAlbum': IconAlbum,
        'IconMusic': IconMusic,
        'IconWorldbook': IconWorldbook,
        'ClockWidget': ClockWidget,
};

const screenItems = shallowRef([]);


const saveLayout = async () => {
        try {
                const storableLayout = screenItems.value.map(item => {
                        const componentName = Object.keys(componentMap).find(key => componentMap[key] === item.component);
                        return { ...item, component: componentName };
                });

                // 使用 .put() 来新增或更新记录。我们使用一个固定的id来保证只存一份布局。
                await db.homeScreenLayout.put({
                        id: 'mainLayout',
                        layout: storableLayout
                });
                console.log('Layout saved to IndexedDB.');
        } catch (error) {
                console.error('Failed to save layout:', error);
        }
};

const loadLayout = async () => {
        // 从数据库读取布局记录
        const savedConfig = await db.homeScreenLayout.get('mainLayout');
        let layoutToLoad;

        if (savedConfig && savedConfig.layout) {
                // 如果有，使用保存的布局
                layoutToLoad = savedConfig.layout;
                console.log('Layout loaded from IndexedDB.');
        } else {
                // 否则，使用默认布局
                console.log('No saved layout found, using default.');
                layoutToLoad = [
                        {id: 'chat', type: 'app', component: 'IconChat', name: '弦镜', route: '/chat', gridSpan: { col: 1, row: 1 }},
                        {id: 'settings', type: 'app', component: 'IconSettings', name: '设置', route: '/settings', gridSpan: { col: 1, row: 1 }},
                        {id: 'personalization', type: 'app', component: 'IconPersonalization', name: '个性化', route: '/personalization', gridSpan: { col: 1, row: 1 }},
                        {id: 'album', type: 'app', component: 'IconAlbum', name: '相册', route: '/album', gridSpan: { col: 1, row: 1 }},
                        {id: 'music', type: 'app', component: 'IconMusic', name: '音乐', route: '/music', gridSpan: { col: 1, row: 1 }},
                        {id: 'worldbook', type: 'app', component: 'IconWorldbook', name: '世界书', route: '/worldbook', gridSpan: { col: 1, row: 1 }}
                ];
        }

        // 将字符串标识的组件转换回真实的Vue组件
        screenItems.value = layoutToLoad.map(item => ({
                ...item,
                component: componentMap[item.component],
        }));
};

// --- Lifecycle Hook ---
onMounted(async () => {
        await loadLayout();
});

// --- Long Press Logic ---
let pressTimer = null;
let isDragging = false;

const onMouseDown = (app) => {
        if (isEditMode.value) return;
        isDragging = false;
        pressTimer = setTimeout(() => {
                if (!isDragging) {
                        isEditMode.value = true;
                }
        }, 500);
};

const onMouseUp = () => {
        clearTimeout(pressTimer);
};

const onMouseMove = () => {
        isDragging = true;
        clearTimeout(pressTimer);
};

// --- Click Logic ---
const handleClick = (item) => {
        // 这样可以确保只有 App 类型的项目会触发路由跳转，从而避免在点击 Widget 时报错。
        if (!isEditMode.value && !isDragging && item.type === 'app') {
                router.push(item.route);
        }
};
// --- Drag and Drop Logic ---
const handleDragStart = (index) => {
        draggingIndex.value = index;
};

const handleDrop = (targetIndex) => {
        if (draggingIndex.value === null || draggingIndex.value === targetIndex) return;

        // 同样，先创建副本
        const newItems = [...screenItems.value];
        // 在副本上操作
        const item = newItems.splice(draggingIndex.value, 1)[0];
        newItems.splice(targetIndex, 0, item);
        // 赋值新数组
        screenItems.value = newItems;
        saveLayout();
};

const handleDragEnd = () => {
        draggingIndex.value = null;
};

// --- Widget Drawer Logic ---
const openWidgetDrawer = () => {
        isWidgetDrawerOpen.value = true;
};

// --- Delete Item ---
const deleteItem = (index) => {
        // 1. 创建一个 screenItems 数组的副本
        const newItems = [...screenItems.value];
        // 2. 在副本上进行修改
        newItems.splice(index, 1);
        // 3. 将修改后的新数组赋给 screenItems.value 来触发更新
        screenItems.value = newItems;
        saveLayout();
};

// --- Draw Widget Logic ---
const availableWidgets = [
        {
                name: '数字时钟',
                component: ClockWidget,
                gridSpan: { col: 2, row: 1 },
                previewClass: 'clock-preview' // 用于在抽屉里显示预览样式
        },
        // 未来可以添加更多小组件
        // { name: '照片', component: PhotoWidget, ... },
];

const addWidgetToScreen = (widgetBlueprint) => {
        const newWidget = {
                ...widgetBlueprint,
                id: `widget-${Date.now()}`,
                type: 'widget',
        };

        // 使用扩展运算符创建新数组，以正确触发 shallowRef 的更新
        screenItems.value = [...screenItems.value, newWidget];

        isWidgetDrawerOpen.value = false;
        saveLayout();
};

</script>


<style scoped>
.home-screen {
        width: 100vw;
        height: 100vh;
        background-color: #000000;
        padding: 20px;
        padding-top: 80px;
        /* 为顶部按钮留出空间 */
        box-sizing: border-box;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        position: relative;
}

/* --- Top Buttons --- */
.top-buttons {
        position: absolute;
        top: 20px;
        left: 20px;
        right: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        z-index: 100;
}

.add-button,
.done-button {
        padding: 8px 16px;
        /* 使用 padding 来控制大小 */
        border-radius: 999px;
        /* 使用一个很大的值来确保两端是完美的半圆 */
        border: none;
        background-color: rgba(255, 255, 255, 0.2);
        color: white;
        font-size: 16px;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: background-color 0.2s ease;
        width: 70px;
        height: 30px;
        box-sizing: border-box;

        /* 毛玻璃效果的关键 */
        -webkit-backdrop-filter: blur(10px);
        backdrop-filter: blur(10px);
}

.done-button {
        font-size: 16px;
        font-weight: bold;
}


.add-button:hover,
.done-button:hover {
        background-color: rgba(255, 255, 255, 0.4);
}


.app-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);

        grid-auto-rows: 100px;
        /* 假设一个app图标加上文字的高度是100px, 请根据实际情况调整 */
        gap: 20px;
}

.grid-item {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        transition: transform 0.2s ease-in-out;
}

.grid-item.dragging {
        opacity: 0.5;
        transform: scale(1.1);
}

.delete-button {
        position: absolute;
        top: -5px;
        left: -5px;
        width: 22px;
        height: 22px;
        background-color: #ff3b30;
        color: var(--text-primary);
        border: 2px solid var(--border-color);
        border-radius: 50%;
        font-size: 16px;
        font-weight: bold;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        z-index: 10;
        padding: 0;
        line-height: 1;
        /* 确保 "-" 垂直居中 */
}

/* --- Jiggle Animation --- */
@keyframes jiggle {
        0% {
                transform: rotate(0deg);
        }

        25% {
                transform: rotate(-1.5deg);
        }

        50% {
                transform: rotate(0deg);
        }

        75% {
                transform: rotate(1.5deg);
        }

        100% {
                transform: rotate(0deg);
        }
}

.grid-item.edit-mode {
        animation-name: jiggle;
        animation-iteration-count: infinite;
        cursor: grab;
}

/* 为不同的图标添加随机延迟和持续时间，使其看起来更自然 */
.grid-item.edit-mode:nth-child(4n+1) {
        animation-duration: 0.3s;
        animation-delay: 0.05s;
}

.grid-item.edit-mode:nth-child(4n+2) {
        animation-duration: 0.35s;
        animation-delay: 0s;
}

.grid-item.edit-mode:nth-child(4n+3) {
        animation-duration: 0.28s;
        animation-delay: 0.1s;
}

.grid-item.edit-mode:nth-child(4n+4) {
        animation-duration: 0.32s;
        animation-delay: 0.02s;
}


.grid-item.edit-mode:active {
        cursor: grabbing;
}

/* --- Widget Drawer Styles --- */
.widget-drawer-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: var(--border-color);
        z-index: 1000;
        display: flex;
        justify-content: center;
        align-items: flex-end;
}

.widget-drawer {
        width: 100%;
        max-width: 500px;
        /* 在大屏幕上限制最大宽度 */
        height: 60%;
        background-color: var(--bg-primary);
        border-radius: 20px 20px 0 0;
        padding: 20px;
        box-sizing: border-box;
        color: var(--text-primary);
        animation: slide-up 0.3s ease-out;
        -webkit-backdrop-filter: blur(20px);
        backdrop-filter: blur(20px);
}

@keyframes slide-up {
        from {
                transform: translateY(100%);
        }

        to {
                transform: translateY(0);
        }
}

.widget-list {
        margin-top: 20px;
}

.widget-option {
        background-color: rgba(255, 255, 255, 0.1);
        padding: 15px;
        border-radius: 15px;
        margin-bottom: 15px;
        cursor: pointer;
        transition: background-color 0.2s ease;
}

.widget-option:hover {
        background-color: rgba(255, 255, 255, 0.2);
}

.widget-option p {
        margin: 0 0 10px 0;
        font-weight: bold;
}

.widget-preview {
        height: 80px;
        border-radius: 10px;
        background-color: rgba(0, 0, 0, 0.3);
}

/* 针对时钟预览的特定样式 */
.clock-preview {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        color: white;
}

.clock-preview::after {
        content: "15:57";
        /* 显示一个静态的预览时间 */
}

/* --- Widget Styles --- */

.widget-component {
        width: 100%;
        height: 100%;
}

</style>
    
