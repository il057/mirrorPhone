<template>
        <div class="page-container">
                <AppHeader :title="actor?.name || '聊天'" :override-back-action="goBack">
                        <template #right>
                                <button class="header-action-button" @click="goToProfile">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                                stroke-width="1.5" stroke="currentColor" width="24" height="24">
                                                <path stroke-linecap="round" stroke-linejoin="round"
                                                        d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                </button>
                        </template>
                        <div class="status-indicator">
                                <div class="status-dot" :style="{ backgroundColor: actor?.status?.color || '#4CAF50' }">
                                </div>
                                <span class="status-text">{{ actor?.status?.text || '在线' }}</span>
                        </div>
                </AppHeader>

                <main v-if="actor" class="chat-content content">
                        <!-- 消息列表 -->
                        <div class="messages-container" ref="messagesContainer" @scroll="handleScroll">
                                <div v-if="isLoadingMore" class="loading-indicator">
                                        <p>加载更多消息...</p>
                                </div>
                                <div v-for="message in displayedMessages" :key="message.id" class="message-item"
                                        :class="{ 'own-message': message.actorId === 'user_main' }">
                                        <div class="message-avatar" v-if="message.actorId !== 'user_main'">
                                                <span class="avatar-initial">{{ actor.name[0] }}</span>
                                        </div>
                                        <div class="message-content">
                                                <div class="message-bubble">
                                                        <p>{{ message.content.content }}</p>
                                                </div>
                                                <div class="message-time">
                                                        {{ formatTimestamp(message.timestamp, true) }}
                                                </div>
                                        </div>
                                </div>
                        </div>
                </main>

                <div v-else class="loading-state">
                        <p>正在加载...</p>
                </div>

                <!-- 输入区域 -->
                <div class="input-area" v-if="actor">
                        <div class="input-container">
                                <textarea v-model="newMessage" placeholder="输入消息..." class="message-input" rows="1"
                                        @keydown="handleKeydown" ref="messageInput"></textarea>
                                <div class="input-actions">
                                        <button class="action-button generate-btn" @click="generateReply"
                                                :disabled="isGenerating">
                                                {{ isGenerating ? '生成中...' : '生成回复' }}
                                        </button>
                                        <button class="action-button send-btn" @click="sendMessage"
                                                :disabled="!newMessage.trim()">
                                                发送
                                        </button>
                                </div>
                        </div>
                </div>
        </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useObservable } from '@vueuse/rxjs';
import { liveQuery } from 'dexie';
import db from '../services/database.js';
import AppHeader from '../components/layout/Header.vue';
import { formatTimestamp } from '../utils/datetime.js';

const route = useRoute();
const router = useRouter();
const actorId = ref(route.params.id);
const newMessage = ref('');
const isGenerating = ref(false);
const isLoadingMore = ref(false);
const messagesContainer = ref(null);
const messageInput = ref(null);

// 懒加载相关状态
const messageOffset = ref(0);
const messageLimit = 30;
const hasMoreMessages = ref(true);

// 获取角色信息
const actor = useObservable(
        liveQuery(() => db.actors.get(actorId.value)),
        { initialValue: null }
);

// 获取所有消息（用于懒加载）
const allMessages = useObservable(
        liveQuery(async () => {
                const allEvents = await db.events
                        .where('contextId').equals(actorId.value)
                        .toArray();
                return allEvents.filter(event => event.type === 'privateMessage')
                        .sort((a, b) => a.timestamp - b.timestamp);
        }),
        { initialValue: [] }
);

// 显示的消息（懒加载切片）
const displayedMessages = computed(() => {
        const total = allMessages.value.length;
        if (total === 0) return [];
        
        // 显示最新的消息，根据offset决定显示多少条历史消息
        const messagesToShow = messageOffset.value + messageLimit;
        const startIndex = Math.max(0, total - messagesToShow);
        
        return allMessages.value.slice(startIndex);
});

// 检查是否还有更多消息
watch(allMessages, (newMessages) => {
        const total = newMessages.length;
        hasMoreMessages.value = total > displayedMessages.value.length;
        
        // 当有新消息时，自动滚动到底部
        if (total > 0 && messageOffset.value === 0) {
                nextTick(() => scrollToBottom());
        }
}, { immediate: true });

// 自动滚动到底部
const scrollToBottom = () => {
        nextTick(() => {
                if (messagesContainer.value) {
                        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
                }
        });
};

// 监听消息变化自动滚动
watch(displayedMessages, () => {
        scrollToBottom();
}, { deep: true });

// 处理滚动事件，实现懒加载
const handleScroll = async () => {
        if (!messagesContainer.value || isLoadingMore.value || !hasMoreMessages.value) return;
        
        const { scrollTop } = messagesContainer.value;
        
        // 当用户滚动到顶部附近时加载更多消息
        if (scrollTop <= 100) {
                isLoadingMore.value = true;
                
                // 保存当前滚动位置
                const previousScrollHeight = messagesContainer.value.scrollHeight;
                
                // 模拟加载延迟
                await new Promise(resolve => setTimeout(resolve, 300));
                
                // 增加偏移量以加载更多消息
                messageOffset.value += messageLimit;
                
                // 等待DOM更新后恢复滚动位置
                await nextTick();
                const newScrollHeight = messagesContainer.value.scrollHeight;
                messagesContainer.value.scrollTop = newScrollHeight - previousScrollHeight;
                
                isLoadingMore.value = false;
        }
};

// 自动调整输入框高度
const adjustTextareaHeight = () => {
        if (messageInput.value) {
                messageInput.value.style.height = 'auto';
                messageInput.value.style.height = messageInput.value.scrollHeight + 'px';
        }
};

// 处理键盘事件
const handleKeydown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
        }
        // 调整高度
        nextTick(adjustTextareaHeight);
};

// 发送消息
const sendMessage = async () => {
        if (!newMessage.value.trim()) return;

        const message = {
                timestamp: Date.now(),
                actorId: 'user_main', // 假设用户ID
                contextId: actorId.value,
                type: 'privateMessage',
                content: {
                        content: newMessage.value.trim()
                }
        };

        try {
                // 保存消息到events表
                await db.events.add(message);
                
                // 更新conversation表
                await updateConversation(message);
                
                newMessage.value = '';
                adjustTextareaHeight();
        } catch (error) {
                console.error('发送消息失败:', error);
        }
};

// 生成AI回复
const generateReply = async () => {
        if (isGenerating.value) return;
        
        isGenerating.value = true;
        
        try {
                // 这里应该调用AI API生成回复
                // 现在先模拟一个简单的回复
                const replyContent = await simulateAIReply();
                
                const aiMessage = {
                        timestamp: Date.now(),
                        actorId: actorId.value,
                        contextId: actorId.value,
                        type: 'privateMessage',
                        content: {
                                content: replyContent
                        }
                };

                await db.events.add(aiMessage);
                await updateConversation(aiMessage);
                
        } catch (error) {
                console.error('生成回复失败:', error);
        } finally {
                isGenerating.value = false;
        }
};

// 模拟AI回复（实际应用中应该调用真实的AI API）
const simulateAIReply = async () => {
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const replies = [
                '你好！有什么我可以帮助你的吗？',
                '这听起来很有趣！',
                '我理解你的意思。',
                '让我想想...',
                '那真是太好了！',
                '我同意你的观点。'
        ];
        
        return replies[Math.floor(Math.random() * replies.length)];
};

// 更新conversation表
const updateConversation = async (message) => {
        const conversation = {
                id: actorId.value,
                lastEventTimestamp: message.timestamp,
                lastEventContent: message.content,
                unreadCount: message.actorId === 'user_main' ? 0 : 1, // 如果是用户发送则重置未读数
                summaryState: null
        };

        await db.conversations.put(conversation);
};

// 返回上一页
const goBack = () => {
        // 智能返回：优先返回到消息列表
        const referrer = document.referrer;
        const currentPath = router.currentRoute.value.path;
        
        // 如果有浏览器历史记录且不是从当前页面刷新，则返回上一页
        if (window.history.length > 1 && !referrer.includes(currentPath)) {
                router.back();
        } else {
                // 否则返回到消息列表
                router.push('/chat/messages');
        }
};

// 跳转到profile
const goToProfile = () => {
        router.push(`/profile/${actorId.value}`);
};

// 初始化默认状态
onMounted(async () => {
        if (actor.value && !actor.value.status) {
                await db.actors.update(actorId.value, {
                        status: {
                                color: '#4CAF50',
                                text: '在线'
                        }
                });
        }
        
        // 等待消息加载完成后初始化
        await nextTick();
        
        // 初始显示最新的30条消息
        messageOffset.value = 0;
        
        setTimeout(() => {
                scrollToBottom();
        }, 100);
});
</script>

<style scoped>
.header-action-button {
        background: none;
        border: none;
        color: var(--accent-primary);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px;
        border-radius: 50%;
        transition: background-color 0.2s;
}

.header-action-button svg {
        width: 24px;
        height: 24px;
}

.status-indicator {
        display: flex;
        align-items: center;
        gap: 6px;
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        margin-top: 4px;
}

.status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
}

.status-text {
        font-size: 12px;
        color: var(--text-secondary);
}

.chat-content {
        flex-grow: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        padding: 0;
        margin-bottom: 150px;
}

.messages-container {
        flex-grow: 1;
        overflow-y: auto;
        padding: 15px 20px;
        display: flex;
        flex-direction: column;
        gap: 15px;
}

.loading-indicator {
        text-align: center;
        padding: 10px;
        color: var(--text-secondary);
        font-size: 14px;
}

.message-item {
        display: flex;
        gap: 10px;
}

.message-item.own-message {
        flex-direction: row-reverse;
}

.message-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background-color: var(--bg-secondary);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
}

.avatar-initial {
        color: var(--accent-primary);
        font-weight: 600;
        font-size: 14px;
}

.message-content {
        max-width: 70%;
        display: flex;
        flex-direction: column;
        gap: 4px;
}

.own-message .message-content {
        align-items: flex-end;
}

.message-bubble {
        background-color: var(--bg-card);
        padding: 12px 16px;
        border-radius: 18px;
        word-wrap: break-word;
}

.own-message .message-bubble {
        background-color: var(--accent-primary);
        color: var(--text-inverse);
}

.message-bubble p {
        margin: 0;
        line-height: 1.4;
}

.message-time {
        font-size: 11px;
        color: var(--text-secondary);
        padding: 0 8px;
}

.input-area {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: var(--bg-primary);
        border-top: 1px solid var(--border-color);
        padding: calc(15px + var(--safe-bottom)) 20px 15px;
        backdrop-filter: blur(15px);
        -webkit-backdrop-filter: blur(15px);
}

.input-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
}

.message-input {
        width: 100%;
        min-height: 40px;
        max-height: 120px;
        padding: 10px 15px;
        border: 1px solid var(--border-color);
        border-radius: 20px;
        background-color: var(--bg-card);
        color: var(--text-primary);
        font-size: 16px;
        resize: none;
        outline: none;
        overflow-y: auto;
}

.message-input:focus {
        border-color: var(--accent-primary);
}

.input-actions {
        display: flex;
        gap: 10px;
}

.action-button {
        flex: 1;
        padding: 12px 20px;
        border: none;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
}

.generate-btn {
        background-color: var(--bg-card);
        color: var(--text-primary);
        border: 1px solid var(--border-color);
}

.generate-btn:hover:not(:disabled) {
        background-color: var(--bg-secondary);
}

.send-btn {
        background-color: var(--accent-primary);
        color: var(--text-inverse);
}

.send-btn:hover:not(:disabled) {
        background-color: var(--accent-darker);
}

.action-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
}

.loading-state {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--text-secondary);
}

/* 隐藏滚动条 */
.messages-container::-webkit-scrollbar {
        width: 0;
        background: transparent;
}

.message-input::-webkit-scrollbar {
        width: 0;
        background: transparent;
}
</style>
