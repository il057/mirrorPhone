<template>
        <div class="forwarded-message" @click="toggleExpanded">
                <div class="forwarded-header">
                        <div class="forward-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M1.5 1.5A.5.5 0 0 1 2 1h4.5a.5.5 0 0 1 0 1h-4v4a.5.5 0 0 1-1 0zm13 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V2h-4a.5.5 0 0 1 0-1h4.5zM2 14.5a.5.5 0 0 1-.5-.5V10a.5.5 0 0 1 1 0v4h4a.5.5 0 0 1 0 1H2zm12 0h-4a.5.5 0 0 1 0-1h4v-4a.5.5 0 0 1 1 0v4a.5.5 0 0 1-.5.5z"/>
                                </svg>
                        </div>
                        <div class="forward-title">{{ fromCharName }}和{{ userPersonaName }}的消息</div>
                        <div class="expand-icon" :class="{ expanded: isExpanded }">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                        <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                                </svg>
                        </div>
                </div>
                
                <div class="forwarded-preview" v-if="!isExpanded">
                        <div v-for="(message, index) in previewMessages" :key="index" class="preview-line">
                                <span class="preview-author">{{ message.author }}:</span>
                                <span class="preview-content">{{ message.content }}</span>
                        </div>
                        <div v-if="messages.length > 2" class="more-indicator">
                                还有 {{ messages.length - 2 }} 条消息，点击展开
                        </div>
                </div>
                
                <div class="forwarded-full" v-if="isExpanded">
                        <div v-for="(message, index) in fullMessages" :key="index" class="full-message">
                                <div class="message-header">
                                        <span class="message-author">{{ message.author }}</span>
                                        <span class="message-time">{{ formatTimestamp(message.timestamp) }}</span>
                                </div>
                                <div class="message-content">{{ message.content }}</div>
                        </div>
                </div>
        </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
        fromCharName: {
                type: String,
                required: true
        },
        userPersonaName: {
                type: String,
                required: true
        },
        messages: {
                type: Array,
                required: true
        }
});

const isExpanded = ref(false);

// 前两条消息作为预览
const previewMessages = computed(() => {
        return props.messages.slice(0, 2).map(msg => ({
                author: msg.author,
                content: msg.content
        }));
});

// 完整消息列表
const fullMessages = computed(() => {
        return props.messages.map(msg => ({
                author: msg.author,
                content: msg.content,
                timestamp: msg.timestamp
        }));
});

const toggleExpanded = () => {
        isExpanded.value = !isExpanded.value;
};

const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
        });
};
</script>

<style scoped>
.forwarded-message {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background: #f8f9fa;
        cursor: pointer;
        transition: all 0.2s;
        margin: 8px 0;
        overflow: hidden;
}

.forwarded-message:hover {
        border-color: #007bff;
        background-color: #f0f8ff;
}

.forwarded-header {
        display: flex;
        align-items: center;
        padding: 12px;
        background: linear-gradient(90deg, #f0f8ff 0%, #e3f2fd 100%);
        border-bottom: 1px solid #e0e0e0;
}

.forward-icon {
        color: #007bff;
        margin-right: 8px;
        flex-shrink: 0;
}

.forward-title {
        flex: 1;
        font-weight: 600;
        color: #333;
        font-size: 14px;
}

.expand-icon {
        color: #666;
        transition: transform 0.2s;
        flex-shrink: 0;
}

.expand-icon.expanded {
        transform: rotate(180deg);
}

.forwarded-preview {
        padding: 12px;
}

.preview-line {
        display: flex;
        gap: 6px;
        margin-bottom: 6px;
        font-size: 13px;
        line-height: 1.4;
}

.preview-line:last-child {
        margin-bottom: 0;
}

.preview-author {
        font-weight: 600;
        color: #007bff;
        flex-shrink: 0;
}

.preview-content {
        color: #666;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
}

.more-indicator {
        font-size: 12px;
        color: #999;
        font-style: italic;
        margin-top: 8px;
        text-align: center;
}

.forwarded-full {
        padding: 12px;
        max-height: 300px;
        overflow-y: auto;
}

.full-message {
        margin-bottom: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid #e5e5e5;
}

.full-message:last-child {
        margin-bottom: 0;
        border-bottom: none;
        padding-bottom: 0;
}

.message-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
}

.message-author {
        font-weight: 600;
        color: #007bff;
        font-size: 13px;
}

.message-time {
        font-size: 11px;
        color: #999;
}

.message-content {
        color: #333;
        font-size: 14px;
        line-height: 1.4;
        word-wrap: break-word;
}
</style>
