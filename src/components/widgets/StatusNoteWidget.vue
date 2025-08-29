<template>
        <div class="status-note-widget widget">
                <div class="note-content">
                        <div v-if="!selectedActor" class="select-char-area interactive-widget-element" @click.stop="openCharacterSelector">
                                <div class="dashed-circle">
                                        <svg viewBox="0 0 24 24" class="plus-icon">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
                                        </svg>
                                </div>
                                <span class="select-text">选择角色</span>
                        </div>
                        
                        <div v-else class="char-status-area">
                                <div class="char-avatar interactive-widget-element" @click.stop="openCharacterSelector">
                                        <img v-if="selectedActor.currentAvatar" 
                                             :src="selectedActor.currentAvatar" 
                                             :alt="selectedActor.name"
                                             class="avatar-img">
                                        <div v-else class="default-avatar">
                                                {{ selectedActor.name.charAt(0) }}
                                        </div>
                                </div>
                                
                                <div class="status-content">
                                        <div class="char-name">{{ selectedActor.name }}</div>
                                        <div class="status-text" :style="{ color: selectedActor.status?.color || '#888' }">
                                                {{ selectedActor.status?.text || '暂无状态' }}
                                        </div>
                                        <div v-if="selectedActor.status?.mood" class="mood-text">
                                                心情: {{ selectedActor.status.mood }}
                                        </div>
                                </div>
                        </div>
                </div>
        </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useObservable } from '@vueuse/rxjs';
import { liveQuery } from 'dexie';
import db from '../../services/database.js';

const props = defineProps({
        widgetSize: {
                type: Object,
                default: () => ({ col: 2, row: 2 })
        },
        widgetId: {
                type: String,
                required: true
        }
});

// 获取小组件设置
const widgetSettings = useObservable(
        liveQuery(async () => {
                const setting = await db.widgetSettings.get(props.widgetId);
                return setting?.settings || {};
        }),
        { initialValue: {} }
);

// 获取选中的角色信息
const selectedActor = useObservable(
        liveQuery(async () => {
                const setting = await db.widgetSettings.get(props.widgetId);
                const selectedCharId = setting?.settings?.selectedCharId;
                if (!selectedCharId) return null;
                
                return await db.actors.get(selectedCharId);
        }),
        { initialValue: null }
);

// 获取所有可选择的角色
const availableActors = useObservable(
        liveQuery(async () => {
                return await db.actors
                        .filter(actor => 
                                !actor.isGroup && 
                                !actor.id.startsWith('user_') && 
                                actor.id !== '__USER__' &&
                                !actor.isHidden
                        )
                        .toArray();
        }),
        { initialValue: [] }
);

// 动态样式
const fontSize = computed(() => {
        const baseSize = props.widgetSize.col * 0.3;
        return `${Math.max(0.8, baseSize)}rem`;
});

const avatarSize = computed(() => {
        const baseSize = props.widgetSize.col * 20;
        return `${Math.max(32, baseSize)}px`;
});

// 打开角色选择器
const openCharacterSelector = async () => {
        try {
                // 使用现有的动作选择模态框
                const { showActionChoiceModal } = await import('../../services/uiService.js');
                
                if (availableActors.value.length === 0) {
                        const { showToast } = await import('../../services/uiService.js');
                        showToast('暂无可选择的角色', 'warning');
                        return;
                }
                
                // 构建角色选项
                const actions = availableActors.value.map(actor => ({
                        key: actor.id,
                        label: actor.name,
                        icon: actor.currentAvatar
                }));
                
                const result = await showActionChoiceModal('选择角色', actions);
                
                if (result) {
                        // 保存选择
                        await db.widgetSettings.put({
                                id: props.widgetId,
                                type: 'statusNote',
                                settings: {
                                        selectedCharId: result
                                }
                        });
                }
        } catch (error) {
                console.error('选择角色失败:', error);
        }
};

onMounted(async () => {
        // 确保小组件设置存在
        const existingSetting = await db.widgetSettings.get(props.widgetId);
        if (!existingSetting) {
                await db.widgetSettings.put({
                        id: props.widgetId,
                        type: 'statusNote',
                        settings: {}
                });
        }
});
</script>

<style scoped>
.status-note-widget {
        width: 100%;
        height: 100%;
        padding: 8px;
        box-sizing: border-box;
        background: var(--app-bg);
        border-radius: 12px;
        backdrop-filter: blur(10px);
        border: 1px solid var(--app-border);
}

.note-content {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
}

/* 选择角色区域 */
.select-char-area {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        color: var(--opacity-70);
        transition: all 0.3s ease;
}

.select-char-area:hover {
        color: var(--opacity-90);
        transform: scale(1.05);
}

.dashed-circle {
        width: v-bind('avatarSize');
        height: v-bind('avatarSize');
        border: 2px dashed var(--opacity-50);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
}

.select-char-area:hover .dashed-circle {
        border-color: var(--opacity-80);
        background: var(--opacity-10);
}

.plus-icon {
        width: 24px;
        height: 24px;
        fill: currentColor;
}

.select-text {
        font-size: v-bind('fontSize');
        font-weight: 500;
}

/* 角色状态区域 */
.char-status-area {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        width: 100%;
        text-align: center;
}

.char-avatar {
        width: v-bind('avatarSize');
        height: v-bind('avatarSize');
        border-radius: 50%;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.3s ease;
        border: 2px solid var(--opacity-30);
}

.char-avatar:hover {
        transform: scale(1.1);
        border-color: var(--opacity-60);
}

.avatar-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
}

.default-avatar {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-darker) 100%);
        color: white;
        font-weight: 600;
        font-size: calc(v-bind('avatarSize') * 0.4);
}

.status-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-height: 0;
}

.char-name {
        font-size: v-bind('fontSize');
        font-weight: 600;
        color: white;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
}

.status-text {
        font-size: calc(v-bind('fontSize') * 0.85);
        line-height: 1.3;
        opacity: 0.9;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        word-break: break-word;
}

.mood-text {
        font-size: calc(v-bind('fontSize') * 0.75);
        color: var(--opacity-70);
        font-style: italic;
}

/* 响应式调整 */
@media (max-width: 768px) {
        .status-note-widget {
                padding: 6px;
        }
        
        .char-status-area {
                gap: 6px;
        }
        
        .status-content {
                gap: 3px;
        }
}
</style>
