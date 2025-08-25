<template>
        <div class="home-screen" :class="{ 'edit-mode': isEditMode }" @click.self="isEditMode = false" @dragover.prevent
                @drop.prevent="handleDropOnEmpty" @touchstart.passive="handleSwipeStart($event)"
                @touchmove="handleSwipeMove($event)" @touchend="handleSwipeEnd()">
                <!-- Top Buttons for Edit Mode -->
                <div v-if="isEditMode" class="top-buttons">
                        <button @click="openWidgetDrawer" class="add-button">
                                <span class="button-icon">+</span>
                        </button>
                        <button @click="isEditMode = false" class="done-button">
                                <span class="button-text">完成</span>
                        </button>
                </div>

                <div class="app-grid-container" :class="{ 'swiping': isSwipeInProgress }" :style="{ 
                        transform: `translateX(${pageTransform}px)`,
                        width: `${visiblePages.length * 100}vw`
                     }">
                        <div v-for="pageIndex in visiblePages" :key="pageIndex" class="page-container"
                                :class="{ 'current-page': pageIndex === currentPage }" :style="{ width: '100vw' }">
                                <div class="app-grid" @dragover.prevent @drop.prevent="handleDropOnGrid" :style="{
                                        '--cols': gridConfig.cols,
                                        '--rows': gridConfig.rows,
                                        '--cell-size': gridConfig.cellSize + 'px',
                                        '--gap': gridConfig.gap + 'px'
                                     }">
                                        <div v-for="(item, index) in getPageItems(pageIndex)" :key="item.id"
                                                class="grid-item" :data-index="index" :data-page="pageIndex" :class="{
                                                'edit-mode': isEditMode,
                                                'dragging': draggingIndex === index && currentPage === pageIndex
                                                }" :style="{
                                                gridColumn: `${item.gridPosition?.col + 1} / span ${item.gridSpan.col}`,
                                                gridRow: `${item.gridPosition?.row + 1} / span ${item.gridSpan.row}`,
                                                '--cell-size': gridConfig.cellSize + 'px',
                                                '--gap': gridConfig.gap + 'px'
                                                }" :draggable="isEditMode && currentPage === pageIndex"
                                                @dragstart="currentPage === pageIndex && handleDragStart(index)"
                                                @dragover.prevent
                                                @drop.prevent="currentPage === pageIndex && handleDrop(index)"
                                                @dragend="currentPage === pageIndex && handleDragEnd"
                                                @mousedown="currentPage === pageIndex && onMouseDown(item, index)"
                                                @mouseup="currentPage === pageIndex && onMouseUp"
                                                @mousemove="currentPage === pageIndex && onMouseMove"
                                                @touchstart="currentPage === pageIndex && onTouchStart(item, index, $event)"
                                                @touchend="currentPage === pageIndex && onTouchEnd($event)"
                                                @touchmove="currentPage === pageIndex && onTouchMove($event)"
                                                @click.prevent="currentPage === pageIndex && handleClick(item)">
                                                <button v-if="isEditMode && item.type === 'widget' && currentPage === pageIndex"
                                                        @click.stop="deleteItem(index)" @touchstart.stop
                                                        @touchend.stop="deleteItem(index)"
                                                        class="delete-button">×</button>

                                                <!-- 如果是 App，渲染 AppIcon -->
                                                <AppIcon v-if="item.type === 'app'" :name="item.name">
                                                        <component :is="item.component" />
                                                </AppIcon>

                                                <!-- 如果是 Widget，用类似AppIcon的结构包装 -->
                                                <div v-else-if="item.type === 'widget'" class="widget-wrapper">
                                                        <div class="widget-container">
                                                                <component :is="item.component" class="widget-component"
                                                                        :widgetId="item.id"
                                                                        :widgetSize="item.gridSpan" />
                                                        </div>
                                                </div>
                                        </div>
                                </div>
                        </div>
                </div>

                <!-- 分页指示器 -->
                <div v-if="totalPages > 1" class="page-indicators">
                        <div v-for="page in totalPages" :key="page" class="page-dot"
                                :class="{ active: currentPage === page - 1 }" @click="goToPage(page - 1)">
                        </div>
                </div>

                <!-- Widget Drawer -->
                <div v-if="isWidgetDrawerOpen" class="widget-drawer-overlay" @click="isWidgetDrawerOpen = false">
                        <div class="widget-drawer" @click.stop
                                :style="{ '--cols': gridConfig.cols, '--gap': gridConfig.gap + 'px' }">

                                <h2>添加小组件</h2>
                                <div class="widget-grid">
                                        <!-- 使用4x4网格布局展示小组件 -->
                                        <div v-for="widget in availableWidgets" :key="widget.name"
                                                class="widget-grid-item" :style="{
                                                gridColumn: `span ${widget.gridSpan.col}`,
                                                gridRow: `span ${widget.gridSpan.row}`
                                             }" @click="addWidgetToScreen(widget)">
                                                <div class="widget-preview-container">
                                                        <div class="widget-preview" :class="widget.previewClass">
                                                                <div v-if="widget.previewSvg" v-html="widget.previewSvg"
                                                                        class="svg-preview-wrapper"></div>
                                                        </div>
                                                        <p class="widget-preview-name">{{ widget.name }}</p>
                                                </div>
                                        </div>
                                </div>
                        </div>
                </div>
        </div>
</template>

<script setup>
import { ref, shallowRef, onMounted, onBeforeUnmount, watchEffect, createApp, computed } from 'vue';
import { useRouter } from 'vue-router';
import db from '../services/database.js';
import { getContrastTextColor } from '../utils/colorUtils.js';

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
import PhotoWidget from '../components/widgets/PhotoWidget.vue';
//import MusicPlayerWidget from '../components/widgets/MusicPlayerWidget.vue';
import CalendarWidget from '../components/widgets/CalendarWidget.vue';

// --- State Management ---
const isEditMode = ref(false);
const draggingIndex = ref(null);
const isWidgetDrawerOpen = ref(false); // State for the new widget drawer
const currentPage = ref(0); // 当前页面索引（从0开始）
const gridConfig = ref({ cols: 4, rows: 4, itemsPerPage: 16 }); // 动态网格配置
const router = useRouter();

// 滑动相关状态
const isSwipeInProgress = ref(false);
const swipeStartX = ref(0);
const swipeStartY = ref(0);
const swipeCurrentX = ref(0);
const pageTransform = ref(0);

// 无缝换页相关状态
const visiblePages = ref([]); // 当前可见的页面
const containerWidth = ref(0); // 容器宽度
const pageWidth = ref(0); // 单页宽度

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
        'PhotoWidget': PhotoWidget,
        'CalendarWidget': CalendarWidget
};

const screenItems = shallowRef([]);

// 动态计算网格配置
const calculateGridConfig = () => {
        try {
                const homeScreen = document.querySelector('.home-screen');
                if (!homeScreen) {
                        // 使用默认配置
                        gridConfig.value = { cols: 4, rows: 4, itemsPerPage: 16, cellSize: 80, gap: 12 };
                        return;
                }
                
                const rect = homeScreen.getBoundingClientRect();
                const screenWidth = rect.width;
                const screenHeight = rect.height;
                const isLandscape = screenWidth > screenHeight; // 判断是否为横屏
                
                // 根据横屏/竖屏决定列数
                const cols = isLandscape ? 6 : 4;
                
                // 优化移动端边距计算
                const isEditMode = document.querySelector('.home-screen.edit-mode');
                const topSpace = window.innerWidth <= 768 ? 80 : 100; // 顶部按钮空间
                const bottomSpace = 80; // 底部分页指示器空间
                const editPadding = isEditMode ? 20 : 0; // 编辑模式额外留白
                
                const availableWidth = screenWidth - editPadding * 2;
                const availableHeight = screenHeight - topSpace - bottomSpace - editPadding * 2;
                
                // 计算间距和单元格大小，使其保持正方形且间距与app宽度成比例
                // 设定app间距为app宽度的比例（横屏时更紧凑）
                const gapRatio = isLandscape ? 0.5 : 0.6;
                
                // 解方程: padding + gap * (cols - 1) + cellSize * cols + padding = availableWidth
                // 其中 gap = cellSize * gapRatio, padding = gap
                // 即: gap + gap * (cols - 1) + cellSize * cols + gap = availableWidth
                // gap * (cols + 1) + cellSize * cols = availableWidth
                // cellSize * gapRatio * (cols + 1) + cellSize * cols = availableWidth
                // cellSize * (gapRatio * (cols + 1) + cols) = availableWidth
                const cellSize = availableWidth / (gapRatio * (cols + 1) + cols);
                const gap = cellSize * gapRatio;
                
                // 计算可容纳的行数
                const maxCellHeight = Math.min(cellSize, (availableHeight - gap * 2) / 4); // 至少4行
                const actualCellSize = Math.max(50, Math.min(cellSize, maxCellHeight)); // 确保最小和最大尺寸
                const actualGap = Math.max(6, actualCellSize * gapRatio); // 确保最小间距
                
                const rows = Math.max(4, Math.floor((availableHeight - actualGap * 2) / (actualCellSize + actualGap)) + 1);
                
                gridConfig.value = {
                        cols,
                        rows,
                        itemsPerPage: cols * rows,
                        cellSize: actualCellSize,
                        gap: actualGap,
                        isLandscape
                };
                
                // 更新页面尺寸
                pageWidth.value = availableWidth;
                containerWidth.value = availableWidth;
                
                // 更新可见页面
                updateVisiblePages();
                
                console.log('Grid config calculated:', {
                        ...gridConfig.value,
                        totalWidth: actualGap + (actualCellSize + actualGap) * cols,
                        availableWidth,
                        screenDimensions: `${screenWidth}x${screenHeight}`,
                        orientation: isLandscape ? 'landscape' : 'portrait'
                });
        } catch (error) {
                console.error('Error calculating grid config:', error);
                // 使用默认配置
                gridConfig.value = { cols: 4, rows: 4, itemsPerPage: 16, cellSize: 80, gap: 12, isLandscape: false };
        }
};

// 分页相关的computed属性
const totalPages = computed(() => {
        if (screenItems.value.length === 0) return 1;
        
        const grid = createGridLayout();
        return grid.totalPages;
});

// 创建网格布局算法
const createGridLayout = () => {
        const items = screenItems.value;
        const { cols, rows, itemsPerPage } = gridConfig.value;
        
        let pages = [];
        let currentPage = [];
        let currentGrid = Array(rows).fill(null).map(() => Array(cols).fill(false));
        let currentPageItemCount = 0;
        
        for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const { col: itemCols, row: itemRows } = item.gridSpan;
                
                // 在当前页寻找可用位置
                let placed = false;
                let foundRow = -1, foundCol = -1;
                
                // 逐行查找可用位置
                for (let row = 0; row <= rows - itemRows && !placed; row++) {
                        for (let col = 0; col <= cols - itemCols && !placed; col++) {
                                // 检查这个位置是否可以放置项目
                                let canPlace = true;
                                for (let r = row; r < row + itemRows && canPlace; r++) {
                                        for (let c = col; c < col + itemCols && canPlace; c++) {
                                                if (currentGrid[r][c]) {
                                                        canPlace = false;
                                                }
                                        }
                                }
                                
                                if (canPlace) {
                                        // 标记占用的格子
                                        for (let r = row; r < row + itemRows; r++) {
                                                for (let c = col; c < col + itemCols; c++) {
                                                        currentGrid[r][c] = true;
                                                }
                                        }
                                        foundRow = row;
                                        foundCol = col;
                                        placed = true;
                                }
                        }
                }
                
                if (placed) {
                        currentPage.push({ ...item, gridPosition: { row: foundRow, col: foundCol } });
                        currentPageItemCount++;
                } else {
                        // 当前页放不下，创建新页面
                        pages.push(currentPage);
                        currentPage = [{ ...item, gridPosition: { row: 0, col: 0 } }];
                        currentGrid = Array(rows).fill(null).map(() => Array(cols).fill(false));
                        
                        // 标记新页面的第一个项目
                        for (let r = 0; r < item.gridSpan.row; r++) {
                                for (let c = 0; c < item.gridSpan.col; c++) {
                                        currentGrid[r][c] = true;
                                }
                        }
                        currentPageItemCount = 1;
                }
        }
        
        // 添加最后一页
        if (currentPage.length > 0) {
                pages.push(currentPage);
        }
        
        return {
                pages,
                totalPages: Math.max(1, pages.length)
        };
};

// 更新可见页面
const updateVisiblePages = () => {
        const total = totalPages.value;
        if (total <= 1) {
                visiblePages.value = [0];
                return;
        }
        
        // 计算需要渲染的页面范围
        const pages = [];
        const current = currentPage.value;
        
        // 总是包含当前页
        pages.push(current);
        
        // 添加前一页（如果存在）
        if (current > 0) {
                pages.unshift(current - 1);
        }
        
        // 添加后一页（如果存在）
        if (current < total - 1) {
                pages.push(current + 1);
        }
        
        // 如果只有两页，确保都被渲染
        if (total === 2) {
                pages.length = 0;
                pages.push(0, 1);
        }
        
        visiblePages.value = [...new Set(pages)].sort();
        
        // 调试信息
        const grid = createGridLayout();
        console.log('Grid layout updated:', {
                totalPages: grid.totalPages,
                visiblePages: visiblePages.value,
                currentPage: current,
                pagesInfo: grid.pages.map((page, index) => ({
                        page: index,
                        items: page.length,
                        itemNames: page.map(item => item.name || item.type)
                }))
        });
};

// 计算指定页面的项目
const getPageItems = (pageIndex) => {
        if (screenItems.value.length === 0) return [];
        
        const grid = createGridLayout();
        return grid.pages[pageIndex] || [];
};

// 分页导航函数
const goToPage = (pageIndex) => {
        if (pageIndex >= 0 && pageIndex < totalPages.value) {
                currentPage.value = pageIndex;
                pageTransform.value = 0; // 重置变换
                updateVisiblePages(); // 更新可见页面
        }
};

// 滑动切换页面功能
const handleSwipeStart = (event) => {
        if (isEditMode.value) return; // 编辑模式下禁用滑动
        
        const clientX = event.touches ? event.touches[0].clientX : event.clientX;
        const clientY = event.touches ? event.touches[0].clientY : event.clientY;
        
        isSwipeInProgress.value = true;
        swipeStartX.value = clientX;
        swipeStartY.value = clientY;
        swipeCurrentX.value = clientX;
        
        // 鼠标事件需要阻止默认行为
        if (!event.touches) {
                event.preventDefault();
        }
};

const handleSwipeMove = (event) => {
        if (!isSwipeInProgress.value || isEditMode.value) return;
        
        const clientX = event.touches ? event.touches[0].clientX : event.clientX;
        const clientY = event.touches ? event.touches[0].clientY : event.clientY;
        
        swipeCurrentX.value = clientX;
        const deltaX = clientX - swipeStartX.value;
        const deltaY = Math.abs(clientY - swipeStartY.value);
        
        // 如果垂直滑动距离太大，取消水平滑动
        if (deltaY > 50) {
                isSwipeInProgress.value = false;
                pageTransform.value = 0;
                return;
        }
        
        // 计算页面变换：基于当前页面在可见页面数组中的位置
        const currentPageIndexInVisible = visiblePages.value.indexOf(currentPage.value);
        const baseTransform = -currentPageIndexInVisible * pageWidth.value;
        
        // 限制滑动范围
        const maxSwipe = pageWidth.value * 0.8;
        const limitedDelta = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));
        
        // 边界阻尼效果
        if ((currentPage.value === 0 && deltaX > 0) || 
            (currentPage.value === totalPages.value - 1 && deltaX < 0)) {
                pageTransform.value = baseTransform + limitedDelta * 0.3; // 减少阻尼
        } else {
                pageTransform.value = baseTransform + limitedDelta;
        }
        
        // 阻止默认滚动
        if (Math.abs(deltaX) > 10) {
                event.preventDefault();
        }
};

const handleSwipeEnd = () => {
        if (!isSwipeInProgress.value) return;
        
        const deltaX = swipeCurrentX.value - swipeStartX.value;
        const threshold = pageWidth.value * 0.3; // 滑动阈值
        
        // 判断是否应该切换页面
        if (Math.abs(deltaX) > threshold) {
                if (deltaX > 0 && currentPage.value > 0) {
                        // 向右滑动，上一页
                        goToPage(currentPage.value - 1);
                } else if (deltaX < 0 && currentPage.value < totalPages.value - 1) {
                        // 向左滑动，下一页
                        goToPage(currentPage.value + 1);
                }
        } else {
                // 回弹到当前页
                const currentPageIndexInVisible = visiblePages.value.indexOf(currentPage.value);
                pageTransform.value = -currentPageIndexInVisible * pageWidth.value;
        }
        
        // 重置状态
        isSwipeInProgress.value = false;
};


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
        // 加载全局设置以应用个性化设置
        await loadGlobalSettings();
        
        // 计算网格配置
        calculateGridConfig();
        
        // 监听窗口大小变化
        window.addEventListener('resize', calculateGridConfig);
        
        // 监听键盘事件以支持PC端导航
        window.addEventListener('keydown', handleKeyNavigation);
});

// 监听totalPages变化以更新可见页面
watchEffect(() => {
        updateVisiblePages();
});

// 监听当前页变化以更新变换
watchEffect(() => {
        if (!isSwipeInProgress.value) {
                const currentPageIndexInVisible = visiblePages.value.indexOf(currentPage.value);
                if (currentPageIndexInVisible !== -1) {
                        pageTransform.value = -currentPageIndexInVisible * pageWidth.value;
                }
        }
});

// 清理事件监听器
onBeforeUnmount(() => {
        window.removeEventListener('resize', calculateGridConfig);
        window.removeEventListener('keydown', handleKeyNavigation);
});

// PC端键盘导航
const handleKeyNavigation = (event) => {
        if (isEditMode.value) return; // 编辑模式下禁用键盘导航
        
        switch (event.key) {
                case 'ArrowLeft':
                        if (currentPage.value > 0) {
                                event.preventDefault();
                                goToPage(currentPage.value - 1);
                        }
                        break;
                case 'ArrowRight':
                        if (currentPage.value < totalPages.value - 1) {
                                event.preventDefault();
                                goToPage(currentPage.value + 1);
                        }
                        break;
                case 'Home':
                        event.preventDefault();
                        goToPage(0);
                        break;
                case 'End':
                        event.preventDefault();
                        goToPage(totalPages.value - 1);
                        break;
        }
};

// 应用字体
function applyFont(font) {
        if (!font) return;
        
        // 创建style标签用于@font-face
        let styleTag = document.getElementById('dynamic-font-style');
        if (!styleTag) {
                styleTag = document.createElement('style');
                styleTag.id = 'dynamic-font-style';
                document.head.appendChild(styleTag);
        }
        
        // 检查URL类型并相应处理
        if (font.url) {
                if (font.url.includes('googleapis.com') || font.url.endsWith('.css')) {
                        // 使用link标签加载CSS
                        const linkId = `font-link-${font.id}`;
                        let linkTag = document.getElementById(linkId);
                        
                        if (!linkTag) {
                                linkTag = document.createElement('link');
                                linkTag.id = linkId;
                                linkTag.rel = 'stylesheet';
                                linkTag.href = font.url;
                                document.head.appendChild(linkTag);
                        }
                } else {
                        // 处理直接字体文件，使用@font-face
                        const fontName = font.family || `custom-font-${font.id}`;
                        const format = getFontFormat(font.url);
                        
                        const fontFaceRule = `
                                @font-face {
                                        font-family: "${fontName}";
                                        src: url("${font.url}") format("${format}");
                                        font-display: swap;
                                }
                        `;
                        
                        // 只有在还没有添加过这个字体的情况下添加
                        if (!styleTag.textContent.includes(font.url)) {
                                styleTag.textContent += fontFaceRule;
                        }
                }
        }
        
        // 应用字体族
        const systemFont = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
        document.body.style.fontFamily = font.family ? `${font.family}, ${systemFont}` : systemFont;
}

// 获取字体格式
function getFontFormat(url) {
        if (url.endsWith('.otf')) return 'opentype';
        if (url.endsWith('.ttf')) return 'truetype';
        if (url.endsWith('.woff')) return 'woff';
        if (url.endsWith('.woff2')) return 'woff2';
        return 'opentype'; // 默认为opentype
}

// 加载全局设置并应用壁纸和主题
async function loadGlobalSettings() {
  try {
    const settings = await db.globalSettings.get('global');
    if (settings) {
      // 应用壁纸
      if (settings.wallpaper) {
        const homeScreen = document.querySelector('.home-screen');
        
        // 清除之前的背景和动态组件
        homeScreen.style.backgroundImage = 'none';
        homeScreen.style.background = 'none';
        
        // 移除可能存在的旧渐变容器
        const existingGradient = document.getElementById('home-gradient-container');
        if (existingGradient) {
          existingGradient.remove();
        }
        
        // 确保homeScreen是一个定位上下文
        homeScreen.style.position = 'relative';
        
        // 根据不同壁纸类型处理
        if (settings.wallpaper.startsWith('animated(')) {
          // 处理动态渐变壁纸
          const match = settings.wallpaper.match(/animated\((.*?),(.*?),(\d+)\)/);
          if (match) {
            const [_, color1, color2, angle] = match;
            
            console.log('应用动态渐变壁纸:', color1, color2, angle);
            
            // 直接在主屏幕上应用渐变样式
            const gradientStyle = `linear-gradient(${angle}deg, ${color1} 0%, ${color2} 100%)`;
            homeScreen.style.background = gradientStyle;
            homeScreen.style.backgroundSize = '200% 200%';
            homeScreen.style.animation = `gradientAnimation 6s ease infinite`;
            
          }
        } else {
          // 处理普通壁纸
          homeScreen.style.backgroundImage = settings.wallpaper;
          homeScreen.style.backgroundSize = 'cover';
          homeScreen.style.backgroundPosition = 'center';
        }
      }
      
      // 应用主题色
      if (settings.themeColor) {
        document.documentElement.style.setProperty('--accent-primary', settings.themeColor);
        
        // 计算并设置对比文本颜色
        const textColor = getContrastTextColor(settings.themeColor);
        document.documentElement.style.setProperty('--accent-text', textColor);
      }
      
      // 应用字体
      if (settings.activeFontId) {
        const font = await db.fonts.get(settings.activeFontId);
        if (font) {
          applyFont(font);
        }
      }
    }
  } catch (error) {
    console.error('加载全局设置失败:', error);
  }
}

// --- Long Press Logic ---
let pressTimer = null;
let isDragging = false;
let touchStartTime = 0;
let touchStartPos = { x: 0, y: 0 };

const onMouseDown = (item, index) => {
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

// 触摸事件处理 - 简化版本
const onTouchStart = (item, index, event) => {
        const touch = event.touches[0];
        touchStartTime = Date.now();
        touchStartPos = { x: touch.clientX, y: touch.clientY };
        isDragging = false;
        
        // 阻止事件冒泡
        event.stopPropagation();
        
        if (isEditMode.value) {
                // 编辑模式下直接开始拖拽
                handleTouchDragStart(index, event);
        } else {
                // 非编辑模式下设置长按定时器
                pressTimer = setTimeout(() => {
                        if (!isDragging && !isSwipeInProgress.value) {
                                isEditMode.value = true;
                                // 添加触觉反馈（如果支持）
                                if (navigator.vibrate) {
                                        navigator.vibrate(50);
                                }
                                // 进入编辑模式后立即开始拖拽
                                setTimeout(() => {
                                        if (isEditMode.value) {
                                                handleTouchDragStart(index, event);
                                        }
                                }, 50);
                        }
                }, 500);
        }
};

const onTouchEnd = (event) => {
        clearTimeout(pressTimer);
        
        if (isEditMode.value && touchDragData && touchDragData.isDragging) {
                handleTouchDragEnd();
        }
        
        // 清除视觉反馈
        const gridItems = document.querySelectorAll('.grid-item');
        gridItems.forEach(item => {
                item.style.transform = '';
                item.style.zIndex = '';
                item.style.opacity = '';
        });
};

const onTouchMove = (event) => {
        if (!event.touches[0]) return;
        
        const touch = event.touches[0];
        const deltaX = Math.abs(touch.clientX - touchStartPos.x);
        const deltaY = Math.abs(touch.clientY - touchStartPos.y);
        
        // 降低拖拽阈值，提高响应性
        if (deltaX > 8 || deltaY > 8) {
                isDragging = true;
                clearTimeout(pressTimer);
                
                if (isEditMode.value && touchDragData) {
                        // 防止页面滚动和默认行为
                        event.preventDefault();
                        event.stopPropagation();
                        handleTouchDragMove(event);
                        
                        // 检查是否拖拽到边缘
                        handleDragToEdge(touch.clientY);
                }
        }
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

        // 计算真实的全局索引
        const realDraggingIndex = getRealIndexFromPageIndex(draggingIndex.value, currentPage.value);
        const realTargetIndex = getRealIndexFromPageIndex(targetIndex, currentPage.value);
        
        if (realDraggingIndex === -1 || realTargetIndex === -1) return;

        // 创建副本并重新排列
        const newItems = [...screenItems.value];
        const item = newItems.splice(realDraggingIndex, 1)[0];
        newItems.splice(realTargetIndex, 0, item);
        
        screenItems.value = newItems;
        saveLayout();
        updateVisiblePages();
};

// 处理拖拽到网格区域
const handleDropOnGrid = (event) => {
        if (draggingIndex.value === null) return;
        event.preventDefault();
        
        // 如果拖拽到空白区域，尝试将项目移动到当前页面的末尾
        const realDraggingIndex = getRealIndexFromPageIndex(draggingIndex.value, currentPage.value);
        if (realDraggingIndex === -1) return;
        
        // 重新触发网格布局计算
        updateVisiblePages();
        draggingIndex.value = null;
};

const handleDragEnd = () => {
        draggingIndex.value = null;
};

// 处理拖拽到屏幕边缘切换页面
let dragToEdgeTimeout = null;
const handleDragToEdge = (clientY) => {
        if (!isEditMode.value || draggingIndex.value === null) return false;
        
        // 防抖处理，避免频繁切换
        if (dragToEdgeTimeout) return false;
        
        const screenHeight = window.innerHeight;
        const edgeThreshold = 100; // 边缘触发区域
        
        let shouldChangePage = false;
        
        if (clientY < edgeThreshold && currentPage.value > 0) {
                // 拖拽到顶部，切换到上一页
                shouldChangePage = true;
                dragToEdgeTimeout = setTimeout(() => {
                        if (draggingIndex.value !== null) {
                                moveItemToPage(draggingIndex.value, currentPage.value - 1);
                                goToPage(currentPage.value - 1);
                        }
                        dragToEdgeTimeout = null;
                }, 500);
        } else if (clientY > screenHeight - edgeThreshold && currentPage.value < totalPages.value - 1) {
                // 拖拽到底部，切换到下一页
                shouldChangePage = true;
                dragToEdgeTimeout = setTimeout(() => {
                        if (draggingIndex.value !== null) {
                                moveItemToPage(draggingIndex.value, currentPage.value + 1);
                                goToPage(currentPage.value + 1);
                        }
                        dragToEdgeTimeout = null;
                }, 500);
        }
        
        return shouldChangePage;
};

// 将项目移动到指定页面
const moveItemToPage = (pageItemIndex, targetPageIndex) => {
        const grid = createGridLayout();
        if (targetPageIndex < 0 || targetPageIndex >= grid.totalPages) return;
        
        const realIndex = getRealIndexFromPageIndex(pageItemIndex, currentPage.value);
        if (realIndex === -1) return;
        
        // 移动项目到指定页面的末尾
        const newItems = [...screenItems.value];
        const [movedItem] = newItems.splice(realIndex, 1);
        
        // 计算目标页面的插入位置
        let insertIndex = 0;
        for (let p = 0; p <= targetPageIndex && p < grid.pages.length; p++) {
                if (p < targetPageIndex) {
                        insertIndex += grid.pages[p].length;
                }
        }
        
        // 如果移动的项目在插入位置之前，需要调整索引
        if (realIndex < insertIndex) {
                insertIndex--;
        }
        
        newItems.splice(insertIndex, 0, movedItem);
        screenItems.value = newItems;
        saveLayout();
        updateVisiblePages();
};

// 处理拖拽到空白区域
const handleDropOnEmpty = (event) => {
        if (draggingIndex.value === null) return;
        event.preventDefault();
        // 如果拖到空白区域，保持原位置不变
        draggingIndex.value = null;
};

// 移动端拖拽支持
let touchDragData = null;

// 计算元素在网格中的位置
const getGridPosition = (element) => {
        const gridContainer = document.querySelector('.app-grid');
        const gridRect = gridContainer.getBoundingClientRect();
        const itemRect = element.getBoundingClientRect();
        
        // 计算网格单元大小
        const gridGap = 12; // 与CSS中的gap保持一致
        const gridWidth = gridRect.width;
        const cellWidth = (gridWidth - gridGap * 3) / 4; // 4列，3个gap
        const cellHeight = cellWidth; // 正方形网格
        
        // 计算当前元素占据的网格位置
        const startCol = Math.floor((itemRect.left - gridRect.left) / (cellWidth + gridGap));
        const startRow = Math.floor((itemRect.top - gridRect.top) / (cellHeight + gridGap));
        
        return { startCol, startRow, cellWidth, cellHeight };
};

// 根据触摸位置计算目标网格位置
const getTargetGridPosition = (clientX, clientY) => {
        const gridContainer = document.querySelector('.app-grid');
        if (!gridContainer) return { targetCol: -1, targetRow: -1 };
        
        const gridRect = gridContainer.getBoundingClientRect();
        const gridGap = gridConfig.value.gap || 12;
        const cellSize = gridConfig.value.cellSize || 80;
        const cols = gridConfig.value.cols || 4;
        
        const relativeX = clientX - gridRect.left - gridGap; // 减去左padding
        const relativeY = clientY - gridRect.top - gridGap; // 减去上padding
        
        const targetCol = Math.max(0, Math.min(cols - 1, Math.floor(relativeX / (cellSize + gridGap))));
        const targetRow = Math.max(0, Math.floor(relativeY / (cellSize + gridGap)));
        
        return { targetCol, targetRow };
};

// 检查指定位置是否被占用
const isPositionOccupied = (targetCol, targetRow, excludeIndex = -1) => {
        for (let i = 0; i < screenItems.value.length; i++) {
                if (i === excludeIndex) continue;
                
                const item = screenItems.value[i];
                const itemCol = getItemGridColumn(i);
                const itemRow = getItemGridRow(i);
                
                // 检查是否有重叠
                if (targetCol < itemCol + item.gridSpan.col &&
                    targetCol + 1 > itemCol &&
                    targetRow < itemRow + item.gridSpan.row &&
                    targetRow + 1 > itemRow) {
                        return true;
                }
        }
        return false;
};

// 获取元素在数组中的网格列位置
const getItemGridColumn = (index) => {
        let col = 0;
        let row = 0;
        
        for (let i = 0; i < index; i++) {
                const item = screenItems.value[i];
                col += item.gridSpan.col;
                
                if (col >= 4) {
                        // 换行处理
                        const overflow = col - 4;
                        row += item.gridSpan.row;
                        col = overflow;
                }
        }
        return col;
};

// 获取元素在数组中的网格行位置
const getItemGridRow = (index) => {
        let col = 0;
        let row = 0;
        
        for (let i = 0; i < index; i++) {
                const item = screenItems.value[i];
                col += item.gridSpan.col;
                
                if (col >= 4) {
                        // 换行处理
                        const overflow = col - 4;
                        row += item.gridSpan.row;
                        col = overflow;
                }
        }
        return row;
};

const handleTouchDragStart = (index, event) => {
        if (!isEditMode.value) return;
        
        const touch = event.touches[0];
        const element = event.currentTarget;
        
        // 防止默认行为
        event.preventDefault();
        event.stopPropagation();
        
        if (!element) return;

        // 添加视觉反馈
        element.style.transform = 'scale(1.05)';
        element.style.zIndex = '1000';
        element.style.opacity = '0.9';
        element.style.transition = 'none';
        
        touchDragData = {
                startIndex: index,
                startX: touch.clientX,
                startY: touch.clientY,
                isDragging: false,
                element: element
        };
        
        draggingIndex.value = index;
};

const handleTouchDragMove = (event) => {
        if (!touchDragData || !isEditMode.value) return;
        
        const touch = event.touches[0];
        const deltaX = Math.abs(touch.clientX - touchDragData.startX);
        const deltaY = Math.abs(touch.clientY - touchDragData.startY);
        
        // 降低拖拽阈值，提高响应性
        if (deltaX > 10 || deltaY > 10) {
                touchDragData.isDragging = true;
                
                // 阻止默认滚动行为
                event.preventDefault();
                event.stopPropagation();
                
                // 实时更新拖拽元素位置（视觉反馈）
                if (touchDragData.element) {
                        const offsetX = touch.clientX - touchDragData.startX;
                        const offsetY = touch.clientY - touchDragData.startY;
                        touchDragData.element.style.transform = `scale(1.1) translate(${offsetX}px, ${offsetY}px)`;
                        touchDragData.element.style.zIndex = '1000';
                }
                
                // 查找拖拽目标
                const targetElement = findDragTarget(touch.clientX, touch.clientY);
                if (targetElement && targetElement !== touchDragData.element) {
                        const targetIndex = parseInt(targetElement.dataset.index);
                        const targetPage = parseInt(targetElement.dataset.page);
                        
                        // 确保在同一页面内拖拽
                        if (targetPage === currentPage.value && 
                            targetIndex !== -1 && 
                            targetIndex !== touchDragData.startIndex) {
                                
                                // 简单的位置交换
                                handleDrop(targetIndex);
                                touchDragData.startIndex = targetIndex; // 更新当前位置
                        }
                }
                
                // 检查边缘切换页面
                handleDragToEdge(touch.clientY);
        }
};

// 查找拖拽目标元素
const findDragTarget = (clientX, clientY) => {
        // 临时隐藏正在拖拽的元素以便检测下方元素
        const draggingElement = touchDragData?.element;
        if (draggingElement) {
                draggingElement.style.pointerEvents = 'none';
        }
        
        const targetElement = document.elementFromPoint(clientX, clientY);
        
        // 恢复拖拽元素的指针事件
        if (draggingElement) {
                draggingElement.style.pointerEvents = '';
        }
        
        // 查找最近的grid-item元素
        return targetElement?.closest('.grid-item');
};

const handleTouchDragEnd = () => {
        if (!touchDragData) return;
        
        // 重置视觉状态
        if (touchDragData.element) {
                touchDragData.element.style.transform = '';
                touchDragData.element.style.zIndex = '';
                touchDragData.element.style.opacity = '';
                touchDragData.element.style.transition = '';
                touchDragData.element.style.pointerEvents = '';
        }
        
        const wasDragging = touchDragData.isDragging;
        touchDragData = null;
        draggingIndex.value = null;
        
        // 保存布局
        if (wasDragging) {
                saveLayout();
                updateVisiblePages();
        }
};

// --- Widget Drawer Logic ---
const openWidgetDrawer = () => {
        isWidgetDrawerOpen.value = true;
};

// --- Delete Item ---
const deleteItem = (index) => {
        // 计算当前页面项目在screenItems中的真实索引
        const realIndex = getRealIndexFromPageIndex(index, currentPage.value);
        
        if (realIndex >= 0 && realIndex < screenItems.value.length) {
                // 1. 创建一个 screenItems 数组的副本
                const newItems = [...screenItems.value];
                // 2. 在副本上进行修改
                newItems.splice(realIndex, 1);
                // 3. 将修改后的新数组赋给 screenItems.value 来触发更新
                screenItems.value = newItems;
                
                // 4. 检查当前页面是否还有项目，如果没有且不是第一页，则回到上一页
                setTimeout(() => {
                        const currentPageItemsCount = getPageItems(currentPage.value).length;
                        if (currentPageItemsCount === 0 && currentPage.value > 0) {
                                goToPage(Math.max(0, currentPage.value - 1));
                        }
                        updateVisiblePages();
                }, 100);
                
                saveLayout();
        }
};

// 根据网格位置查找插入索引
const findInsertIndexByPosition = (targetCol, targetRow) => {
        const grid = createGridLayout();
        const currentPageData = grid.pages[currentPage.value];
        if (!currentPageData) return -1;
        
        // 在当前页面中查找最接近的位置
        for (let i = 0; i < currentPageData.length; i++) {
                const item = currentPageData[i];
                if (item.gridPosition.row > targetRow || 
                    (item.gridPosition.row === targetRow && item.gridPosition.col >= targetCol)) {
                        return i;
                }
        }
        
        // 如果没找到，插入到末尾
        return currentPageData.length;
};

// 交换两个项目的位置
const swapItemPositions = (fromIndex, toIndex) => {
        const grid = createGridLayout();
        const currentPageData = grid.pages[currentPage.value];
        if (!currentPageData) return;
        
        // 计算真实的全局索引
        const realFromIndex = getRealIndexFromPageIndex(fromIndex, currentPage.value);
        const realToIndex = getRealIndexFromPageIndex(toIndex, currentPage.value);
        
        if (realFromIndex === -1 || realToIndex === -1) return;
        
        // 交换数组中的位置
        const newItems = [...screenItems.value];
        [newItems[realFromIndex], newItems[realToIndex]] = [newItems[realToIndex], newItems[realFromIndex]];
        screenItems.value = newItems;
        
        // 立即更新网格布局
        updateVisiblePages();
};

// 辅助函数：根据当前页面的索引获取在screenItems中的真实索引
const getRealIndexFromPageIndex = (pageIndex, targetPage = currentPage.value) => {
        const grid = createGridLayout();
        const pages = grid.pages;
        
        if (targetPage >= pages.length || pageIndex >= pages[targetPage].length) {
                return -1;
        }
        
        // 计算真实索引
        let realIndex = 0;
        for (let p = 0; p < targetPage; p++) {
                realIndex += pages[p].length;
        }
        realIndex += pageIndex;
        
        return realIndex;
};

// --- Draw Widget Logic ---
const availableWidgets = [
        {
                name: '小型时钟',
                component: ClockWidget,
                gridSpan: { col: 2, row: 1 },
                previewClass: 'clock-preview small-clock-preview'
        },
        {
                name: '中型时钟',
                component: ClockWidget,
                gridSpan: { col: 4, row: 2 },
                previewClass: 'clock-preview medium-clock-preview'
        },
        {
                name: '小照片',
                component: PhotoWidget,
                gridSpan: { col: 2, row: 2 },
                previewSvg: `
                <svg xmlns="http://www.w3.org/2000/svg"  fill="currentColor" class="bi bi-camera" viewBox="0 0 16 16">
                        <path d="M15 12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1.172a3 3 0 0 0 2.12-.879l.83-.828A1 1 0 0 1 6.827 3h2.344a1 1 0 0 1 .707.293l.828.828A3 3 0 0 0 12.828 5H14a1 1 0 0 1 1 1zM2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4z"/>
                        <path d="M8 11a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5m0 1a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M3 6.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0"/>
                </svg>`
        },
        {
                name: '小型日历',
                component: CalendarWidget,
                gridSpan: { col: 2, row: 2 },
                previewSvg: `
                <svg xmlns="http://www.w3.org/2000/svg"   fill="currentColor" class="bi bi-calendar-week" viewBox="0 0 16 16">
                        <path d="M11 6.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm-3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm-5 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5z"/>
                        <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z"/>
                </svg>`
        },
        {
                name: '大照片',
                component: PhotoWidget,
                gridSpan: { col: 4, row: 4 },
                previewSvg: `
                <svg xmlns="http://www.w3.org/2000/svg"   fill="currentColor" class="bi bi-camera" viewBox="0 0 16 16">
                        <path d="M15 12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1.172a3 3 0 0 0 2.12-.879l.83-.828A1 1 0 0 1 6.827 3h2.344a1 1 0 0 1 .707.293l.828.828A3 3 0 0 0 12.828 5H14a1 1 0 0 1 1 1zM2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4z"/>
                        <path d="M8 11a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5m0 1a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M3 6.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0"/>
                </svg>`
        },
        {
                name: '中型日历',
                component: CalendarWidget,
                gridSpan: { col: 4, row: 4 },
                previewSvg: `
                <svg xmlns="http://www.w3.org/2000/svg"   fill="currentColor" class="bi bi-calendar-week" viewBox="0 0 16 16">
                        <path d="M11 6.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm-3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm-5 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5z"/>
                        <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z"/>
                </svg>`
        },
        // 未来可以添加更多小组件
];

const addWidgetToScreen = (widgetBlueprint) => {
        const newWidget = {
                ...widgetBlueprint,
                id: `widget-${widgetBlueprint.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: 'widget',
        };

        // 使用扩展运算符创建新数组，以正确触发 shallowRef 的更新
        screenItems.value = [...screenItems.value, newWidget];
        
        // 检查是否需要自动切换到新页面
        setTimeout(() => {
                const newTotalPages = totalPages.value;
                if (currentPage.value < newTotalPages - 1) {
                        // 自动跳转到最后一页（新小组件所在的页面）
                        goToPage(newTotalPages - 1);
                }
                updateVisiblePages();
        }, 100);

        isWidgetDrawerOpen.value = false;
        saveLayout();
};

</script>


<style scoped>
.home-screen {
        width: 100vw;
        height: 100vh;
        background-color: #000000;
        background-size: cover;
        background-position: center;
        padding-top: var(--safe-top);
        box-sizing: border-box;
        overflow: hidden;
        font-family: inherit;
        position: relative;
        user-select: none;
        /* 禁止用户选择文本或元素 */
        -webkit-user-select: none;
        /* 兼容旧版 Safari/Chrome */
        -webkit-touch-callout: none;
        /* 禁用 iOS 上的长按菜单 */
        touch-action: manipulation;
        /* 禁用移动端点击高亮 */
        -webkit-tap-highlight-color: transparent;
        -webkit-focus-ring-color: transparent;
        outline: none;
}

/* 移动端适配 */
@media (max-width: 768px) {
        .home-screen {
                padding: 0;
                padding-top: 60px;
        }
        
        /* 编辑模式下增加更多边距给控制元素留空间 */
        .home-screen.edit-mode {
                padding: 0;
                padding-top: 65px;
        }
}

/* --- Top Buttons --- */
.top-buttons {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 20px;
        z-index: 100;
        background: var(--app-bg);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-radius: 25px;
        padding: 8px 20px;
}

/* 移动端优化 - 避开刘海屏和状态栏 */
@media (max-width: 768px) {
        .top-buttons {
                top: env(safe-area-inset-top, 10px);
                top: max(env(safe-area-inset-top), 10px);
        }
}

/* iPhone 14 Pro 及类似设备的动态岛适配 */
@media (max-width: 430px) and (max-height: 932px) {
        .top-buttons {
                top: 54px; /* 动态岛下方 */
        }
}

.add-button,
.done-button {
        padding: 8px 16px;
        border-radius: 999px;
        border: none;
        background-color: var(--app-bg);
        color: white;
        font-size: 16px;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: all 0.2s ease;
        min-width: 70px;
        height: 36px;
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
        outline: none;
        -webkit-backdrop-filter: blur(10px);
        backdrop-filter: blur(10px);
}

.add-button:active,
.done-button:active {
        transform: scale(0.95);
        background-color: var(--button-bg-active);
}

.button-icon {
        font-size: 18px;
        font-weight: bold;
}

.button-text {
        font-size: 14px;
        font-weight: 600;
}


.app-grid-container {
        width: 100%;
        height: 100%;
        transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
        position: relative;
}

.app-grid {
        display: grid;
        grid-template-columns: repeat(var(--cols, 4), var(--cell-size, 1fr));
        grid-template-rows: repeat(var(--rows, 4), var(--cell-size, 1fr));
        gap: var(--gap, 12px);
        width: 100%;
        height: auto;
        margin: 0 auto;
        padding: var(--gap, 12px);
        box-sizing: border-box;
        position: relative;
        /* 确保网格项目严格按网格对齐 */
        align-content: start;
        justify-content: center;
        /* 左右padding等于间距，实现均匀分布 */
        padding-left: var(--gap, 12px);
        padding-right: var(--gap, 12px);
        padding-top: 20px;
}

/* 编辑模式下为控制元素留出更多空间 */
.home-screen.edit-mode .app-grid {
        padding: calc(var(--gap, 12px) + 10px);
        padding-top: 30px;
}

/* 移动端网格优化 */
@media (max-width: 768px) {
        .app-grid {
                padding-left: var(--gap, 10px);
                padding-right: var(--gap, 10px);
                padding-top: 15px;
        }
        
        .home-screen.edit-mode .app-grid {
                padding: calc(var(--gap, 10px) + 15px);
                padding-top: 25px;
        }
}

@media (max-width: 430px) {
        .app-grid {
                padding-left: var(--gap, 8px);
                padding-right: var(--gap, 8px);
                padding-top: 15px;
        }
        
        .home-screen.edit-mode .app-grid {
                padding: calc(var(--gap, 8px) + 15px);
                padding-top: 30px;
        }
}

.grid-item {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        transition: transform 0.2s ease-in-out;
        position: relative;
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
        outline: none;
        /* 确保网格项目填充整个分配的空间 */
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        /* 编辑模式下确保有足够空间显示控制元素 */
        overflow: visible;
        /* app名称将显示在间距中，因此grid内部只包含图标 */
        padding: 0;
        margin: 0;
}

.grid-item.edit-mode {
        /* 编辑模式下确保有足够空间显示控制元素 */
        overflow: visible;
        position: relative;
}

/* 图标包装器样式 */
.icon-wrapper svg {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 57%;
        height: 57%;
        position: relative;
}

/* Widget包装器样式，保持与AppIcon对齐 */
.widget-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        width: 100%;
        height: 100%;
        position: relative;
}

.widget-container {
        flex: 1;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        overflow: hidden;
        box-sizing: border-box;
        border-radius: min(16px, calc(var(--cell-size, 80px) * 0.2));
}

.grid-item.dragging {
        opacity: 0.7;
        transform: scale(1.05);
        z-index: 1000;
}

.delete-button {
        position: absolute;
        top: -6px;
        right: -6px;
        width: 20px;
        height: 20px;
        background-color: var(--delete-btn-bg);
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 12px;
        font-weight: bold;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        z-index: 100;
        padding: 0;
        line-height: 1;
        -webkit-tap-highlight-color: transparent;
        outline: none;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
        pointer-events: all;
        transition: all 0.2s ease;
        /* 确保触摸事件正常工作 */
        -webkit-user-select: none;
        user-select: none;
        touch-action: manipulation;
}

.delete-button:active {
        transform: scale(0.9);
        background-color: var(--delete-btn-bg-active);
}

/* 移动端删除按钮优化 */
@media (max-width: 768px) {
        .delete-button {
                width: 12px;
                height: 12px;
                top: 0px;
                right: 0px;
                font-size: 14px;
                /* 增大触摸区域 */
                min-width: 24px;
                min-height: 24px;
                /* 使用margin负值扩大触摸区域但保持视觉大小 */
                margin: -10px;
        }
}

@media (max-width: 430px) {
        .delete-button {
                width: 10px;
                height: 10px;
                top: 2px;
                right: 2px;
                font-size: 13px;
                min-width: 20px;
                min-height: 20px;
                margin: -9px;
        }
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

.widget-drawer-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: var(--overlay-bg);
        z-index: 1000;
        display: flex;
        justify-content: center;
        align-items: flex-end;
}

.widget-drawer {
        width: 100%;
        height: 60%;
        background-color: rgba(var(--bg-card-rgb, 42, 42, 42), 0.75);
        border-radius: 20px 20px 0 0;
        padding: 20px;
        box-sizing: border-box;
        color: var(--text-primary);
        animation: slide-up 0.3s ease-out;
        -webkit-backdrop-filter: blur(20px);
        backdrop-filter: blur(20px);
        border: 1px solid var(--glass-border);
        box-shadow: 0 -4px 20px var(--glass-shadow);
}

@keyframes slide-up {
        from {
                transform: translateY(100%);
                opacity: 0;
        }

        to {
                transform: translateY(0);
                opacity: 1;
        }
}

.widget-drawer h2 {
        margin: 0 0 20px 0;
        font-size: 20px;
        font-weight: 600;
        text-align: center;
}

.widget-grid {
        display: grid;
        /* 使用从父级继承的动态变量 */
        grid-template-columns: repeat(var(--cols, 4), 1fr);
        gap: var(--gap, 10px);
        /* 自动调整行高，并设置一个最小高度 */
        grid-auto-rows: minmax(60px, auto);
        max-height: calc(100% - 80px);
        /* 80px = h2高度 + 上下padding */
        overflow-y: auto;
        /* 当小组件过多时允许滚动 */
        padding: 10px;
        box-sizing: border-box;
}

.widget-grid::-webkit-scrollbar {
        display: none;
}

.widget-grid {
        -ms-overflow-style: none;
        scrollbar-width: none;
}

.widget-grid-item {
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        border-radius: 12px;
        background-color: var(--app-bg);
        border: 1px solid var(--app-border);
        overflow: hidden;
        min-height: 60px;
}

.widget-grid-item:hover {
        background-color: var(--button-bg-hover);
        transform: scale(1.02);
}

.widget-preview-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        padding: 8px;
        box-sizing: border-box;
}

.widget-preview {
        flex: 1;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-secondary);
        font-size: 14px;
        border-radius: 8px;
        background-color: var(--app-bg);
        margin-bottom: 4px;
        min-height: 30px;
}

.svg-preview-wrapper {
        width: 20%;
        height: 20%;
        display: flex;
        justify-content: center;
        align-items: center;
        color: var(--text-secondary);
}

.widget-preview-name {
        margin: 0;
        font-weight: 500;
        font-size: 10px;
        color: var(--text-primary);
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 100%;
        line-height: 1.2;
}

/* 针对不同小组件预览的特定样式 */
.small-clock-preview::after {
        content: "15:57";
        font-size: 0.8rem;
        font-weight: 300;
        font-family: 'SF Mono', 'Monaco', monospace;
}

.medium-clock-preview::after {
        content: "15:57";
        font-size: 1.2rem;
        font-weight: 300;
        font-family: 'SF Mono', 'Monaco', monospace;
}

.small-photo-preview::after {
        content: "📷";
        font-size: 1.2rem;
}

.large-photo-preview::after {
        content: "📷";
        font-size: 2rem;
}

.small-calendar-preview::after {
        content: "📅";
        font-size: 1.5rem;
}

.large-calendar-preview::after {
        content: "📅";
        font-size: 2.5rem;
}

/* --- Widget Styles --- */

.widget-component {
        width: 100%;
        height: 100%;
        border-radius: 16px;
        overflow: hidden;
        /* 禁用移动端点击高亮 */
        -webkit-tap-highlight-color: transparent;
        outline: none;
}

/* 确保小组件内容随容器大小变化 */
.widget-component * {
        box-sizing: border-box;
}

/* 分页指示器样式 */
.page-indicators {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
        margin-top: 20px;
        padding: 10px;
        position: fixed;
        bottom: var(--safe-bottom, 20px);
        left: 0;
        right: 0;
        z-index: 50;
}

.page-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        cursor: pointer;
        transition: all 0.3s ease;
}

.page-dot.active {
        background: rgba(255, 255, 255, 0.8);
        transform: scale(1.2);
}

.page-dot:hover {
        background: rgba(255, 255, 255, 0.6);
        transform: scale(1.1);
}

/* 移动端分页指示器优化 */
@media (max-width: 768px) {
        .page-indicators {
                margin-top: 15px;
                padding: 8px;
                bottom: max(env(safe-area-inset-bottom), 20px);
        }
        
        .page-dot {
                width: 6px;
                height: 6px;
        }
}

/* 拖拽边缘提示区域 */
.home-screen::before,
.home-screen::after {
        content: '';
        position: fixed;
        left: 0;
        right: 0;
        height: 100px;
        background: transparent;
        z-index: 5;
        pointer-events: none;
        transition: background-color 0.3s ease;
}

.home-screen::before {
        top: 0;
}

.home-screen::after {
        bottom: 0;
}

/* 编辑模式下的拖拽提示 */
.home-screen.edit-mode::before {
        background: linear-gradient(to bottom, rgba(0, 150, 255, 0.1), transparent);
}

.home-screen.edit-mode::after {
        background: linear-gradient(to top, rgba(0, 150, 255, 0.1), transparent);
}

/* 滑动过渡效果优化 */
.app-grid-container {
        width: 100%;
        height: 100%;
        transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
        position: relative;
        display: flex;
        flex-direction: row;
}

.app-grid-container.swiping {
        transition: none; /* 滑动时禁用过渡 */
}

.page-container {
        flex-shrink: 0;
        width: 100vw;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding: 0;
        box-sizing: border-box;
        position: relative;
        /* 编辑模式下确保有足够空间显示控制元素 */
        overflow: visible;
        padding-top: 10px;
        padding-bottom: 10px;
}

.home-screen.edit-mode .page-container {
        /* 编辑模式下增加更多内边距 */
        padding: 15px 20px;
        padding-top: 20px;
        padding-bottom: 20px;
}

/* 页面分隔线 */
.page-container::after {
        content: '';
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        width: 1px;
        background: transparent;
        z-index: 1;
}

/* 非当前页面添加遮罩 */
.page-container:not(.current-page) {
        opacity: 0.3;
        pointer-events: none;
}

.page-container.current-page {
        opacity: 1;
        pointer-events: auto;
}

/* 移动端页面容器优化 */
@media (max-width: 768px) {
        .page-container {
                padding: 0 10px;
                padding-top: 5px;
                padding-bottom: 5px;
        }
        
        .home-screen.edit-mode .page-container {
                padding: 10px 15px;
                padding-top: 15px;
                padding-bottom: 15px;
        }
}

@media (max-width: 430px) {
        .page-container {
                padding: 0 8px;
        }
        
        .home-screen.edit-mode .page-container {
                padding: 8px 12px;
                padding-top: 12px;
                padding-bottom: 12px;
        }
}

/* 动态渐变背景 */
.gradient-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
}

/* 渐变动画 */
@keyframes gradientAnimation {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>

