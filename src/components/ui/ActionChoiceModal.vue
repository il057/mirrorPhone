<template>
        <div class="modal-overlay" @click="$emit('cancel')">
                <div class="modal-container" @click.stop>
                        <div class="modal-header">
                                <h3>{{ title }}</h3>
                                <button class="close-btn" @click="$emit('cancel')">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                                strokeWidth={1.5} stroke="currentColor" className="size-6">
                                                <path strokeLinecap="round" strokeLinejoin="round"
                                                        d="M6 18 18 6M6 6l12 12" />
                                        </svg>

                                </button>
                        </div>
                        <div class="modal-content">
                                <div class="action-grid">
                                        <button v-for="action in actions" :key="action.key" class="action-item"
                                                @click="$emit('select', action.key)">
                                                <!-- 仅当有svg时显示图标 -->
                                                <span v-if="getSvgIcon(action)" class="action-icon" v-html="getSvgIcon(action)"></span>
                                                <span class="action-label">{{ action.label }}</span>
                                        </button>
                                </div>
                        </div>
                </div>
        </div>
</template>

<script setup>
const props = defineProps({
        title: {
                type: String,
                required: true
        },
        actions: {
                type: Array,
                required: true
        }
});

defineEmits(['select', 'cancel']);

// SVG 图标库
const svgIcons = {
        'text-image': `<svg xmlns="http://www.w3.org/2000/svg"  fill="currentColor" class="bi bi-file-earmark-richtext" viewBox="0 0 16 16">
        <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5z"/>
        <path d="M4.5 12.5A.5.5 0 0 1 5 12h3a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5m0-2A.5.5 0 0 1 5 10h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5m1.639-3.708 1.33.886 1.854-1.855a.25.25 0 0 1 .289-.047l1.888.974V8.5a.5.5 0 0 1-.5.5H5a.5.5 0 0 1-.5-.5V8s1.54-1.274 1.639-1.208M6.25 6a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5"/>
        </svg>`,

        'upload-image': `<svg xmlns="http://www.w3.org/2000/svg"  fill="currentColor" class="bi bi-card-image" viewBox="0 0 16 16">
        <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>
        <path d="M1.5 2A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2zm13 1a.5.5 0 0 1 .5.5v6l-3.775-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12v.54L1 12.5v-9a.5.5 0 0 1 .5-.5z"/>
        </svg>`,

        'transfer': `<svg xmlns="http://www.w3.org/2000/svg"  fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
        </svg>
        `,

        'pay': `<svg xmlns="http://www.w3.org/2000/svg"  fill="currentColor" class="bi bi-cart-check" viewBox="0 0 16 16">
        <path d="M11.354 6.354a.5.5 0 0 0-.708-.708L8 8.293 6.854 7.146a.5.5 0 1 0-.708.708l1.5 1.5a.5.5 0 0 0 .708 0z"/>
        <path d="M.5 1a.5.5 0 0 0 0 1h1.11l.401 1.607 1.498 7.985A.5.5 0 0 0 4 12h1a2 2 0 1 0 0 4 2 2 0 0 0 0-4h7a2 2 0 1 0 0 4 2 2 0 0 0 0-4h1a.5.5 0 0 0 .491-.408l1.5-8A.5.5 0 0 0 14.5 3H2.89l-.405-1.621A.5.5 0 0 0 2 1zm3.915 10L3.102 4h10.796l-1.313 7zM6 14a1 1 0 1 1-2 0 1 1 0 0 1 2 0m7 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
        </svg>`,

        'voice': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,

        'video': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
        <polygon points="23 7 16 12 23 17 23 7" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,

        'red-packet': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
        <rect x="3" y="6" width="18" height="15" rx="2" ry="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="13" r="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,

        'sticker': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
        <circle cx="12" cy="12" r="10" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="9" y1="9" x2="9.01" y2="9" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="15" y1="9" x2="15.01" y2="9" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,

        'song': `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="bi bi-music-player" viewBox="0 0 16 16">
        <path d="M4 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zm1 0v3h6V3zm3 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2"/>
        <path d="M11 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0m-3 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4"/>
        <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z"/>
        </svg>`,

        'listen-together': `<svg xmlns="http://www.w3.org/2000/svg"  fill="currentColor" class="bi bi-headphones" viewBox="0 0 16 16">
        <path d="M8 3a5 5 0 0 0-5 5v1h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a6 6 0 1 1 12 0v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1V8a5 5 0 0 0-5-5"/>
        </svg>`,

        'location': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="10" r="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,

        'file': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="14,2 14,8 20,8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,

        'gift': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
        <polyline points="20 12 20 22 4 22 4 12" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="2" y="7" width="20" height="5" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="12" y1="22" x2="12" y2="7" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`
};

// 获取SVG图标的函数
const getSvgIcon = (action) => {
        // 如果action对象有svg属性，直接使用
        if (action.svg) {
                return action.svg;
        }

        // 如果有iconType属性，从图标库中获取
        if (action.iconType && svgIcons[action.iconType]) {
                return svgIcons[action.iconType];
        }

        // 如果有key属性，尝试从图标库中匹配
        if (action.key && svgIcons[action.key]) {
                return svgIcons[action.key];
        }

        // 没有svg时返回 null
        return null;
};
</script>

<style scoped>

.modal-container {
        background-color: var(--bg-card);
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        max-width: 400px;
        width: 100%;
        max-height: 80vh;
        overflow: hidden;
}

.modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 20px 15px;
        border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
        margin: 0;
        color: var(--text-primary);
        font-size: 18px;
        font-weight: 600;
}

.close-btn {
        background: none;
        border: none;
        font-size: 24px;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s;
}

.close-btn:hover {
        color: var(--accent-primary)
}

.modal-content {
        padding: 20px;
        border-radius: 0;
}

.action-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
}

.action-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 20px;
        border: 1px solid var(--border-color);
        border-radius: 12px;
        background-color: var(--bg-primary);
        color: var(--text-primary);
        cursor: pointer;
        transition: all 0.2s;
        min-height: 80px;
}

.action-item:hover {
        background-color: var(--bg-secondary);
        border-color: var(--accent-primary);
        transform: translateY(-2px);
}

.action-item:active {
        transform: translateY(0);
}

.action-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
}

.action-icon svg {
        width: 36px;
        height: 36px;
        color: var(--text-secondary);
        transition: color 0.2s;
}

.action-item:hover .action-icon svg {
        color: var(--accent-primary);
}

.action-label {
        font-size: 14px;
        font-weight: 500;
        text-align: center;
}
</style>
