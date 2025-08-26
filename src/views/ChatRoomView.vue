<template>
        <div class="page-container">
                <AppHeader :title="isTyping ? '正在输入中…' : (actor?.name || '聊天')" :override-back-action="goBack">
                        <template #subtitle>
                                <div class="status-indicator" v-if="actor">
                                        <div class="status-dot"
                                                :style="{ backgroundColor: actor?.status?.color || '#4CAF50' }">
                                        </div>
                                        <span class="status-text">{{ actor?.status?.text || '在线' }}</span>
                                </div>
                        </template>
                        <template #right>
                                <button class="header-action-button" @click="goToProfile">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                                stroke-width="1.5" stroke="currentColor" width="24" height="24">
                                                <path stroke-linecap="round" stroke-linejoin="round"
                                                        d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                </button>
                        </template>
                </AppHeader>

                <main v-if="actor" class="chat-content content" @click="handleContentClick">
                        <!-- 消息列表 -->
                        <div class="messages-container" :class="{ 'sticker-panel-open': showStickerPanel }"
                                ref="messagesContainer" @scroll="handleScroll">
                                <div v-if="isLoadingMore" class="loading-indicator">
                                        <p>加载更多消息...</p>
                                </div>
                                <div v-for="message in displayedMessages" :key="message.id" class="message-item"
                                        :class="{ 'own-message': message.actorId === 'user_main' }">
                                        <div class="message-avatar" v-if="message.actorId !== 'user_main'">
                                                <span class="avatar-initial">{{ actor.name[0] }}</span>
                                        </div>
                                        <div class="message-content">
                                                <!-- 文字消息 -->
                                                <div v-if="!message.content.type || message.content.type === 'text'"
                                                        class="message-bubble">
                                                        <p>{{ message.content.content }}</p>
                                                        <div v-if="message.content.action" class="message-action">
                                                                <em>*{{ message.content.action }}*</em>
                                                        </div>
                                                </div>

                                                <!-- 表情包消息 -->
                                                <div v-else-if="message.content.type === 'sticker'"
                                                        class="sticker-message">
                                                        <img :src="message.content.url"
                                                                :alt="message.content.name || '表情包'"
                                                                class="sticker-image" />
                                                </div>

                                                <div class="message-time">
                                                        {{ formatTimestamp(message.timestamp, true) }}
                                                </div>
                                        </div>
                                </div>

                                <!-- AI正在输入的消息 -->
                                <div v-if="isTyping" class="message-item">
                                        <div class="message-avatar">
                                                <span class="avatar-initial">{{ actor.name[0] }}</span>
                                        </div>
                                        <div class="message-content">
                                                <div class="message-bubble typing-bubble breathing">
                                                        <p v-if="typingMessage">{{ typingMessage }}</p>
                                                        <div v-else class="typing-indicator">
                                                                <span class="typing-dot"></span>
                                                                <span class="typing-dot"></span>
                                                                <span class="typing-dot"></span>
                                                        </div>
                                                </div>
                                        </div>
                                </div>

                                <!-- AI正在思考的指示器 -->
                                <div v-if="isGenerating && !isTyping" class="message-item thinking-indicator">
                                        <div class="message-avatar">
                                                <span class="avatar-initial">{{ actor.name[0] }}</span>
                                        </div>
                                        <div class="message-content">
                                                <div class="message-bubble thinking-bubble">
                                                        <div class="thinking-spinner-container">
                                                                <CirclesToRhombusesSpinner :animation-duration="1200"
                                                                        :circles-num="3" :circle-size="1"
                                                                        color="var(--accent-primary)" />
                                                        </div>
                                                </div>
                                        </div>
                                </div>
                        </div>
                </main>

                <div v-else class="loading-state">
                        <p>正在加载...</p>
                </div>

                <!-- 输入区域 -->
                <div class="input-area" :class="{ 'keyboard-visible': isKeyboardVisible }" v-if="actor">
                        <div class="input-container" @click.stop>
                                <!-- 功能按钮行 -->
                                <div class="function-buttons">
                                        <button class="function-btn" :class="{ active: showStickerPanel }"
                                                @click.stop="toggleStickerPanel" title="表情包">
                                                <span>😀</span>
                                        </button>
                                        <button class="function-btn" title="发送图片">
                                                <span>📷</span>
                                        </button>
                                        <button class="function-btn" title="语音">
                                                <span>🎤</span>
                                        </button>
                                        <button class="function-btn" title="转账">
                                                <span>💰</span>
                                        </button>
                                        <button class="function-btn" title="听歌">
                                                <span>🎵</span>
                                        </button>
                                        <button class="function-btn" title="通话">
                                                <span>📞</span>
                                        </button>
                                        <button class="function-btn" title="主题">
                                                <span>🎨</span>
                                        </button>
                                </div>

                                <!-- 输入和发送行 -->
                                <div class="input-row">
                                        <textarea v-model="newMessage" placeholder="输入消息..." class="message-input"
                                                rows="1" @keydown="handleKeydown" @focus="handleInputFocus"
                                                @blur="handleInputBlur" ref="messageInput"></textarea>
                                        <button class="action-button generate-btn" @click="generateReply"
                                                :disabled="isGenerating" title="生成回复">
                                                <svg v-if="!isGenerating" xmlns="http://www.w3.org/2000/svg" fill="none"
                                                        viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
                                                        width="20" height="20">
                                                        <path stroke-linecap="round" stroke-linejoin="round"
                                                                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                                                </svg>
                                                <SpringSpinner v-else :animation-duration="3000" :size="20"
                                                        color="var(--accent-primary)" />
                                        </button>
                                        <button class="action-button send-btn" @click="sendMessage"
                                                :disabled="!newMessage.trim()" title="发送">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                                        stroke-width="1.5" stroke="currentColor" width="20" height="20">
                                                        <path stroke-linecap="round" stroke-linejoin="round"
                                                                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                                </svg>
                                        </button>
                                </div>
                        </div>


                </div>
                <!-- 表情包面板 -->
                <transition name="sticker-panel">
                        <div v-if="showStickerPanel" class="sticker-panel" @click.stop>
                                <div v-if="stickers.length === 0" class="empty-stickers">
                                        <p>还没有表情包，<router-link to="/stickers"
                                                        class="add-stickers-link">去添加</router-link>一些吧。</p>
                                </div>
                                <div v-else class="sticker-grid">
                                        <div v-for="sticker in stickers" :key="sticker.id" class="sticker-item"
                                                @click="sendSticker(sticker)">
                                                <img :src="sticker.url" :alt="sticker.name" />
                                        </div>
                                </div>
                        </div>
                </transition>
        </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useObservable } from '@vueuse/rxjs';
import { liveQuery } from 'dexie';
import { pinyin } from 'pinyin-pro';
import { CirclesToRhombusesSpinner, SpringSpinner } from 'epic-spinners';
import db from '../services/database.js';
import AppHeader from '../components/layout/Header.vue';
import { formatTimestamp } from '../utils/datetime.js';
import { generateAIReply } from '../services/aiChatAPIService.js';

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

// 打字特效相关状态
const isTyping = ref(false);
const typingMessage = ref('');
const currentTypingIndex = ref(0);
const showStickerPanel = ref(false);
const stickers = ref([]);
// 虚拟键盘状态 - 简化处理，不再依赖复杂的检测
const isKeyboardVisible = ref(false);

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

// 监听生成状态变化，确保思考指示器出现时滚动到底部
watch(isGenerating, (newValue) => {
        if (newValue) {
                nextTick(() => scrollToBottom());
        }
}, { immediate: false });

// 监听打字状态变化，确保打字时滚动到底部
watch(isTyping, (newValue) => {
        if (newValue) {
                nextTick(() => scrollToBottom());
        }
}, { immediate: false });

// 监听打字消息变化，确保打字过程中持续滚动到底部
watch(typingMessage, () => {
        if (isTyping.value) {
                nextTick(() => scrollToBottom());
        }
}, { immediate: false });

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

// 表情包面板相关方法
const toggleStickerPanel = (event) => {
        // 防止事件冒泡
        if (event) {
                event.stopPropagation();
        }
        
        showStickerPanel.value = !showStickerPanel.value;
        
        if (showStickerPanel.value) {
                // 表情面板打开时，关闭键盘
                if (messageInput.value) {
                        messageInput.value.blur();
                }
                // 滚动到底部确保表情面板可见
                nextTick(() => scrollToBottom());
        }
};

// 点击消息区域时关闭表情面板
const handleContentClick = () => {
        if (showStickerPanel.value) {
                showStickerPanel.value = false;
        }
};

// 输入框获得焦点时关闭表情面板
const handleInputFocus = () => {
        // 标记键盘为可见
        isKeyboardVisible.value = true;
        
        // 关闭表情面板
        if (showStickerPanel.value) {
                showStickerPanel.value = false;
        }
        
        // 确保输入框可见
        nextTick(() => scrollToBottom());
};

// 输入框失去焦点
const handleInputBlur = () => {
        // 标记键盘为隐藏
        isKeyboardVisible.value = false;
};

const sendSticker = async (sticker) => {
        const message = {
                timestamp: Date.now(),
                actorId: 'user_main',
                contextId: actorId.value,
                type: 'privateMessage',
                content: {
                        type: 'sticker',
                        url: sticker.url,
                        name: sticker.name
                }
        };

        try {
                await db.events.add(message);
                await updateConversation(message);
                
                // 关闭表情包面板
                showStickerPanel.value = false;
                
                // 自动生成AI回复
                setTimeout(() => {
                        generateReply();
                }, 500);
        } catch (error) {
                console.error('发送表情包失败:', error);
        }
};

// 加载表情包数据
const loadStickers = async () => {
        try {
                const allStickers = await db.stickers.toArray();
                stickers.value = allStickers;
        } catch (error) {
                console.error('加载表情包失败:', error);
        }
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

                // 自动生成AI回复（延迟一秒让用户看到自己的消息先出现）
                setTimeout(() => {
                        generateReply();
                }, 500);
        } catch (error) {
                console.error('发送消息失败:', error);
        }
};

// 模拟AI回复函数 - 带拼音打字特效
const generateReply = async () => {
        if (isGenerating.value) return;
        
        isGenerating.value = true;
        
        try {
                // 模拟思考时间
                await new Promise(resolve => setTimeout(resolve, 800));
                
                // 模拟AI回复内容（多条消息）
                const mockReplies = [
                        {
                                content: "你好呀！很高兴见到你！"
                        },
                        {
                                content: "今天天气真不错，心情也变得很棒呢~"
                        },
                        {
                                content: "有什么想聊的吗？我很乐意陪你聊天！"
                        }
                ];

                // 逐条显示消息，每条消息都有拼音打字特效
                for (let i = 0; i < mockReplies.length; i++) {
                        const reply = mockReplies[i];
                        
                        // 显示拼音打字特效
                        await simulatePinyinTyping(reply.content);
                        
                        // 保存完整消息到数据库
                        const messageEvent = {
                                timestamp: Date.now(),
                                actorId: actorId.value,
                                contextId: actorId.value,
                                type: 'privateMessage',
                                content: {
                                        content: reply.content
                                }
                        };

                        await db.events.add(messageEvent);
                        await updateConversation(messageEvent);
                        
                        // 消息间保持打字效果，只是暂停一下
                        if (i < mockReplies.length - 1) {
                                // 清空当前打字内容但保持打字状态
                                typingMessage.value = '';
                                await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
                        }
                }
                
        } catch (error) {
                console.error('生成回复失败:', error);
                
                // 添加错误消息到聊天记录
                const errorMessage = {
                        timestamp: Date.now(),
                        actorId: actorId.value,
                        contextId: actorId.value,
                        type: 'privateMessage',
                        content: {
                                content: `抱歉，出现了错误：${error.message}`
                        }
                };

                await db.events.add(errorMessage);
                await updateConversation(errorMessage);
        } finally {
                isGenerating.value = false;
                isTyping.value = false;
                typingMessage.value = '';
        }
};

/* 
// 真实AI回复函数 - 取消注释以恢复真实AI功能
const generateReply = async () => {
        if (isGenerating.value) return;
        
        isGenerating.value = true;
        
        try {
                // 获取最后一条用户消息
                const lastUserMessage = displayedMessages.value
                        .filter(msg => msg.actorId === 'user_main')
                        .pop();
                
                if (!lastUserMessage) {
                        console.warn('没有找到用户消息');
                        return;
                }

                // 调用AI服务生成回复
                const aiResult = await generateAIReply(
                        actorId.value, 
                        'user_main', 
                        lastUserMessage.content.content
                );

                if (aiResult.success && aiResult.messages) {
                        // 处理AI返回的多条消息，为每条消息添加打字特效
                        for (let i = 0; i < aiResult.messages.length; i++) {
                                const aiMessage = aiResult.messages[i];
                                
                                // 显示拼音打字特效
                                await simulatePinyinTyping(aiMessage.content);
                                
                                const messageEvent = {
                                        timestamp: Date.now(),
                                        actorId: actorId.value,
                                        contextId: actorId.value,
                                        type: 'privateMessage',
                                        content: {
                                                content: aiMessage.content,
                                                action: aiMessage.action
                                        }
                                };

                                await db.events.add(messageEvent);
                                await updateConversation(messageEvent);
                                
                                // 消息间随机间隔缩短 (500毫秒-1.5秒)
                                if (i < aiResult.messages.length - 1) {
                                        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
                                }
                        }

                        // 如果有关系变化，显示提示
                        if (aiResult.relationship && aiResult.relationship.scoreChange !== 0) {
                                console.log(`好感度变化: ${aiResult.relationship.scoreChange > 0 ? '+' : ''}${aiResult.relationship.scoreChange}`);
                        }

                        // 如果保存了新记忆，显示提示
                        if (aiResult.memory && aiResult.memory.shouldSave) {
                                console.log('AI保存了新的记忆');
                        }
                } else {
                        // AI调用失败，显示错误消息
                        await simulatePinyinTyping(aiResult.error || '抱歉，我现在无法回复。');
                        
                        const errorMessage = {
                                timestamp: Date.now(),
                                actorId: actorId.value,
                                contextId: actorId.value,
                                type: 'privateMessage',
                                content: {
                                        content: aiResult.error || '抱歉，我现在无法回复。'
                                }
                        };

                        await db.events.add(errorMessage);
                        await updateConversation(errorMessage);
                }
                
        } catch (error) {
                console.error('生成回复失败:', error);
                
                // 添加错误消息到聊天记录
                const errorText = `抱歉，出现了错误：${error.message}`;
                await simulatePinyinTyping(errorText);
                
                const errorMessage = {
                        timestamp: Date.now(),
                        actorId: actorId.value,
                        contextId: actorId.value,
                        type: 'privateMessage',
                        content: {
                                content: errorText
                        }
                };

                await db.events.add(errorMessage);
                await updateConversation(errorMessage);
        } finally {
                isGenerating.value = false;
                isTyping.value = false;
                typingMessage.value = '';
        }
};
*/

// 模拟拼音打字特效
const simulatePinyinTyping = async (fullMessage) => {
        isTyping.value = true;
        typingMessage.value = '';
        currentTypingIndex.value = 0;
        
        // 将消息转换为字符数组，正确处理中文字符
        const chars = Array.from(fullMessage);
        
        for (let i = 0; i < chars.length; i++) {
                const char = chars[i];
                
                // 如果是中文字符，模拟拼音输入过程
                if (/[\u4e00-\u9fff]/.test(char)) {
                        // 生成该字符的模拟拼音
                        const pinyinSteps = generatePinyinSteps(char);
                        
                        // 显示拼音输入过程
                        for (const step of pinyinSteps) {
                                typingMessage.value = chars.slice(0, i).join('') + step;
                                currentTypingIndex.value = i;
                                
                                // 滚动到底部确保用户看到打字效果
                                await nextTick();
                                scrollToBottom();
                                
                                // 拼音输入间隔缩短 (60-120毫秒)
                                await new Promise(resolve => setTimeout(resolve, Math.random() * 60));
                        }
                } else {
                        // 非中文字符直接显示
                        typingMessage.value = chars.slice(0, i + 1).join('');
                        currentTypingIndex.value = i;
                        
                        // 滚动到底部确保用户看到打字效果
                        await nextTick();
                        scrollToBottom();
                        
                        // 普通字符间隔缩短 (30-80毫秒)
                        await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 30));
                }
        }
        
        // 打字完成后停留时间缩短
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // 不在这里清除打字状态，由外部调用者控制
};

// 生成模拟拼音输入步骤（使用pinyin-pro库）
const generatePinyinSteps = (chineseChar) => {
        try {
                // 使用pinyin-pro获取拼音，设置为不带音调
                const pinyinResult = pinyin(chineseChar, { 
                        toneType: 'none', 
                        type: 'array' 
                });
                
                if (pinyinResult && pinyinResult.length > 0) {
                        const pinyinStr = pinyinResult[0];
                        
                        // 生成渐进式拼音输入步骤
                        const steps = [];
                        for (let i = 1; i <= pinyinStr.length; i++) {
                                steps.push(pinyinStr.substring(0, i));
                        }
                        return steps;
                }
        } catch (error) {
                console.warn(`获取 "${chineseChar}" 的拼音失败，使用备用方法:`, error);
        }
        
        // 如果pinyin-pro失败，使用备用方法
        return generateGenericPinyin(chineseChar);
};

// 生成通用拼音步骤（为未预设的汉字）
const generateGenericPinyin = (char) => {
        // 常见拼音开头字母
        const initials = ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'z', 'c', 's', 'r', 'zh', 'ch', 'sh', 'w', 'y'];
        const finals = ['a', 'o', 'e', 'i', 'u', 'v', 'ai', 'ei', 'ao', 'ou', 'an', 'en', 'ang', 'eng', 'ong'];
        
        // 随机选择一个合理的拼音组合
        const initial = initials[Math.floor(Math.random() * initials.length)];
        const final = finals[Math.floor(Math.random() * finals.length)];
        
        // 生成渐进式拼音输入
        const steps = [];
        const fullPinyin = initial + final;
        
        for (let i = 1; i <= fullPinyin.length; i++) {
                steps.push(fullPinyin.substring(0, i));
        }
        
        return steps;
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

// 监听表情包面板状态变化
watch(showStickerPanel, (newVal, oldVal) => {
        if (newVal !== oldVal) {
                nextTick(() => {
                        setTimeout(scrollToBottom, 150);
                });
        }
});

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
        
        // 加载表情包数据
        loadStickers();
        
        // 监听窗口大小变化
        const handleResize = () => {
                // 确保内容适应新的窗口大小
                nextTick(() => scrollToBottom());
        };
        
        window.addEventListener('resize', handleResize);
        
        // 清理事件监听器
        return () => {
                window.removeEventListener('resize', handleResize);
        };
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
        justify-content: center;
        gap: 6px;
}

.status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        box-shadow: 0 0 6px rgba(76, 175, 80, 0.6);
        animation: pulse 2s infinite;
}

@keyframes pulse {
        0% {
                box-shadow: 0 0 6px rgba(76, 175, 80, 0.6);
        }
        50% {
                box-shadow: 0 0 10px rgba(76, 175, 80, 0.8);
        }
        100% {
                box-shadow: 0 0 6px rgba(76, 175, 80, 0.6);
        }
}

.status-text {
        font-size: 12px;
        color: var(--text-secondary);
        font-weight: 400;
}

.chat-content {
        flex-grow: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        padding: 0;
}

.messages-container {
        flex-grow: 1;
        overflow-y: auto;
        padding: 15px 20px;
        display: flex;
        flex-direction: column;
        gap: 15px;
        transition: padding-bottom 0.3s ease;
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

.message-action {
        margin-top: 6px;
        font-style: italic;
        opacity: 0.8;
        font-size: 0.9em;
}

/* Header标题动画样式 */
.typing-title {
        display: flex;
        align-items: center;
        gap: 2px;
}

.breathing-dots {
        animation: breathing 2s ease-in-out infinite;
        color: var(--accent-primary);
}

@keyframes breathing {
        0%, 100% {
                opacity: 0.3;
                transform: scale(0.9);
        }
        50% {
                opacity: 1;
                transform: scale(1.1);
        }
}

/* 打字特效样式 */
.typing-bubble {
        background-color: var(--bg-card);
        border: 1px solid var(--border-color);
        position: relative;
        animation: typing-bubble-appear 0.3s ease-out;
}

@keyframes typing-bubble-appear {
        0% {
                opacity: 0;
                transform: translateY(10px) scale(0.95);
        }
        100% {
                opacity: 1;
                transform: translateY(0) scale(1);
        }
}

/* 思考指示器样式 */
.thinking-indicator {
        opacity: 0.8;
}

.thinking-bubble {
        background-color: var(--bg-card) !important;
        padding: 16px 20px !important;
        display: flex;
        justify-content: center;
        align-items: center;
}

.thinking-spinner-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 30px;
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
        padding-top: 5px;
        padding-bottom: max(var(--safe-bottom), 15px);
        padding-left: 15px;
        padding-right: 15px;
        backdrop-filter: blur(15px);
        -webkit-backdrop-filter: blur(15px);
        z-index: 100;
}

/* 确保在键盘弹出时input-area能够正确显示 */
.input-area.keyboard-visible {
        position: fixed;
        bottom: 0;
        z-index: 100;
}

.input-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
}

.function-buttons {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        padding: 0 5px;
}

.function-btn {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        border: 1px solid var(--border-color);
        background-color: var(--bg-card);
        color: var(--text-primary);
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
}

.function-btn:hover {
        background-color: var(--bg-secondary);
        transform: scale(1.05);
}

.function-btn:active {
        transform: scale(0.95);
}

.input-row {
        display: flex;
        gap: 10px;
        align-items: flex-end;;
}

.message-input {
        flex: 1;
        padding: 10px 15px;
        border: 1px solid var(--border-color);
        border-radius: 22px; /* 圆形输入框 */
        background-color: var(--bg-card);
        color: var(--text-primary);
        font-size: 16px;
        resize: none;
        outline: none;
        overflow-y: auto;
        line-height: 1.4;
}

.message-input:focus {
        border-color: var(--accent-primary);
}

.action-button {
        width: 44px;  /* 圆形按钮，宽高相等 */
        height: 44px;
        border: none;
        border-radius: 50%; /* 圆形按钮 */
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
}

.generate-btn {
        background-color: var(--bg-card);
        color: var(--text-primary);
        border: 1px solid var(--border-color);
}

.generate-btn:hover:not(:disabled) {
        background-color: var(--bg-secondary);
        transform: scale(1.05);
}

.send-btn {
        background-color: var(--accent-primary);
        color: var(--text-inverse);
}

.send-btn:hover:not(:disabled) {
        background-color: var(--accent-darker);
        transform: scale(1.05);
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

/* 表情包面板样式 */
.sticker-panel {
        background: var(--bg-secondary);
        border-top: 1px solid var(--border-color);
        padding: 15px;
        overflow-y: auto;
        position: relative;
        margin: 15px;
        z-index: 101; /* 确保在输入区域之上 */
        border-radius: 22px;
        height: 1000px;
}

.sticker-panel ::-webkit-scrollbar {
        display: none;
}

.sticker-panel {
        -ms-overflow-style: none;
        /* IE and Edge */
        scrollbar-width: none;
        /* Firefox */
}

/* 调整动画使其更流畅 */
.sticker-panel-enter-active,
.sticker-panel-leave-active {
        transition: transform 0.3s ease, opacity 0.3s ease;
}
.empty-stickers {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        color: var(--text-secondary);
        text-align: center;
}

.add-stickers-link {
        color: var(--accent-primary);
        text-decoration: none;
        font-weight: 500;
}

.add-stickers-link:hover {
        text-decoration: underline;
}

.sticker-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 10px;
        padding: 5px 0;
}

.sticker-item {
        aspect-ratio: 1;
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        transition: transform 0.2s ease;
        background: var(--bg-primary);
        border: 1px solid var(--border-light);
}

.sticker-item:hover {
        transform: scale(1.1);
}

.sticker-item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
}

/* 表情包消息样式 */
.sticker-message {
        display: inline-block;
}

.sticker-image {
        max-width: 120px;
        max-height: 120px;
        border-radius: 8px;
}

/* 面板切换动画 */
.sticker-panel-enter-active,
.sticker-panel-leave-active {
        transition: all 0.2s ease;
}

.sticker-panel-enter-from,
.sticker-panel-leave-to {
        height: 0;
        opacity: 0;
        padding-top: 0;
        padding-bottom: 0;
}

.sticker-panel-enter-to,
.sticker-panel-leave-from {
        opacity: 1;
        transform: translateY(0);
}

/* 功能按钮激活状态 */
.function-btn.active {
        background-color: var(--accent-primary);
        color: var(--text-inverse);
}

.function-btn.active:hover {
        background-color: var(--accent-darker);
}

/* 打字效果呼吸动画 */
.typing-bubble.breathing {
        animation: breathing 2s ease-in-out infinite;
}

@keyframes breathing {
        0%, 100% {
                transform: scale(1);
                opacity: 0.9;
        }
        50% {
                transform: scale(1.02);
                opacity: 1;
        }
}

/* 打字指示器 */
.typing-indicator {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 2px 0;
}

.typing-dot {
        width: 6px;
        height: 6px;
        background-color: var(--text-secondary);
        border-radius: 50%;
        animation: typing-pulse 1.4s ease-in-out infinite;
}

.typing-dot:nth-child(1) {
        animation-delay: 0s;
}

.typing-dot:nth-child(2) {
        animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
        animation-delay: 0.4s;
}

@keyframes typing-pulse {
        0%, 60%, 100% {
                opacity: 0.3;
                transform: scale(1);
        }
        30% {
                opacity: 1;
                transform: scale(1.2);
        }
}

/* 输入区域被顶起的效果 */
.input-area {
        position: relative;
}

.input-container {
        background: var(--bg-primary);
        border-top: 1px solid var(--border-light);
}
</style>