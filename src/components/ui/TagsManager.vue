<template>
        <div class="tags-container">
                <div class="tags-list">
                        <div 
                                v-for="tag in tags" 
                                :key="tag.name"
                                class="tag-item"
                                :style="{ opacity: getTagOpacity(tag.strength) }"
                        >
                                <span class="tag-name">{{ tag.name }}</span>
                                <span class="tag-strength">({{ tag.strength }})</span>
                                <button 
                                        v-if="editable"
                                        @click="editTag(tag)"
                                        class="tag-action edit"
                                        title="编辑"
                                >
                                        ✏️
                                </button>
                                <button 
                                        v-if="editable"
                                        @click="removeTag(tag.name)"
                                        class="tag-action remove"
                                        title="删除"
                                >
                                        ✕
                                </button>
                        </div>
                </div>
                <div v-if="editable && showAddForm" class="add-tag-form">
                        <input 
                                v-model="newTagName"
                                placeholder="标签名称"
                                class="tag-input"
                                @keyup.enter="addTag"
                        />
                        <input 
                                v-model.number="newTagStrength"
                                type="number"
                                min="1"
                                max="10"
                                placeholder="强度(1-10)"
                                class="tag-input strength"
                                @keyup.enter="addTag"
                        />
                        <button @click="addTag" class="add-btn">添加</button>
                        <button @click="cancelAdd" class="cancel-btn">取消</button>
                </div>
                <button 
                        v-if="editable && !showAddForm"
                        @click="showAddForm = true"
                        class="add-tag-btn"
                >
                        + 添加标签
                </button>
        </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
        tags: {
                type: Array,
                default: () => []
        },
        editable: {
                type: Boolean,
                default: false
        }
});

const emit = defineEmits(['update:tags', 'tag-added', 'tag-removed', 'tag-edited']);

const showAddForm = ref(false);
const newTagName = ref('');
const newTagStrength = ref(5);

const getTagOpacity = (strength) => {
        return Math.max(0.3, Math.min(1, 0.3 + (strength / 10) * 0.7));
};

const addTag = () => {
        if (!newTagName.value.trim()) return;
        
        const newTag = {
                name: newTagName.value.trim(),
                strength: newTagStrength.value
        };
        
        const updatedTags = [...props.tags, newTag];
        emit('update:tags', updatedTags);
        emit('tag-added', newTag);
        
        // 重置表单
        newTagName.value = '';
        newTagStrength.value = 5;
        showAddForm.value = false;
};

const removeTag = (tagName) => {
        const updatedTags = props.tags.filter(tag => tag.name !== tagName);
        emit('update:tags', updatedTags);
        emit('tag-removed', tagName);
};

const editTag = (tag) => {
        const newName = prompt('编辑标签名称:', tag.name);
        const newStrength = prompt('编辑强度(1-10):', tag.strength);
        
        if (newName !== null && newStrength !== null) {
                const updatedTags = props.tags.map(t => 
                        t.name === tag.name 
                                ? { name: newName.trim(), strength: parseInt(newStrength) || tag.strength }
                                : t
                );
                emit('update:tags', updatedTags);
                emit('tag-edited', { oldTag: tag, newTag: { name: newName.trim(), strength: parseInt(newStrength) || tag.strength } });
        }
};

const cancelAdd = () => {
        newTagName.value = '';
        newTagStrength.value = 5;
        showAddForm.value = false;
};
</script>

<style scoped>
.tags-container {
        margin: 15px 0;
}

.tags-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 10px;
}

.tag-item {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background-color: var(--accent-primary);
        color: var(--accent-text);
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        transition: all 0.2s ease;
}

.tag-name {
        font-weight: 500;
}

.tag-strength {
        font-size: 10px;
        opacity: 0.8;
}

.tag-action {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        padding: 2px;
        font-size: 10px;
        opacity: 0.7;
        transition: opacity 0.2s ease;
}

.tag-action:hover {
        opacity: 1;
}

.add-tag-form {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
}

.tag-input {
        padding: 6px 10px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        background-color: var(--bg-secondary);
        color: var(--text-primary);
        font-size: 12px;
}

.tag-input.strength {
        width: 80px;
}

.add-btn,
.cancel-btn {
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
}

.add-btn {
        background-color: var(--accent-primary);
        color: var(--accent-text);
}

.add-btn:hover {
        background-color: var(--accent-darker);
}

.cancel-btn {
        background-color: var(--bg-secondary);
        color: var(--text-secondary);
}

.cancel-btn:hover {
        background-color: var(--bg-primary);
}

.add-tag-btn {
        background: none;
        border: 1px dashed var(--border-color);
        border-radius: 12px;
        padding: 6px 12px;
        color: var(--text-secondary);
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s ease;
}

.add-tag-btn:hover {
        border-color: var(--accent-primary);
        color: var(--accent-primary);
}
</style>
