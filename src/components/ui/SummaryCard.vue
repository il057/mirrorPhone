<template>
        <div class="summary-card" @click="$emit('view-details', summary)">
                <div class="card-header">
                        <div class="group-info">
                                <h4 class="group-name">{{ summary.groupName }}</h4>
                                <span class="timestamp">{{ formatTimestamp(summary.timestamp) }}</span>
                        </div>
                        <div class="story-preview">
                                <p>{{ truncateStory(summary.story) }}</p>
                        </div>
                </div>
                <div v-if="summary.relationshipChanges && summary.relationshipChanges.length > 0" class="card-footer">
                        <div class="relationship-summary">
                                <span class="change-count">{{ summary.relationshipChanges.length }}个关系变化</span>
                                <div class="change-preview">
                                        <span v-for="change in summary.relationshipChanges.slice(0, 2)" 
                                              :key="`${change.sourceId}-${change.targetId}`"
                                              class="change-badge"
                                              :class="{ positive: change.scoreChange > 0, negative: change.scoreChange < 0 }">
                                                {{ change.scoreChange > 0 ? '+' : '' }}{{ change.scoreChange }}
                                        </span>
                                        <span v-if="summary.relationshipChanges.length > 2" class="more-changes">
                                                +{{ summary.relationshipChanges.length - 2 }}
                                        </span>
                                </div>
                        </div>
                </div>
        </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
        summary: {
                type: Object,
                required: true
        }
});

const emit = defineEmits(['view-details']);

const formatTimestamp = (timestamp) => {
        const now = Date.now();
        const diff = now - timestamp;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor(diff / (1000 * 60));

        if (days > 0) {
                return `${days}天前`;
        } else if (hours > 0) {
                return `${hours}小时前`;
        } else if (minutes > 0) {
                return `${minutes}分钟前`;
        } else {
                return '刚刚';
        }
};

const truncateStory = (story) => {
        if (!story) return '暂无故事内容';
        return story.length > 120 ? story.substring(0, 120) + '...' : story;
};
</script>

<style scoped>
.summary-card {
        background-color: var(--bg-card);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        border: 1px solid var(--border-color);
        cursor: pointer;
        transition: all 0.2s ease;
}

.summary-card:hover {
        background-color: var(--bg-secondary);
        border-color: var(--accent-primary);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
        margin-bottom: 12px;
        flex-direction: column;
        align-items: normal;
}

.group-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
}

.group-name {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
}

.timestamp {
        font-size: 12px;
        color: var(--text-secondary);
}

.story-preview p {
        margin: 0;
        font-size: 14px;
        line-height: 1.4;
        color: var(--text-primary);
}

.card-footer {
        border-top: 1px solid var(--border-color);
        padding-top: 8px;
}

.relationship-summary {
        display: flex;
        justify-content: space-between;
        align-items: center;
}

.change-count {
        font-size: 12px;
        color: var(--text-secondary);
}

.change-preview {
        display: flex;
        gap: 4px;
        align-items: center;
}

.change-badge {
        font-size: 11px;
        padding: 2px 6px;
        border-radius: 12px;
        background-color: var(--bg-secondary);
        color: var(--text-secondary);
        font-weight: 500;
}

.change-badge.positive {
        background-color: rgba(76, 175, 80, 0.1);
        color: #4CAF50;
}

.change-badge.negative {
        background-color: rgba(244, 67, 54, 0.1);
        color: #F44336;
}

.more-changes {
        font-size: 11px;
        color: var(--text-secondary);
}
</style>
