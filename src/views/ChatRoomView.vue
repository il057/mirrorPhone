<template>
        <div class="page-container">
                <AppHeader :title="isTyping ? '正在输入中…' : (actor?.name || '聊天')" :override-back-action="goBack">
                        <template #subtitle>
                                <div class="status-indicator" v-if="actor">
                                        <div class="status-dot" :style="{ 
                                                        backgroundColor: actor?.status?.color || '#4CAF50',
                                                        '--status-color': `${actor?.status?.color || '#4CAF50'}66`
                                                }">
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

                <!-- 聊天室音乐播放器 -->
                <ChatMusicPlayer ref="chatMusicPlayer" 
                        :listen-together="listenTogetherMode.active"
                        :listen-together-start-time="listenTogetherMode.startTime"
                        :listen-together-duration="currentActorListenTogetherDuration"
                        :listen-together-partner="actor?.name"
                        :global-listen-together-info="globalListenTogetherSessionInfo" />

                <main v-if="actor" class="chat-content content" @click="handleContentClick">
                        <!-- 消息列表 -->
                        <div class="messages-container" :class="{ 'sticker-panel-open': showStickerPanel }"
                                ref="messagesContainer" @scroll="handleScroll">
                                <div v-if="isLoadingMore" class="loading-indicator">
                                        <p>加载更多消息...</p>
                                </div>
                                <div v-for="message in displayedMessages" :key="message.id" class="message-item"
                                        :class="{ 
                                                'own-message': message.actorId === userActorId,
                                                'system-message': message.actorId === 'system' && message.content.isVisible
                                        }"
                                        v-show="!(message.actorId === 'system' && !message.content.isVisible)">
                                        
                                        <!-- 系统消息 - 居中显示 -->
                                        <div v-if="message.actorId === 'system' && message.content.isVisible" 
                                             class="system-message-content">
                                                <span>{{ message.content.content }}</span>
                                        </div>
                                        
                                        <!-- 普通消息 -->
                                        <template v-else-if="message.actorId !== 'system'">
                                                <!-- 对方头像 -->
                                                <div class="message-avatar" v-if="message.actorId !== userActorId">
                                                        <img v-if="actor?.avatar" :src="actor.avatar" :alt="actor.name">
                                                        <span v-else class="avatar-initial">{{ actor?.name?.[0] || '#' }}</span>
                                                </div>

                                                <!-- 用户头像 -->
                                                <div class="message-avatar" v-else>
                                                        <img v-if="currentUserPersona?.avatar" :src="currentUserPersona.avatar"
                                                                :alt="currentUserPersona?.name || 'User'">
                                                        <span v-else class="avatar-initial">{{
                                                                getInitial(currentUserPersona?.name || 'User') }}</span>
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

                                                <!-- 图片消息 -->
                                                <div v-else-if="message.content.type === 'image'" class="image-message">
                                                        <!-- 文字图片 -->
                                                        <div v-if="message.content.subtype === 'text'"
                                                                class="text-image-placeholder">
                                                                <div class="text-image-description">{{
                                                                        message.content.description }}</div>
                                                        </div>
                                                        <!-- 真实图片 -->
                                                        <img v-else :src="message.content.url"
                                                                :alt="message.content.fileName || '图片'"
                                                                class="real-image" @load="scrollToBottom" />
                                                </div>

                                                <!-- 支付消息 -->
                                                <div v-else-if="message.content.type === 'payment'"
                                                        class="payment-message">
                                                        <div class="payment-header">
                                                                <span class="payment-type">
                                                                        {{ message.content.subtype === 'transfer' ? '转账'
                                                                        : '代付' }}
                                                                </span>
                                                        </div>
                                                        <div class="payment-amount">¥{{
                                                                message.content.amount.toFixed(2) }}</div>
                                                        <div v-if="message.content.productInfo" class="payment-product">
                                                                商品：{{ message.content.productInfo }}
                                                        </div>
                                                        <div v-if="message.content.message" class="payment-note">
                                                                {{ message.content.message }}
                                                        </div>
                                                </div>

                                                <!-- 语音消息 -->
                                                <VoiceBubble v-else-if="message.content.type === 'voice'"
                                                        :text="message.content.text"
                                                        :duration="message.content.duration"
                                                        :is-own-message="message.actorId === userActorId"
                                                        :auto-show="personalSettings.voiceMessage?.autoShowText ?? true" />

                                                <!-- 一起听邀请消息 -->
                                                <div v-else-if="message.content.type === 'listen-together-invite'"
                                                        class="listen-together-invite message-bubble">
                                                        <div class="invite-header">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16"
                                                                        height="16" fill="currentColor"
                                                                        class="bi bi-headphones" viewBox="0 0 16 16">
                                                                        <path
                                                                                d="M8 3a5 5 0 0 0-5 5v1h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a6 6 0 1 1 12 0v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1V8a5 5 0 0 0-5-5" />
                                                                </svg>
                                                                <span>一起听音乐</span>
                                                        </div>
                                                        <div class="playlist-info">
                                                                <div class="playlist-name">{{
                                                                        message.content.playlist.name }}</div>
                                                                <div class="playlist-tracks">{{
                                                                        message.content.playlist.tracks }} 首歌曲</div>
                                                        </div>
                                                        <div class="invite-message">{{ message.content.message }}</div>
                                                        <div v-if="message.content.status === 'pending' && message.actorId !== userActorId"
                                                                class="invite-actions">
                                                                <button class="accept-btn"
                                                                        @click="acceptListenTogetherInvite(message.timestamp, message.content.playlist)">
                                                                        接受
                                                                </button>
                                                                <button class="decline-btn"
                                                                        @click="declineListenTogetherInvite(message.timestamp)">
                                                                        拒绝
                                                                </button>
                                                        </div>
                                                        <div v-else-if="message.content.status === 'accepted'"
                                                                class="invite-status accepted">
                                                                ✓ 已接受邀请
                                                        </div>
                                                        <div v-else-if="message.content.status === 'declined'"
                                                                class="invite-status declined">
                                                                ✗ 已拒绝邀请
                                                        </div>
                                                </div>

                                                <!-- 一起听接受消息 -->
                                                <div v-else-if="message.content.type === 'listen-together-accept'"
                                                        class="listen-together-accept message-bubble">
                                                        <div class="accept-icon">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16"
                                                                        height="16" fill="currentColor"
                                                                        class="bi bi-check-circle" viewBox="0 0 16 16">
                                                                        <path
                                                                                d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                                                                        <path
                                                                                d="m10.97 4.97-.02.022-3.473 4.425-2.093-2.094a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05" />
                                                                </svg>
                                                        </div>
                                                        <span>{{ message.content.message }}</span>
                                                </div>

                                                <!-- 系统消息 -->
                                                <div v-else-if="message.content.type === 'system'"
                                                        class="system-message">
                                                        <div v-if="message.content.isVisible" class="system-message-content">
                                                                {{ message.content.content }}
                                                        </div>
                                                        <!-- 不可见的系统消息不显示 -->
                                                </div>

                                                <!-- 音乐卡片消息 -->
                                                <div v-else-if="message.content.type === 'music-card'"
                                                        class="music-card message-bubble">
                                                        <div class="music-card-header">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16"
                                                                        height="16" fill="currentColor"
                                                                        class="bi bi-music-note" viewBox="0 0 16 16">
                                                                        <path
                                                                                d="M9 13c0 1.105-1.12 2-2.5 2S4 14.105 4 13s1.12-2 2.5-2 2.5.895 2.5 2" />
                                                                        <path fill-rule="evenodd" d="M9 3v10H8V3z" />
                                                                        <path
                                                                                d="M8 2.82a1 1 0 0 1 .804-.98l3-.6A1 1 0 0 1 13 2.22V4L8 5z" />
                                                                </svg>
                                                                <span>音乐分享</span>
                                                        </div>
                                                        <div class="song-info">
                                                                <div class="song-name">{{ message.content.song.name }}
                                                                </div>
                                                                <div class="song-artist">{{
                                                                        getArtistNames(message.content.song.artists) }}
                                                                </div>
                                                                <div class="song-album">{{
                                                                        message.content.song.album.name }}</div>
                                                        </div>
                                                        <div class="music-card-message">{{ message.content.message }}
                                                        </div>
                                                        <button class="play-song-btn"
                                                                @click="playSingleSong(message.content.song)">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16"
                                                                        height="16" fill="currentColor"
                                                                        class="bi bi-play-circle" viewBox="0 0 16 16">
                                                                        <path
                                                                                d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                                                                        <path
                                                                                d="M6.271 5.055a.5.5 0 0 1 .52.038L11 7.055a.5.5 0 0 1 0 .89L6.791 9.907a.5.5 0 0 1-.791-.389V5.482a.5.5 0 0 1 .271-.427" />
                                                                </svg>
                                                                播放
                                                        </button>
                                                </div>

                                                <div class="message-time">
                                                        {{ formatTimestamp(message.timestamp, true) }}
                                                </div>
                                        </div>
                                        </template>
                                </div>

                                <!-- AI正在输入的消息（包含思考和打字状态） -->
                                <div v-if="isTyping || isGenerating" class="message-item">
                                        <div class="message-avatar">
                                                <img v-if="actor?.avatar" :src="actor.avatar" :alt="actor.name">
                                                <span v-else class="avatar-initial">{{ actor?.name?.[0] || '#' }}</span>
                                        </div>
                                        <div class="message-content">
                                                <div class="message-bubble typing-bubble">
                                                        <!-- 如果正在打字且有内容，显示打字内容 -->
                                                        <p v-if="isTyping && typingMessage">{{ typingMessage }}</p>
                                                        <!-- 否则显示思考/打字指示器 -->
                                                        <div v-else class="typing-indicator">
                                                                <CirclesToRhombusesSpinner :animation-duration="1200"
                                                                        :circles-num="3" :circle-size="1"
                                                                        color="var(--char-bubble-text)" />
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
                                                <svg xmlns="http://www.w3.org/2000/svg" height="24"
                                                        viewBox="0 -960 960 960" width="24" fill="currentColor">
                                                        <path
                                                                d="M260-280q-26 0-43-17t-17-43q0-25 17-42.5t43-17.5q25 0 42.5 17.5T320-340q0 26-17.5 43T260-280Zm0-280q-26 0-43-17t-17-43q0-25 17-42.5t43-17.5q25 0 42.5 17.5T320-620q0 26-17.5 43T260-560Zm140 120v-80h160v80H400Zm288 200-66-44q28-43 43-92.5T680-480q0-66-21.5-124T598-709l61-51q48 57 74.5 128.5T760-480q0 67-19 127.5T688-240Z" />
                                                </svg>
                                        </button>
                                        <button class="function-btn" @click.stop="handleSendImage" title="发送图片">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                        fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                                                        stroke="currentColor" class="size-6">
                                                        <path stroke-linecap="round" stroke-linejoin="round"
                                                                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                                </svg>

                                        </button>
                                        <button class="function-btn" @click.stop="handleVoiceMessage" title="语音">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                        fill="currentColor" class="bi bi-mic" viewBox="0 0 16 16">
                                                        <path
                                                                d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5" />
                                                        <path
                                                                d="M10 8a2 2 0 1 1-4 0V3a2 2 0 1 1 4 0zM8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3" />
                                                </svg>
                                        </button>
                                        <button class="function-btn" @click.stop="handlePayment" title="转账">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35"
                                                        fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                                                        stroke="currentColor" class="size-6">
                                                        <path stroke-linecap="round" stroke-linejoin="round"
                                                                d="m9 7.5 3 4.5m0 0 3-4.5M12 12v5.25M15 12H9m6 3H9m12-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                                </svg>
                                        </button>
                                        <button class="function-btn" @click.stop="handleMusicShare" title="听歌">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                        fill="currentColor" class="bi bi-music-note"
                                                        viewBox="0 0 16 16">
                                                        <path
                                                                d="M9 13c0 1.105-1.12 2-2.5 2S4 14.105 4 13s1.12-2 2.5-2 2.5.895 2.5 2" />
                                                        <path fill-rule="evenodd" d="M9 3v10H8V3z" />
                                                        <path
                                                                d="M8 2.82a1 1 0 0 1 .804-.98l3-.6A1 1 0 0 1 13 2.22V4L8 5z" />
                                                </svg>
                                        </button>
                                        <button class="function-btn" @click.stop="handleCall" title="通话">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                        fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                                                        stroke="currentColor" class="size-6">
                                                        <path stroke-linecap="round" stroke-linejoin="round"
                                                                d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                                                </svg>

                                        </button>
                                        <button class="function-btn" title="主题" @click="toggleThemeColor">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                        fill="currentColor" class="bi bi-circle-half"
                                                        viewBox="0 0 16 16"
                                                        :style="isUsingUserBubbleTheme ? 'transform: scaleX(-1);' : ''">
                                                        <path
                                                                d="M8 15A7 7 0 1 0 8 1zm0 1A8 8 0 1 1 8 0a8 8 0 0 1 0 16" />
                                                </svg>
                                        </button>
                                </div>

                                <!-- 输入和发送行 -->
                                <div class="input-row">
                                        <textarea v-model="newMessage" placeholder="输入消息..." class="message-input"
                                                rows="1" @keydown="handleKeydown" @focus="handleInputFocus"
                                                @blur="handleInputBlur" ref="messageInput"></textarea>
                                        <button class="action-button generate-btn" @click="generateReply"
                                                :disabled="isGenerating" title="生成回复">
                                                <svg v-if="!isGenerating" xmlns="http://www.w3.org/2000/svg" width="24"
                                                        height="24" fill="currentColor" class="bi bi-stars"
                                                        viewBox="0 0 16 16">
                                                        <path
                                                                d="M7.657 6.247c.11-.33.576-.33.686 0l.645 1.937a2.89 2.89 0 0 0 1.829 1.828l1.936.645c.33.11.33.576 0 .686l-1.937.645a2.89 2.89 0 0 0-1.828 1.829l-.645 1.936a.361.361 0 0 1-.686 0l-.645-1.937a2.89 2.89 0 0 0-1.828-1.828l-1.937-.645a.361.361 0 0 1 0-.686l1.937-.645a2.89 2.89 0 0 0 1.828-1.828zM3.794 1.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387A1.73 1.73 0 0 0 4.593 5.69l-.387 1.162a.217.217 0 0 1-.412 0L3.407 5.69A1.73 1.73 0 0 0 2.31 4.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387A1.73 1.73 0 0 0 3.407 2.31zM10.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.16 1.16 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.16 1.16 0 0 0-.732-.732L9.1 2.137a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732z" />
                                                </svg>
                                                <SpringSpinner v-else :animation-duration="3000" :size="20"
                                                        color="var(--accent-primary)" />
                                        </button>
                                        <button class="action-button send-btn" @click="sendMessage"
                                                :disabled="!newMessage.trim()" title="发送">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                        fill="none" viewBox="0 0 24 24" stroke-width="2"
                                                        stroke="currentColor" class="size-6">
                                                        <path stroke-linecap="round" stroke-linejoin="round"
                                                                d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
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

                <!-- 歌单选择模态框 -->
                <PlaylistPickerModal v-if="showPlaylistPicker" @select="onPlaylistSelected"
                        @cancel="showPlaylistPicker = false" />

                <!-- 歌曲搜索模态框 -->
                <SongSearchModal v-if="showSongSearch" @select="onSongSelected" @cancel="showSongSearch = false" />
        </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useObservable } from '@vueuse/rxjs';
import { liveQuery } from 'dexie';
import { pinyin } from 'pinyin-pro';
import { CirclesToRhombusesSpinner, SpringSpinner } from 'epic-spinners';
import db from '../services/database.js';
import AppHeader from '../components/layout/Header.vue';
import VoiceBubble from '../components/ui/VoiceBubble.vue';
import ChatMusicPlayer from '../components/ui/ChatMusicPlayer.vue';
import PlaylistPickerModal from '../components/ui/PlaylistPickerModal.vue';
import SongSearchModal from '../components/ui/SongSearchModal.vue';
import { formatTimestamp, formatDuration } from '../utils/datetime.js';
import { generateAIReply } from '../services/aiChatAPIService.js';
import { getUserPersonaForGroup, getUserPersonaForUngrouped, getDefaultUserPersona } from '../services/userPersonaService.js';
import { USER_ACTOR_ID } from '../services/database.js';
import { getPersonalSettings, getTypingDelayConfig, getRandomMessageDelay, calculateVoiceDuration } from '../services/personalSettingsService.js';
import { getActorBubbleStyle, applyBubbleStyles } from '../services/bubbleStyleService.js';
import { applyActorTheme, toggleActorTheme, restoreOriginalTheme, getActorThemeChoice } from '../services/themeService.js';
import { showActionChoiceModal, showPaymentModal, showUploadChoiceModal, promptForInput, showToast } from '../services/uiService.js';
import spotifyService from '../services/spotifyService.js';
import * as listenTogetherService from '../services/listenTogetherService.js';

const route = useRoute();
const router = useRouter();
const actorId = ref(route.params.id);
const newMessage = ref('');
const isGenerating = ref(false);
const isLoadingMore = ref(false);
const messagesContainer = ref(null);
const messageInput = ref(null);

// 用户ID常量，用于模板
const userActorId = USER_ACTOR_ID;

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

// 个人设置
const personalSettings = ref({
        typingSimulation: {
                enabled: true,
                speed: 5
        },
        voiceMessage: {
                autoShowText: true
        }
});

// 主题相关状态
const currentBubbleStyle = ref(null);
// 从localStorage读取用户对这个角色的主题选择
const isUsingUserBubbleTheme = ref(getActorThemeChoice(actorId.value));

// 音乐相关状态
const chatMusicPlayer = ref(null);
const showPlaylistPicker = ref(false);
const showSongSearch = ref(false);

// 一起听状态 - 从数据库读取
const listenTogetherSession = useObservable(
        liveQuery(async () => {
                return await listenTogetherService.getCurrentListenTogetherSession();
        }),
        { initialValue: null }
);

// 计算属性：正在一起听的角色的总时长（包括当前会话）
const currentActorListenTogetherDuration = useObservable(
        liveQuery(async () => {
                // 获取当前活跃的一起听会话
                const currentSession = await listenTogetherService.getCurrentListenTogetherSession();
                if (!currentSession || !currentSession.isActive) {
                        return 0; // 如果没有活跃会话，返回0
                }
                
                // 返回正在一起听的角色的总时长
                return await listenTogetherService.getTotalListenTogetherDurationWithCurrent(currentSession.actorId);
        }),
        { initialValue: 0 }
);

// 计算属性：全局一起听会话信息
const globalListenTogetherSessionInfo = useObservable(
        liveQuery(async () => {
                const sessionInfo = await listenTogetherService.getCurrentListenTogetherSessionInfo();
                if (!sessionInfo) return null;
                
                // 添加总时长信息
                const totalDuration = await listenTogetherService.getTotalListenTogetherDurationWithCurrent(sessionInfo.actorId);
                return {
                        ...sessionInfo,
                        totalDuration
                };
        }),
        { initialValue: null }
);

// 计算属性：一起听模式状态（为了兼容现有组件）
const listenTogetherMode = computed(() => {
        const session = listenTogetherSession.value;
        if (!session || !session.isActive || session.actorId !== actorId.value) {
                return {
                        active: false,
                        startTime: null,
                        playlist: null,
                        inviteMessageId: null
                };
        }
        
        return {
                active: true,
                startTime: session.startTime,
                playlist: session.playlistInfo,
                inviteMessageId: session.id
        };
});

// 获取角色信息
const actor = useObservable(
        liveQuery(() => db.actors.get(actorId.value)),
        { initialValue: null }
);

// 获取当前聊天应显示的用户人格（仅用于显示）
const currentUserPersona = useObservable(
        liveQuery(async () => {
                // 获取当前角色信息
                const currentActor = await db.actors.get(actorId.value);
                if (!currentActor) {
                        console.log('ChatRoom: currentActor not found, using default persona');
                        return await getDefaultUserPersona();
                }
                
                // 获取角色的分组ID
                const groupId = currentActor.groupIds?.[0];
                console.log('ChatRoom: currentActor', currentActor.name, 'groupId:', groupId);
                
                if (groupId) {
                        // 有分组，获取该分组绑定的用户人格
                        const groupPersona = await getUserPersonaForGroup(groupId);
                        console.log('ChatRoom: groupPersona for', groupId, ':', groupPersona);
                        if (groupPersona) return groupPersona;
                }
                
                // 没有分组或没有绑定的人格，使用默认人格
                const defaultPersona = await getDefaultUserPersona();
                console.log('ChatRoom: using defaultPersona:', defaultPersona);
                return defaultPersona;
        }),
        { initialValue: null }
);

// 获取所有消息（用于懒加载）
const allMessages = useObservable(
        liveQuery(async () => {
                const allEvents = await db.events
                        .where('contextId').equals(actorId.value)
                        .and(event => event.type === 'privateMessage')
                        .toArray();
                return allEvents.sort((a, b) => a.timestamp - b.timestamp);
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

// 监听AI状态变化，确保状态指示器出现时滚动到底部
watch([isGenerating, isTyping], () => {
        nextTick(() => scrollToBottom());
}, { immediate: false });

// 监听打字消息变化，确保打字过程中持续滚动到底部
watch(typingMessage, () => {
        if (isTyping.value) {
                nextTick(() => scrollToBottom());
        }
}, { immediate: false });

// 监控当前用户人格变化（调试用）
watch(currentUserPersona, (newPersona, oldPersona) => {
        console.log('ChatRoom: currentUserPersona changed from', oldPersona, 'to', newPersona);
}, { immediate: true });

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
                actorId: USER_ACTOR_ID,
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

// 主题色切换功能
const toggleThemeColor = () => {
        isUsingUserBubbleTheme.value = toggleActorTheme();
};

// 处理发送图片
const handleSendImage = async () => {
        const actions = [
                { key: 'text-image', label: '文字图片', iconType: 'text-image' },
                { key: 'upload-image', label: '上传图片', iconType: 'upload-image' }
        ];
        
        const choice = await showActionChoiceModal('发送图片', actions);
        if (!choice) return;
        
        if (choice === 'text-image') {
                const description = await promptForInput(
                        '文字图片描述', 
                        '请描述你想要的图片内容', 
                        true, 
                        false
                );
                
                if (description) {
                        await sendTextImage(description);
                }
        } else if (choice === 'upload-image') {
                // 提示用户关于视觉功能
                showToast('提示：如需AI识别图片内容，请确保使用支持视觉功能的模型', 'info');
                
                const uploadResult = await showUploadChoiceModal();
                if (uploadResult) {
                        if (uploadResult.type === 'local' && Array.isArray(uploadResult.value)) {
                                // 多张图片
                                for (const file of uploadResult.value) {
                                        await sendRealImage(file);
                                }
                        } else {
                                // 单张图片
                                await sendRealImage(uploadResult.value);
                        }
                }
        }
};

// 发送文字图片
const sendTextImage = async (description) => {
        const message = {
                id: Date.now() + Math.random(),
                actorId: userActorId,
                contextId: actorId.value,
                type: 'privateMessage',
                content: {
                        type: 'image',
                        subtype: 'text',
                        description: description,
                        url: null
                },
                timestamp: Date.now()
        };

        try {
                await db.events.add(message);
                await updateConversation(message);
        } catch (error) {
                console.error('发送文字图片失败:', error);
                showToast('发送失败', 'error');
        }
};

// 发送真实图片
const sendRealImage = async (imageData) => {
        const message = {
                id: Date.now() + Math.random(),
                actorId: userActorId,
                contextId: actorId.value,
                type: 'privateMessage',
                content: {
                        type: 'image',
                        subtype: 'real',
                        url: typeof imageData === 'string' ? imageData : URL.createObjectURL(imageData),
                        fileName: typeof imageData === 'string' ? null : imageData.name
                },
                timestamp: Date.now()
        };

        try {
                await db.events.add(message);
                await updateConversation(message);
        } catch (error) {
                console.error('发送图片失败:', error);
                showToast('发送失败', 'error');
        }
};

// 处理语音消息
const handleVoiceMessage = async () => {
        const description = await promptForInput(
                '语音描述', 
                '请输入语音消息内容...', 
                true, // 使用多行文本框
                false // 不允许为空
        );
        
        if (!description) return;
        
        await sendVoiceMessage(description);
};

// 发送语音消息
const sendVoiceMessage = async (text) => {
        const duration = calculateVoiceDuration(text);
        
        const message = {
                id: Date.now() + Math.random(),
                actorId: userActorId,
                contextId: actorId.value,
                type: 'privateMessage',
                content: {
                        type: 'voice',
                        text: text,
                        duration: duration
                },
                timestamp: Date.now()
        };

        try {
                await db.events.add(message);
                await updateConversation(message);
                showToast('语音消息发送成功', 'success');
                
                // 自动生成AI回复
                setTimeout(() => {
                        generateReply();
                }, 500);
        } catch (error) {
                console.error('发送语音消息失败:', error);
                showToast('发送失败', 'error');
        }
};

// 处理转账
const handlePayment = async () => {
        const actions = [
                { key: 'transfer', label: '转账', iconType: 'transfer' },
                { key: 'pay', label: '代付', iconType: 'pay' }
        ];
        
        const choice = await showActionChoiceModal('支付选项', actions);
        if (!choice) return;
        
        const paymentData = await showPaymentModal(choice);
        if (paymentData) {
                await sendPaymentMessage(paymentData);
        }
};

// 发送支付消息
const sendPaymentMessage = async (paymentData) => {
        const message = {
                id: Date.now() + Math.random(),
                actorId: userActorId,
                contextId: actorId.value,
                type: 'privateMessage',
                content: {
                        type: 'payment',
                        subtype: paymentData.type,
                        amount: paymentData.amount,
                        message: paymentData.message,
                        productInfo: paymentData.productInfo
                },
                timestamp: Date.now()
        };

        try {
                await db.events.add(message);
                await updateConversation(message);
                showToast(`${paymentData.type === 'transfer' ? '转账' : '代付'}发送成功`, 'success');
        } catch (error) {
                console.error('发送支付消息失败:', error);
                showToast('发送失败', 'error');
        }
};

// 处理通话
const handleCall = async () => {
        const actions = [
                { key: 'voice', label: '语音通话', iconType: 'voice' },
                { key: 'video', label: '视频通话', iconType: 'video' }
        ];
        
        const choice = await showActionChoiceModal('通话选项', actions);
        if (choice) {
                showToast(`${choice === 'voice' ? '语音' : '视频'}通话功能暂未实现`, 'info');
        }
};

// 处理音乐分享
const handleMusicShare = async () => {
        // 检查当前是否正在与此角色一起听
        const isListeningTogether = await listenTogetherService.isListeningTogetherWith(actorId.value);
        
        const actions = [
                { 
                        key: 'listen-together', 
                        label: isListeningTogether ? '退出一起听' : '一起听', 
                        iconType: isListeningTogether ? 'exit-listen-together' : 'listen-together' 
                },
                { key: 'song', label: '分享单曲', iconType: 'song' }
        ];
        
        const choice = await showActionChoiceModal('音乐分享', actions);
        if (!choice) return;
        
        if (choice === 'listen-together') {
                if (isListeningTogether) {
                        await handleExitListenTogether();
                } else {
                        await handleListenTogether();
                }
        } else if (choice === 'song') {
                await handleShareSong();
        }
};

// 处理一起听功能
// 处理一起听功能
const handleListenTogether = async () => {
        try {
                // 检查是否登录Spotify
                if (!spotifyService.isLoggedIn()) {
                        showToast('请先登录Spotify', 'warning');
                        return;
                }
                
                // 尝试清理可能存在的损坏数据
                try {
                        const currentSession = await listenTogetherService.getCurrentListenTogetherSession();
                        if (currentSession && currentSession.actorId === actorId.value) {
                                // 如果当前已经有会话，先结束它
                                await listenTogetherService.endListenTogetherSession(actorId.value);
                        }
                } catch (cleanupError) {
                        console.warn('清理现有会话时出错:', cleanupError);
                        // 如果清理失败，尝试强制清理
                        await listenTogetherService.cleanupCorruptedSessions();
                }
                
                // 显示歌单选择界面
                showPlaylistPicker.value = true;
                
        } catch (error) {
                console.error('发起一起听失败:', error);
                
                // 如果是数据库错误，尝试修复
                if (error.name === 'DexieError' || error.message.includes('IDBObjectStore')) {
                        try {
                                console.log('检测到数据库错误，尝试修复...');
                                await listenTogetherService.cleanupCorruptedSessions();
                                showToast('已修复数据错误，请重试', 'info');
                        } catch (fixError) {
                                console.error('修复失败:', fixError);
                                showToast('数据库错误，请刷新页面重试', 'error');
                        }
                } else {
                        showToast('发起一起听失败', 'error');
                }
        }
};

// 处理退出一起听功能
const handleExitListenTogether = async () => {
        try {
                // 结束一起听会话
                await listenTogetherService.endListenTogetherSession(actorId.value);
                
                // 发送系统消息
                await sendSystemMessage('已结束一起听音乐', true, 'listen-together-end');
                
                showToast('已退出一起听', 'success');
                
        } catch (error) {
                console.error('退出一起听失败:', error);
                showToast('退出一起听失败', 'error');
        }
};

// 选择歌单后发送邀请
const onPlaylistSelected = async (playlist) => {
        showPlaylistPicker.value = false;
        
        try {
                // 直接发送邀请消息，不立即播放
                await sendListenTogetherInvite(playlist);
        } catch (error) {
                console.error('发送邀请失败:', error);
                showToast('发送邀请失败', 'error');
        }
};

// 发送一起听邀请
const sendListenTogetherInvite = async (playlist) => {
        const message = {
                timestamp: Date.now(),
                actorId: USER_ACTOR_ID,
                contextId: actorId.value,
                type: 'privateMessage',
                content: {
                        type: 'listen-together-invite',
                        playlist: {
                                id: playlist.id,
                                name: playlist.name,
                                tracks: playlist.tracks?.total || 0,
                                uri: playlist.uri,
                                // 只存储第一张图片的URL，避免复杂对象
                                imageUrl: playlist.images?.[0]?.url || null
                        },
                        status: 'pending', // pending, accepted, declined
                        message: `邀请你一起听「${playlist.name}」`
                }
        };

        try {
                await db.events.add(message);
                await updateConversation(message);
                
                showToast('邀请已发送', 'success');
                
                // 根据个人设置决定是否自动接受邀请
                if (personalSettings.value.musicSharing?.autoAcceptListenTogether) {
                        setTimeout(async () => {
                                await acceptListenTogetherInvite(message.timestamp, playlist);
                        }, 1000);
                }
                
        } catch (error) {
                console.error('发送一起听邀请失败:', error);
                showToast('发送邀请失败', 'error');
        }
};

// 接受一起听邀请
const acceptListenTogetherInvite = async (inviteTimestamp, playlist = null) => {
        try {
                // 如果没有传入playlist，尝试从消息中获取
                if (!playlist) {
                        const inviteMessage = displayedMessages.value.find(msg => 
                                msg.timestamp === inviteTimestamp && 
                                msg.content.type === 'listen-together-invite'
                        );
                        if (inviteMessage && inviteMessage.content.playlist) {
                                playlist = inviteMessage.content.playlist;
                        }
                }
                
                // 启动一起听会话（不再存储playlist和track信息到数据库）
                await listenTogetherService.startListenTogetherSession(actorId.value);
                
                // 发送系统消息通知开始一起听
                const systemMessage = `开始一起听音乐`;
                await sendSystemMessage(systemMessage);
                
                // 如果有播放列表信息，开始播放并发送音乐消息
                if (playlist && playlist.uri) {
                        try {
                                // 确保播放器可用
                                await ensurePlayerAvailable();
                                
                                // 使用安全播放操作，自动处理设备问题
                                await spotifyService.safePlaybackOperation(async () => {
                                        // 先停止当前播放
                                        await spotifyService.pausePlayback();
                                        
                                        // 播放选择的歌单
                                        await spotifyService.playPlaylist(playlist.uri);
                                });
                                
                                showToast(`开始播放「${playlist.name}」`, 'success');
                                
                                setTimeout(async () => {
                                        // 先从Spotify获取最新的播放状态
                                        const playbackState = await spotifyService.getCurrentPlayback();
                                        if (playbackState && playbackState.item) {
                                                // 将获取到的歌曲信息传递下去
                                                await sendMusicPlayMessage(playbackState.item);
                                        }
                                }, 2000);
                                
                                // 监听播放状态变化
                                startTrackingMusic();
                        } catch (playError) {
                                console.error('播放歌单失败:', playError);
                                showToast('播放歌单失败，但一起听会话已建立', 'warning');
                        }
                }
                
                // 更新原始邀请消息的状态
                const inviteMessage = await db.events.where('timestamp').equals(inviteTimestamp).first();
                if (inviteMessage) {
                        await db.events.update(inviteMessage.id, {
                                'content.status': 'accepted'
                        });
                }

                // 更新播放器状态
                if (chatMusicPlayer.value) {
                        setTimeout(async () => {
                                await chatMusicPlayer.value.updatePlaybackState();
                        }, 1000);
                }
                
                showToast('开始一起听音乐！', 'success');
                
        } catch (error) {
                console.error('接受一起听邀请失败:', error);
                
                // 如果是数据库错误，尝试修复
                if (error.name === 'DexieError' || error.message.includes('IDBObjectStore')) {
                        try {
                                console.log('检测到数据库错误，尝试修复...');
                                await listenTogetherService.cleanupCorruptedSessions();
                                showToast('已修复数据错误，请重试接受邀请', 'info');
                        } catch (fixError) {
                                console.error('修复失败:', fixError);
                                showToast('数据库错误，请刷新页面重试', 'error');
                        }
                } else {
                        showToast('接受邀请失败', 'error');
                }
        }
};

// 处理分享单曲
const handleShareSong = async () => {
        try {
                // 检查是否登录Spotify
                if (!spotifyService.isLoggedIn()) {
                        showToast('请先登录Spotify', 'warning');
                        return;
                }
                
                // 显示歌曲搜索界面
                showSongSearch.value = true;
                
        } catch (error) {
                console.error('分享单曲失败:', error);
                showToast('分享单曲失败', 'error');
        }
};

// 选择歌曲后发送卡片
const onSongSelected = async (song) => {
        showSongSearch.value = false;
        
        try {
                await sendSongCard(song);
        } catch (error) {
                console.error('发送音乐卡片失败:', error);
                showToast('发送失败', 'error');
        }
};

// 发送音乐卡片
const sendSongCard = async (song) => {
        const message = {
                timestamp: Date.now(),
                actorId: USER_ACTOR_ID,
                contextId: actorId.value,
                type: 'privateMessage',
                content: {
                        type: 'music-card',
                        song: {
                                id: song.id,
                                name: song.name,
                                // 只存储艺术家的基本信息
                                artists: song.artists?.map(artist => ({
                                        id: artist.id,
                                        name: artist.name
                                })) || [],
                                // 只存储专辑的基本信息
                                album: {
                                        id: song.album?.id,
                                        name: song.album?.name,
                                        imageUrl: song.album?.images?.[0]?.url || null
                                },
                                duration_ms: song.duration_ms,
                                uri: song.uri,
                                // 只存储必要的外部链接
                                spotify_url: song.external_urls?.spotify || null,
                                preview_url: song.preview_url
                        },
                        message: `分享了歌曲「${song.name} - ${song.artists?.map(a => a.name).join(', ')}」`
                }
        };

        try {
                await db.events.add(message);
                await updateConversation(message);
                
                showToast('音乐卡片已发送', 'success');
                
                // AI可能会回复
                setTimeout(() => {
                        generateReply();
                }, 1000);
                
        } catch (error) {
                console.error('发送音乐卡片失败:', error);
                showToast('发送失败', 'error');
        }
};

// 拒绝一起听邀请
const declineListenTogetherInvite = async (inviteTimestamp) => {
        try {
                // 更新原始邀请消息的状态
                const inviteMessage = await db.events.where('timestamp').equals(inviteTimestamp).first();
                if (inviteMessage) {
                        await db.events.update(inviteMessage.id, {
                                'content.status': 'declined'
                        });
                }
                
                // 发送系统消息
                await listenTogetherService.sendSystemMessage(
                        actorId.value,
                        '已拒绝一起听邀请',
                        true,
                        'listen-together-decline'
                );
                
                showToast('已拒绝邀请', 'info');
                
        } catch (error) {
                console.error('拒绝一起听邀请失败:', error);
                showToast('操作失败', 'error');
        }
};

// 播放单曲
const playSingleSong = async (song) => {
        try {
                if (!spotifyService.isLoggedIn()) {
                        showToast('请先登录Spotify', 'warning');
                        return;
                }
                
                // 确保播放器可用
                await ensurePlayerAvailable();
                
                // 播放指定歌曲
                await spotifyService.playTrack(song.uri);
                showToast(`开始播放「${song.name}」`, 'success');
                
                // 发送音乐播放状态消息
                const trackInfo = {
                        name: song.name,
                        artists: song.artists ? song.artists.map(a => a.name) : ['未知艺术家'],
                        album: song.album?.name || null
                };
                await sendMusicPlayMessage(trackInfo);
                
                // 更新播放器状态
                if (chatMusicPlayer.value) {
                        setTimeout(async () => {
                                await chatMusicPlayer.value.updatePlaybackState();
                        }, 1000);
                }
                
        } catch (error) {
                console.error('播放单曲失败:', error);
                showToast('播放失败，请确保有可用的播放设备', 'error');
        }
};

// 获取艺术家名称
const getArtistNames = (artists) => {
        return artists?.map(a => a.name).join(', ') || '未知艺术家';
};

// 音乐播放监听功能
let musicTrackingInterval = null;
let lastTrackedSong = null; // 记录上一首歌

const startTrackingMusic = () => {
        // 清除现有的监听
        if (musicTrackingInterval) {
                clearInterval(musicTrackingInterval);
        }
        
        // 每5秒检查一次播放状态
        musicTrackingInterval = setInterval(async () => {
                try {
                        // 获取当前播放信息
                        const playbackState = await spotifyService.getCurrentPlayback();
                        if (playbackState && playbackState.item) {
                                const track = playbackState.item;
                                const trackInfo = {
                                        id: track.id,
                                        name: track.name,
                                        artists: track.artists.map(a => a.name),
                                        album: track.album.name
                                };
                                
                                // 检查是否换歌了
                                if (!lastTrackedSong || lastTrackedSong.id !== track.id) {
                                        // 检查是否正在一起听，只有当前角色是一起听的角色时才发送消息
                                        const currentSession = await listenTogetherService.getCurrentListenTogetherSession();
                                        if (currentSession && currentSession.isActive && currentSession.actorId === actorId.value) {
                                                // 发送音乐播放状态消息
                                                await sendMusicPlayMessage(trackInfo, lastTrackedSong);
                                        }
                                        
                                        // 记录当前歌曲
                                        lastTrackedSong = trackInfo;
                                }
                        }
                } catch (error) {
                        console.error('音乐监听失败:', error);
                }
        }, 5000);
};

const stopTrackingMusic = () => {
        if (musicTrackingInterval) {
                clearInterval(musicTrackingInterval);
                musicTrackingInterval = null;
        }
};


// 发送消息
const sendMessage = async () => {
        if (!newMessage.value.trim()) return;

        const message = {
                timestamp: Date.now(),
                actorId: USER_ACTOR_ID,
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

// 模拟AI回复函数 - 根据设置使用打字特效或随机延迟
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

                // 根据设置决定使用打字模拟还是随机延迟
                if (personalSettings.value.typingSimulation.enabled) {
                        // 使用拼音打字模拟
                        for (let i = 0; i < mockReplies.length; i++) {
                                const reply = mockReplies[i];
                                
                                // 开始打字状态（会自动隐藏思考状态）
                                isTyping.value = true;
                                
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
                                
                                // 消息间保持输入状态，只清空当前打字内容，不改变isTyping状态
                                if (i < mockReplies.length - 1) {
                                        typingMessage.value = '';
                                        // 保持isTyping为true，确保header持续显示"正在输入中"
                                        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
                                }
                        }
                } else {
                        // 使用随机延迟，不显示打字过程
                        for (let i = 0; i < mockReplies.length; i++) {
                                const reply = mockReplies[i];
                                
                                // 计算随机延迟时间
                                const delay = getRandomMessageDelay(reply.content.length);
                                await new Promise(resolve => setTimeout(resolve, delay));
                                
                                // 直接保存完整消息到数据库
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
                                
                                // 消息间添加额外的随机间隔
                                if (i < mockReplies.length - 1) {
                                        const betweenDelay = Math.random() * 1000 + 500; // 0.5-1.5秒随机间隔
                                        await new Promise(resolve => setTimeout(resolve, betweenDelay));
                                }
                        }
                }
                
        } catch (error) {
                console.error('生成回复失败:', error);
                
                // 开始打字状态显示错误消息
                isTyping.value = true;
                
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

/* 
// 真实AI回复函数 - 取消注释以恢复真实AI功能
const generateReply = async () => {
        if (isGenerating.value) return;
        
        isGenerating.value = true;
        
        try {
                // 获取最后一条用户消息
                const lastUserMessage = displayedMessages.value
                        .filter(msg => msg.actorId === USER_ACTOR_ID)
                        .pop();
                
                if (!lastUserMessage) {
                        console.warn('没有找到用户消息');
                        return;
                }

                // 获取当前上下文对应的用户人格ID
                let effectiveUserId = USER_ACTOR_ID;
                if (currentUserPersona.value && currentUserPersona.value.id) {
                        effectiveUserId = currentUserPersona.value.id;
                        console.log('使用用户人格:', currentUserPersona.value.name, '(ID:', effectiveUserId, ')');
                } else {
                        console.log('使用默认用户ID:', effectiveUserId);
                }

                // 调用AI服务生成回复
                const aiResult = await generateAIReply(
                        actorId.value, 
                        effectiveUserId, 
                        lastUserMessage.content.content
                );

                if (aiResult.success && aiResult.messages) {
                        // 处理AI返回的多条消息，为每条消息添加打字特效
                        for (let i = 0; i < aiResult.messages.length; i++) {
                                const aiMessage = aiResult.messages[i];
                                
                                // 开始打字状态
                                isTyping.value = true;
                                
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
                                
                                // 消息间保持输入状态，只清空当前打字内容
                                if (i < aiResult.messages.length - 1) {
                                        typingMessage.value = '';
                                        // 保持isTyping为true，确保header持续显示"正在输入中"
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
                        isTyping.value = true;
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
                isTyping.value = true;
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
        
        // 获取当前的打字速度配置
        const delayConfig = getTypingDelayConfig(personalSettings.value.typingSimulation.speed);
        
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
                                
                                // 使用配置的拼音步骤延迟
                                await new Promise(resolve => setTimeout(resolve, delayConfig.pinyinStepDelay));
                        }
                } else {
                        // 非中文字符直接显示
                        typingMessage.value = chars.slice(0, i + 1).join('');
                        currentTypingIndex.value = i;
                        
                        // 滚动到底部确保用户看到打字效果
                        await nextTick();
                        scrollToBottom();
                        
                        // 使用配置的字符延迟
                        await new Promise(resolve => setTimeout(resolve, delayConfig.characterDelay));
                }
                
                // 在空格和标点符号后添加额外停顿
                if (/[\s，。！？；：]/.test(char)) {
                        await new Promise(resolve => setTimeout(resolve, delayConfig.wordPauseDelay));
                }
        }
        
        // 打字完成后使用配置的句子停顿时间
        await new Promise(resolve => setTimeout(resolve, delayConfig.sentencePauseDelay));
        
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
        // 忽略系统消息，不更新会话列表
        if (message.actorId !== "system") {
                const conversation = {
                        id: actorId.value,
                        lastEventTimestamp: message.timestamp,
                        lastEventContent: message.content,
                        unreadCount: message.actorId === USER_ACTOR_ID ? 0 : 1, // 如果是用户发送则重置未读数
                        summaryState: null
                };
                await db.conversations.put(conversation);
        }
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

// 发送系统消息到聊天室
const sendSystemMessage = async (content, isVisible = true, type = 'system') => {
        try {
                const message = {
                        timestamp: Date.now(),
                        actorId: 'system',
                        contextId: actorId.value,
                        type: 'privateMessage',
                        content: {
                                type: type,
                                content: content,
                                isVisible: isVisible
                        }
                };
                
                await db.events.add(message);
                
                // 更新对话记录
                const conversation = {
                        id: actorId.value,
                        lastEventTimestamp: message.timestamp,
                        lastEventContent: message.content,
                        unreadCount: 0, // 系统消息不计入未读数
                        summaryState: null
                };
                
                await db.conversations.put(conversation);
                
                return message;
        } catch (error) {
                console.error('发送系统消息失败:', error);
                throw error;
        }
};

// 发送音乐播放状态消息（用户不可见）
const sendMusicPlayMessage = async (trackInfo, previousTrack = null, nextTrack = null) => {
        if (!trackInfo) {
                console.warn('sendMusicPlayMessage: trackInfo is undefined, skipping.');
                return;
        }
        try {
                const artistNames = Array.isArray(trackInfo.artists) ? 
                        trackInfo.artists.map(a => a.name).join(', ') :
                        (trackInfo.artists || '未知艺术家');
                
                let content = `当前播放音乐："${trackInfo.name}"，歌手"${artistNames}"`;
                
                if (trackInfo.album) {
                        content += `，专辑"${trackInfo.album}"`;
                }
                
                if (previousTrack) {
                        content += `，上一首"${previousTrack.name}"`;
                }
                
                if (nextTrack) {
                        content += `，下一首"${nextTrack.name}"`;
                }
                
                await sendSystemMessage(content, false, 'music-play');
        } catch (error) {
                console.error('发送音乐播放状态消息失败:', error);
        }
};

// 确保播放器可用
const ensurePlayerAvailable = async () => {
        try {
                // 检查是否有可用设备
                const playback = await spotifyService.getCurrentPlayback();
                
                if (!playback || !playback.device) {
                        console.log('没有可用播放设备，初始化Web播放器...');
                        await spotifyService.initializeWebPlayer();
                        return true;
                }
                
                return true;
        } catch (error) {
                console.log('检查播放设备失败，初始化Web播放器...', error);
                await spotifyService.initializeWebPlayer();
                return true;
        }
};

// 生成首字母头像（参考 MeView 的逻辑）
const getInitial = (name) => {
        if (!name) return 'U';
        return name.charAt(0).toUpperCase();
};


// 刷新个人设置
const refreshPersonalSettings = async () => {
        try {
                const settings = await getPersonalSettings();
                personalSettings.value = settings;
                // console.log('ChatRoom: Refreshed personal settings:', settings);
        } catch (error) {
                console.error('ChatRoom: Failed to refresh personal settings:', error);
        }
};


// 监听表情包面板状态变化
watch(showStickerPanel, (newVal, oldVal) => {
        if (newVal !== oldVal) {
                nextTick(() => {
                        setTimeout(scrollToBottom, 150);
                });
        }
});

/*
// 监听个人设置变化，实时更新
watch(() => personalSettings.value, async (newSettings) => {
        if (newSettings) {
                console.log('ChatRoom: Personal settings updated:', newSettings);
        }
}, { deep: true });
*/

// 初始化默认状态
onMounted(async () => {
        // 加载个人设置
        try {
                const settings = await getPersonalSettings();
                personalSettings.value = settings;
                console.log('ChatRoom: Loaded personal settings:', settings);
        } catch (error) {
                console.error('ChatRoom: Failed to load personal settings:', error);
        }
        
        // 确保有默认用户人格
        const defaultPersona = await getDefaultUserPersona();
        if (!defaultPersona) {
                // 如果没有默认人格，创建一个
                const defaultUserPersona = {
                        id: 'user_default',
                        name: 'User',
                        realName: '',
                        aliases: [],
                        gender: '',
                        birthday: '',
                        persona: '',
                        avatar: '',
                        groupIds: [],
                        isDefault: true,
                        type: 'user',
                        avatarLibrary: []
                };
                await db.actors.put(defaultUserPersona);
                console.log('ChatRoom: Created default user persona');
        }

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
        
        // 加载并应用气泡样式作为主题
        if (actor.value) {
                try {
                        const bubbleStyle = await applyActorTheme(actor.value.id, isUsingUserBubbleTheme.value);
                        currentBubbleStyle.value = bubbleStyle;
                        
                        // 应用聊天背景
                        const messagesContainerEl = document.querySelector('.messages-container');
                        if (messagesContainerEl && actor.value.chatBackground) {
                                messagesContainerEl.style.backgroundImage = `url('${actor.value.chatBackground}')`;
                                messagesContainerEl.style.backgroundSize = 'cover';
                                messagesContainerEl.style.backgroundPosition = 'center';
                                messagesContainerEl.style.backgroundRepeat = 'no-repeat';
                                messagesContainerEl.style.backgroundAttachment = 'fixed';
                        } else if (messagesContainerEl) {
                                // 清除背景图
                                messagesContainerEl.style.backgroundImage = 'none';
                        }
                } catch (error) {
                        console.error('Failed to load bubble style:', error);
                }
        }
        
        // 监听窗口大小变化
        const handleResize = () => {
                // 确保内容适应新的窗口大小
                nextTick(() => scrollToBottom());
        };
        
        // 监听页面可见性变化，当用户返回时刷新设置
        const handleVisibilityChange = () => {
                if (!document.hidden) {
                        // 页面变为可见时刷新设置
                        refreshPersonalSettings();
                }
        };
        
        window.addEventListener('resize', handleResize);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // 检查是否有进行中的一起听歌会话
        const activeSession = await listenTogetherService.getCurrentListenTogetherSession(route.params.actorId);
        if (activeSession) {
                console.log('发现进行中的一起听歌会话，开始音乐跟踪');
                startTrackingMusic();
        }
        
        // 清理事件监听器
        return () => {
                window.removeEventListener('resize', handleResize);
                document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
});

// 组件卸载时恢复原始主题
onUnmounted(() => {
        restoreOriginalTheme();
        // 停止音乐跟踪
        stopTrackingMusic();
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
        box-shadow: 0 0 6px var(--status-color, rgba(76, 175, 80, 0.6));
        animation: pulse 2s infinite;
}

@keyframes pulse {
        0% {
                box-shadow: 0 0 6px var(--status-color, rgba(76, 175, 80, 0.6));
        }
        50% {
                box-shadow: 0 0 10px var(--status-color, rgba(76, 175, 80, 0.8));
        }
        100% {
                box-shadow: 0 0 6px var(--status-color, rgba(76, 175, 80, 0.6));
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
        margin-top:  calc(-1 * var(--header-height) - 132px);

}

.messages-container {
        flex-grow: 1;
        overflow-y: auto;
        padding: 0 20px;
        /* 为header和音乐播放器预留空间 */
        padding-top: 132px;
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
        overflow: hidden;
}

.message-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
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
        background-color: var(--char-bubble-bg, var(--bg-card));
        color: var(--char-bubble-text, var(--text-primary));
        padding: 12px 16px;
        border-radius: 18px;
        word-wrap: break-word;
}

.own-message .message-bubble {
        background-color: var(--user-bubble-bg, var(--accent-primary));
        color: var(--user-bubble-text, var(--text-inverse));
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
        background-color: var(--char-bubble-bg);
        border: 1px solid var(--accent-border);
        position: relative;
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
        color: var(--accent-darker);
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
}

.function-btn:hover {
        background-color: var(--accent-primary);
        color: var(--accent-text);
        transform: scale(1.05);
}

/* 功能按钮激活状态 */
.function-btn.active {
        background-color: var(--accent-primary);
        color: var(--text-inverse);
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
        max-height: 20px;
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
        color: var(--accent-darker);
        border: 1px solid var(--accent-border);
}

.generate-btn:hover:not(:disabled) {
        background-color: var(--bg-secondary);
        transform: scale(1.05);
}

.send-btn {
        background-color: var(--accent-primary);
        color: var(--accent-text);
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

/* 图片消息样式 */
.image-message {
        display: inline-block;
        margin: 4px 0;
}

.text-image-placeholder,
.real-image {
        background-color: var(--bg-secondary);
        border: none;
        border-radius: 12px;
        text-align: center;
        width: 30vw;
        aspect-ratio: 1 / 1;    
        color: var(--text-secondary);
        object-fit: cover;
        
}
.text-image-description {
        font-size: 14px;
        line-height: 1.4;
        word-break: break-all;
        white-space: pre-wrap;
        display: flex;
        align-items: flex-start; /* 顶部对齐 */
        justify-content: center;
        height: 100%;
        width: 100%;
        text-align: center;
        overflow-y: auto;
        padding-top: 8px; /* 增加顶部内边距，防止被遮挡 */
}


.real-image:hover {
        transform: scale(1.02);
}

/* 支付消息样式 */
.payment-message {
        background: linear-gradient(135deg, var(--accent-primary), var(--accent-darker));
        color: var(--text-inverse);
        padding: 16px;
        border-radius: 16px;
        min-width: 180px;
        text-align: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.payment-header {
        display: flex;
        align-items: flex-start;
        justify-content: left;
        gap: 8px;
        margin-bottom: 8px;
}
.payment-type {
        font-weight: 600;
        font-size: 14px;
}

.payment-amount {
        font-size: 24px;
        font-weight: 700;
        margin: 8px 0;
}

.payment-product {
        font-size: 12px;
        opacity: 0.9;
        margin-bottom: 4px;
        text-align: left;
}

.payment-note {
        font-size: 12px;
        opacity: 0.8;
        font-style: italic;
        text-align: left;
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

/* 音乐消息样式 */


.invite-header{
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: var(--user-bubble-bg);
        margin-bottom: 12px;
}

.own-message .invite-header {
        color: var(--char-bubble-bg);
}
.playlist-info {
        margin-bottom: 8px;
}

.playlist-name {
        font-weight: 600;
        color: var(--char-bubble-text);
        margin-bottom: 4px;
}

.own-message .playlist-name {
        color: var(--user-bubble-text);
}

.playlist-tracks {
        font-size: 12px;
        color: var(--text-secondary);
}

.invite-message {
        color: var(--char-bubble-text);
        margin-bottom: 12px;
}

.own-message .invite-message {
        color: var(--user-bubble-text);
}

.invite-actions {
        display: flex;
        gap: 8px;
}

.accept-btn,
.decline-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
}

.accept-btn {
        background: var(--accent-primary);
        color: var(--accent-text);
}

.accept-btn:hover {
        background: var(--accent-darker);
        transform: translateY(-1px);
}

.decline-btn {
        background-color: var(--bg-secondary);
        color: var(--text-primary);
}

.invite-status {
        font-size: 14px;
        font-weight: 500;
        padding: 8px 0;
}

.invite-status.accepted {
        color: var(--accent-primary);
}

.invite-status.declined {
        color: var(--text-secondary);
}

.listen-together-accept {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        border-radius: 12px;
        font-weight: 500;
        margin: 8px 0;
}

.accept-icon {
        display: flex;
        align-items: center;
        justify-content: center;
}

.music-card {
        border-radius: 12px;
        padding: 16px;
        margin: 8px 0;
}

.music-card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        margin-bottom: 12px;
}

.song-info {
        margin-bottom: 8px;
}

.song-name {
        font-weight: 600;
        margin-bottom: 4px;
}

.song-artist {
        font-size: 14px;
        margin-bottom: 2px;
}

.song-album {
        font-size: 12px;
        color: var(--text-secondary);
}

.music-card-message {
        color: var(--text-primary);
        margin-bottom: 12px;
}

 .play-song-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        background: var(--user-bubble-bg);
        color: var(--user-bubble-text);
        border: none;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
}

/* 系统消息样式 */
.message-item.system-message {
        justify-content: center;
        align-items: center;
}

.system-message-content {
        background: var(--app-bg);
        color: white;
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        padding: 8px 16px;
        border-radius: 999px;
        font-size: 12px;
        text-align: center;
        border: 1px solid var(--app-border);
}

.system-message {
        text-align: center;
        color: var(--text-secondary);
        opacity: 0.7;
        font-size: 12px;
        margin: 8px 0;
        font-style: italic;
}

.own-message .play-song-btn {
        background: var(--char-bubble-bg);
        color: var(--char-bubble-text);
}

.play-song-btn:hover {
        transform: translateY(-1px);
}
</style>