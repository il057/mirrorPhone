<template>
        <div class="page-container" :style="chatBackgroundStyle">

                <AppHeader
                        :title="multiSelectMode ? `已选择 ${selectedMessages.size} 条消息` : (isTyping ? '正在输入中…' : (actor?.name || '聊天'))"
                        :override-back-action="multiSelectMode ? exitMultiSelectMode : goBack"
                        :title-clickable="!multiSelectMode && !!actor" :on-title-click="showStatusDetail">
                        <template #subtitle v-if="!multiSelectMode">
                                <div class="status-indicator" v-if="actor">
                                        <div class="status-dot" :style="{ 
                                                        backgroundColor: actor?.status?.color || '#4CAF50',
                                                        '--status-color': `${actor?.status?.color || '#4CAF50'}66`
                                                }">
                                        </div>
                                        <span class="status-text">{{ actor?.status?.text || '在线' }}</span>
                                </div>
                        </template>
                        <template #left v-if="multiSelectMode">
                                <div class="multi-select-actions">
                                        <button class="multi-select-btn delete-btn" @click="deleteSelectedMessages"
                                                :disabled="selectedMessages.size === 0">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                        fill="currentColor" viewBox="0 0 16 16">
                                                        <path
                                                                d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
                                                        <path
                                                                d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
                                                </svg>
                                                <span>删除</span>
                                        </button>
                                        <button class="multi-select-btn favorite-btn" @click="favoriteSelectedMessages"
                                                :disabled="selectedMessages.size === 0">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                        fill="currentColor" viewBox="0 0 16 16">
                                                        <path
                                                                d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143q.09.083.176.171a3 3 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15" />
                                                </svg>
                                                <span>收藏</span>
                                        </button>
                                        <button class="multi-select-btn forward-btn" @click="forwardSelectedMessages"
                                                :disabled="selectedMessages.size === 0">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                        fill="currentColor" viewBox="0 0 16 16">
                                                        <path
                                                                d="M1.5 1.5A.5.5 0 0 1 2 1h4.5a.5.5 0 0 1 0 1h-4v4a.5.5 0 0 1-1 0zm13 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V2h-4a.5.5 0 0 1 0-1h4.5zM2 14.5a.5.5 0 0 1-.5-.5V10a.5.5 0 0 1 1 0v4h4a.5.5 0 0 1 0 1H2zm12 0h-4a.5.5 0 0 1 0-1h4v-4a.5.5 0 0 1 1 0v4a.5.5 0 0 1-.5.5z" />
                                                </svg>
                                                <span>转发</span>
                                        </button>
                                </div>
                        </template>
                        <template #right>
                                <button v-if="multiSelectMode" class="header-action-button"
                                        @click="exitMultiSelectMode">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                fill="currentColor" viewBox="0 0 16 16">
                                                <path
                                                        d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293z" />
                                        </svg>
                                </button>
                                <button v-else class="header-action-button" @click="goToProfile">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                                stroke-width="1.5" stroke="currentColor" width="24" height="24">
                                                <path stroke-linecap="round" stroke-linejoin="round"
                                                        d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                </button>
                        </template>
                </AppHeader>

                <!-- 聊天室音乐播放器 -->
                <ChatMusicPlayer ref="chatMusicPlayer" :listen-together="listenTogetherMode.active"
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
                                <div v-for="message in displayedMessages" :key="message.id" class="message-item" :class="{ 
                                                'own-message': message.actorId === userActorId,
                                                'system-message': message.actorId === 'system' && message.content.isVisible,
                                                'multi-select-mode': multiSelectMode,
                                                'selected': selectedMessages.has(message.id || message.timestamp)
                                        }" v-show="!(message.actorId === 'system' && !message.content.isVisible)"
                                        @click="multiSelectMode ? toggleMessageSelection(message) : null">

                                        <!-- 多选模式复选框 -->
                                        <div v-if="multiSelectMode" class="message-checkbox"
                                                @click.stop="toggleMessageSelection(message)">
                                                <input type="checkbox"
                                                        :checked="selectedMessages.has(message.id || message.timestamp)"
                                                        @change="toggleMessageSelection(message)">
                                        </div>

                                        <!-- 系统消息 - 居中显示 -->
                                        <div v-if="message.actorId === 'system' && message.content.isVisible"
                                                class="system-message-content">
                                                <span>{{ message.content.content }}</span>
                                        </div>

                                        <!-- 普通消息 -->
                                        <template v-else-if="message.actorId !== 'system'">
                                                <!-- 对方头像 -->
                                                <div class="message-avatar" v-if="message.actorId !== userActorId"
                                                        @click="handleAvatarClick" @touchstart="handleAvatarTouchStart"
                                                        @touchend="handleAvatarTouchEnd">
                                                        <img v-if="getActorAvatar(actor)" :src="getActorAvatar(actor)"
                                                                :alt="actor?.name">
                                                        <span v-else class="avatar-initial">{{ actor?.name?.[0] || '#'
                                                                }}</span>
                                                </div>

                                                <!-- 用户头像 -->
                                                <div class="message-avatar" v-else>
                                                        <img v-if="currentUserPersona?.avatar"
                                                                :src="currentUserPersona.avatar"
                                                                :alt="currentUserPersona?.name || 'User'">
                                                        <span v-else class="avatar-initial">{{
                                                                getInitial(currentUserPersona?.name || 'User') }}</span>
                                                </div>
                                                <div class="message-content"
                                                        @contextmenu.prevent="handleMessageRightClick($event, message)"
                                                        @touchstart="handleMessageTouchStart($event, message)"
                                                        @touchend="handleMessageTouchEnd"
                                                        @touchmove="handleMessageTouchMove"
                                                        style="user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent;">
                                                        <!-- 文字消息 -->
                                                        <div v-if="!message.content.type || message.content.type === 'text'"
                                                                class="message-bubble">
                                                                <!-- 引用消息显示 -->
                                                                <div v-if="message.content.quotedMessage"
                                                                        class="quoted-message-in-bubble">
                                                                        <div class="quoted-message-bar"></div>
                                                                        <div class="quoted-message-info">
                                                                                <span
                                                                                        class="quoted-message-author-name">
                                                                                        {{
                                                                                        message.content.quotedMessage.actorId
                                                                                        === userActorId ? '你' :
                                                                                        (actor?.name || '对方') }}
                                                                                </span>
                                                                                <div
                                                                                        class="quoted-message-content-text">
                                                                                        {{
                                                                                        getQuotedMessageText(message.content.quotedMessage)
                                                                                        }}
                                                                                </div>
                                                                        </div>
                                                                </div>
                                                                <p>{{ message.content.content }}</p>
                                                                <div v-if="message.content.action"
                                                                        class="message-action">
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
                                                        <div v-else-if="message.content.type === 'image'"
                                                                class="image-message">
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
                                                                class="payment-message"
                                                                :class="{ 'clickable': message.actorId !== userActorId && !message.content.status }"
                                                                @click="message.actorId !== userActorId && !message.content.status ? handlePaymentClick(message) : null">
                                                                <div class="payment-header">
                                                                        <span class="payment-type">
                                                                                {{ message.content.subtype ===
                                                                                'transfer' ? '转账'
                                                                                : '代付' }}
                                                                        </span>
                                                                </div>
                                                                <div class="payment-amount">¥{{
                                                                        message.content.amount.toFixed(2) }}</div>
                                                                <div v-if="message.content.productInfo"
                                                                        class="payment-product">
                                                                        商品：{{ message.content.productInfo }}
                                                                </div>
                                                                <div v-if="message.content.message"
                                                                        class="payment-note">
                                                                        {{ message.content.message }}
                                                                </div>

                                                                <!-- 支付状态显示 -->
                                                                <div v-if="message.content.status"
                                                                        class="payment-status">
                                                                        <div v-if="message.content.status === 'accepted'"
                                                                                class="status-accepted">
                                                                                ✓ 已接受
                                                                        </div>
                                                                        <div v-else-if="message.content.status === 'rejected'"
                                                                                class="status-rejected">
                                                                                ✗ 已拒绝
                                                                        </div>
                                                                </div>

                                                                <!-- 未处理的支付消息提示 -->
                                                                <div v-else-if="message.actorId !== userActorId"
                                                                        class="payment-pending">
                                                                        点击处理
                                                                </div>
                                                        </div>

                                                        <!-- 拍一拍消息 -->
                                                        <div v-else-if="message.content.type === 'pat'"
                                                                class="pat-message message-bubble">
                                                                <p>
                                                                        {{ message.actorId === userActorId ?
                                                                        `你拍了拍${message.content.target}` :
                                                                        `${actor?.name || '对方'}拍了拍你` }}
                                                                        <span v-if="message.content.suffix"
                                                                                class="pat-suffix">，{{
                                                                                message.content.suffix }}</span>
                                                                </p>
                                                        </div>

                                                        <!-- 语音消息 -->
                                                        <VoiceBubble v-else-if="message.content.type === 'voice'"
                                                                :text="message.content.text"
                                                                :duration="message.content.duration"
                                                                :is-own-message="message.actorId === userActorId"
                                                                :auto-show-text="personalSettings.voiceMessage?.autoShowText ?? true" />

                                                        <!-- AI语音消息 -->
                                                        <VoiceMessage v-else-if="message.content.type === 'ai_voice'"
                                                                :audio-url="message.content.audioUrl"
                                                                :text="message.content.text"
                                                                :duration="message.content.duration"
                                                                :is-own-message="message.actorId === userActorId" />

                                                        <!-- 一起听邀请消息 -->
                                                        <div v-else-if="message.content.type === 'listen-together-invite'"
                                                                class="listen-together-invite message-bubble">
                                                                <div class="invite-header">
                                                                        <svg xmlns="http://www.w3.org/2000/svg"
                                                                                width="16" height="16"
                                                                                fill="currentColor"
                                                                                class="bi bi-headphones"
                                                                                viewBox="0 0 16 16">
                                                                                <path
                                                                                        d="M8 3a5 5 0 0 0-5 5v1h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a6 6 0 1 1 12 0v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1V8a5 5 0 0 0-5-5" />
                                                                        </svg>
                                                                        <span>一起听音乐</span>
                                                                </div>
                                                                <div class="playlist-info">
                                                                        <div class="playlist-name">{{
                                                                                message.content.playlist.name }}</div>
                                                                        <div class="playlist-tracks">{{
                                                                                message.content.playlist.tracks }} 首歌曲
                                                                        </div>
                                                                </div>
                                                                <div class="invite-message">{{ message.content.message
                                                                        }}</div>
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
                                                                        <svg xmlns="http://www.w3.org/2000/svg"
                                                                                width="16" height="16"
                                                                                fill="currentColor"
                                                                                class="bi bi-check-circle"
                                                                                viewBox="0 0 16 16">
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
                                                                <div v-if="message.content.isVisible"
                                                                        class="system-message-content">
                                                                        {{ message.content.content }}
                                                                </div>
                                                                <!-- 不可见的系统消息不显示 -->
                                                        </div>

                                                        <!-- 转发消息 -->
                                                        <ForwardedMessage
                                                                v-else-if="message.content.type === 'forwarded_message'"
                                                                :fromCharName="message.content.fromCharName"
                                                                :userPersonaName="message.content.userPersonaName"
                                                                :messages="message.content.messages" />

                                                        <!-- 音乐卡片消息 -->
                                                        <div v-else-if="message.content.type === 'music-card'"
                                                                class="music-card message-bubble">
                                                                <div class="music-card-header">
                                                                        <svg xmlns="http://www.w3.org/2000/svg"
                                                                                width="16" height="16"
                                                                                fill="currentColor"
                                                                                class="bi bi-music-note"
                                                                                viewBox="0 0 16 16">
                                                                                <path
                                                                                        d="M9 13c0 1.105-1.12 2-2.5 2S4 14.105 4 13s1.12-2 2.5-2 2.5.895 2.5 2" />
                                                                                <path fill-rule="evenodd"
                                                                                        d="M9 3v10H8V3z" />
                                                                                <path
                                                                                        d="M8 2.82a1 1 0 0 1 .804-.98l3-.6A1 1 0 0 1 13 2.22V4L8 5z" />
                                                                        </svg>
                                                                        <span>音乐分享</span>
                                                                </div>
                                                                <div class="song-info">
                                                                        <div class="song-name">{{
                                                                                message.content.song.name }}
                                                                        </div>
                                                                        <div class="song-artist">{{
                                                                                getArtistNames(message.content.song.artists)
                                                                                }}
                                                                        </div>
                                                                        <div class="song-album">{{
                                                                                message.content.song.album.name }}</div>
                                                                </div>
                                                                <div class="music-card-message">{{
                                                                        message.content.message }}
                                                                </div>
                                                                <button class="play-song-btn"
                                                                        @click="playSingleSong(message.content.song)">
                                                                        <svg xmlns="http://www.w3.org/2000/svg"
                                                                                width="16" height="16"
                                                                                fill="currentColor"
                                                                                class="bi bi-play-circle"
                                                                                viewBox="0 0 16 16">
                                                                                <path
                                                                                        d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                                                                                <path
                                                                                        d="M6.271 5.055a.5.5 0 0 1 .52.038L11 7.055a.5.5 0 0 1 0 .89L6.791 9.907a.5.5 0 0 1-.791-.389V5.482a.5.5 0 0 1 .271-.427" />
                                                                        </svg>
                                                                        播放
                                                                </button>
                                                        </div>

                                                        <!-- 通话消息 -->
                                                        <div v-else-if="message.content.type === 'call'"
                                                                class="call-message message-bubble">
                                                                <div class="call-header">
                                                                        <svg xmlns="http://www.w3.org/2000/svg"
                                                                                width="16" height="16"
                                                                                fill="currentColor"
                                                                                :class="message.content.callType === 'video' ? 'bi bi-camera-video' : 'bi bi-telephone'"
                                                                                viewBox="0 0 16 16">
                                                                                <path v-if="message.content.callType === 'video'"
                                                                                        d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2zm11.5 5.175 3.5 1.556V4.269l-3.5 1.556zM2 4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h7.5a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1z" />
                                                                                <path v-else
                                                                                        d="M1.885.511a1.745 1.745 0 0 1 2.61.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.68.68 0 0 0 .178.643l2.457 2.457a.68.68 0 0 0 .644.178l2.189-.547a1.75 1.75 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.6 18.6 0 0 1-7.01-4.42 18.6 18.6 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877z" />
                                                                        </svg>
                                                                        <span>{{ message.content.callType === 'video' ?
                                                                                '视频通话' : '语音通话' }}</span>
                                                                </div>
                                                                <div class="call-message-content">{{
                                                                        message.content.message }}</div>
                                                                <div class="call-actions"
                                                                        v-if="message.actorId !== userActorId">
                                                                        <button class="accept-call-btn"
                                                                                @click="handleCallAccept(message)">
                                                                                接听
                                                                        </button>
                                                                        <button class="decline-call-btn"
                                                                                @click="handleCallDecline(message)">
                                                                                拒绝
                                                                        </button>
                                                                </div>
                                                        </div>

                                                        <!-- 拍一拍消息 -->
                                                        <div v-else-if="message.content.type === 'pat'"
                                                                class="pat-message message-bubble">
                                                                <div class="pat-content">
                                                                        <span class="pat-icon">👋</span>
                                                                        <span class="pat-text">{{
                                                                                message.content.message }}</span>
                                                                </div>
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
                                                <img v-if="getActorAvatar(actor)" :src="getActorAvatar(actor)"
                                                        :alt="actor?.name">
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
                <div class="input-area" ref="inputAreaRef" :class="{ 'keyboard-visible': isKeyboardVisible }"
                        v-if="actor">
                        <!-- 引用消息显示 -->
                        <div v-if="quotedMessage" class="quoted-message-display">
                                <div class="quoted-message-content">
                                        <div class="quoted-message-header">
                                                <span class="quoted-message-author">
                                                        {{ quotedMessage.actorId === userActorId ? '你' : (actor?.name ||
                                                        '对方') }}
                                                </span>
                                                <button class="quoted-message-close" @click="quotedMessage = null">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                                fill="currentColor" viewBox="0 0 16 16">
                                                                <path
                                                                        d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293z" />
                                                        </svg>
                                                </button>
                                        </div>
                                        <div class="quoted-message-text">
                                                {{ getQuotedMessageText(quotedMessage) }}
                                        </div>
                                </div>
                        </div>

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

                <!-- 支付详情模态框 -->
                <PaymentDetailModal v-if="showPaymentDetail" :payment-data="currentPaymentData"
                        @accept="handlePaymentAccept" @reject="handlePaymentReject"
                        @close="showPaymentDetail = false" />

                <!-- 消息右键菜单 -->
                <MessageContextMenu :visible="contextMenu.visible" :x="contextMenu.x" :y="contextMenu.y"
                        :message="contextMenu.message" :is-own-message="contextMenu.message?.actorId === userActorId"
                        @hide="hideContextMenu" @quote="handleQuoteMessage" @favorite="handleFavoriteMessage"
                        @edit="handleEditMessage" @multiSelect="handleMultiSelectMessage"
                        @delete="handleDeleteMessage" />

                <!-- 转发模态框 -->
                <ForwardModal :visible="isForwardModalVisible" :messages="forwardSelectedMessagesList"
                        :currentCharName="actor?.name || ''" :currentCharId="actorId" @close="handleForwardModalClose"
                        @forward="handleForwardConfirm" />

                <!-- 状态详情模态框 -->
                <div v-if="showStatusModal" class="status-modal-overlay" @click="showStatusModal = false">
                        <div class="status-modal" @click.stop>
                                <div class="status-modal-header">
                                        <h3>{{ actor?.name }}的状态</h3>
                                        <button class="close-btn" @click="showStatusModal = false">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round"
                                                                stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                        </button>
                                </div>
                                <div class="status-modal-content">
                                        <div class="status-item" v-if="actor?.status?.text">
                                                <div class="status-icon">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"
                                                                fill=" var(--accent-primary)">
                                                                <path
                                                                        d="M220-464 64-620l156-156 156 156-156 156ZM360-80v-200q-61-5-121-14.5T120-320l20-80q84 23 168.5 31.5T480-360q87 0 171.5-8.5T820-400l20 80q-59 16-119 25.5T600-280v200H360ZM220-576l44-44-44-44-44 44 44 44Zm260-104q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35Zm0 280q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm0-360q17 0 28.5-11.5T520-800q0-17-11.5-28.5T480-840q-17 0-28.5 11.5T440-800q0 17 11.5 28.5T480-760Zm202 280-68-120 68-120h136l68 120-68 120H682Zm46-80h44l22-40-22-40h-44l-22 40 22 40Zm-508-60Zm260-180Zm270 200Z" />
                                                        </svg>
                                                </div>
                                                <div class="status-info">
                                                        <div class="status-label">活动</div>
                                                        <div class="status-value">{{ actor.status.text }}</div>
                                                </div>
                                        </div>
                                        <div class="status-item" v-if="actor?.status?.mood">
                                                <div class="status-icon">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"
                                                                fill=" var(--accent-primary)">
                                                                <path
                                                                        d="M620-520q25 0 42.5-17.5T680-580q0-25-17.5-42.5T620-640q-25 0-42.5 17.5T560-580q0 25 17.5 42.5T620-520Zm-280 0q25 0 42.5-17.5T400-580q0-25-17.5-42.5T340-640q-25 0-42.5 17.5T280-580q0 25 17.5 42.5T340-520Zm140 260q68 0 123.5-38.5T684-400h-66q-22 37-58.5 58.5T480-320q-43 0-79.5-21.5T342-400h-66q25 63 80.5 101.5T480-260Zm0 180q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-400Zm0 320q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Z" />
                                                        </svg>

                                                </div>
                                                <div class="status-info">
                                                        <div class="status-label">心情</div>
                                                        <div class="status-value">{{ actor.status.mood }}</div>
                                                </div>
                                        </div>
                                        <div class="status-item" v-if="actor?.status?.location">
                                                <div class="status-icon">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"
                                                                fill=" var(--accent-primary)">
                                                                <path
                                                                        d="M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 294q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Zm0 106Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Zm0-480Z" />
                                                        </svg>

                                                </div>
                                                <div class="status-info">
                                                        <div class="status-label">位置</div>
                                                        <div class="status-value">{{ actor.status.location }}</div>
                                                </div>
                                        </div>
                                        <div class="status-item" v-if="actor?.status?.outfit">
                                                <div class="status-icon">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"
                                                                fill=" var(--accent-primary)">
                                                                <path
                                                                        d="m240-522-40 22q-14 8-30 4t-24-18L66-654q-8-14-4-30t18-24l230-132h70q9 0 14.5 5.5T400-820v20q0 33 23.5 56.5T480-720q33 0 56.5-23.5T560-800v-20q0-9 5.5-14.5T580-840h70l230 132q14 8 18 24t-4 30l-80 140q-8 14-23.5 17.5T760-501l-40-20v361q0 17-11.5 28.5T680-120H280q-17 0-28.5-11.5T240-160v-362Zm80-134v456h320v-456l124 68 42-70-172-100q-15 51-56.5 84.5T480-640q-56 0-97.5-33.5T326-758L154-658l42 70 124-68Zm160 177Z" />
                                                        </svg>
                                                </div>
                                                <div class="status-info">
                                                        <div class="status-label">穿着</div>
                                                        <div class="status-value">{{ actor.status.outfit }}</div>
                                                </div>
                                        </div>
                                        <div class="status-item" v-if="actor?.status?.innerThoughts">
                                                <div class="status-icon">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"
                                                                fill="var(--accent-primary)">
                                                                <path
                                                                        d="m440-803-83 83H240v117l-83 83 83 83v117h117l83 83 100-100 168 85-86-167 101-101-83-83v-117H523l-83-83Zm0-113 116 116h164v164l116 116-116 116 115 226q7 13 4 25.5T828-132q-8 8-20.5 11t-25.5-4L556-240 440-124 324-240H160v-164L44-520l116-116v-164h164l116-116Zm0 396Z" />
                                                        </svg>
                                                </div>
                                                <div class="status-info">
                                                        <div class="status-label">心声</div>
                                                        <div class="status-value inner-thoughts">{{
                                                                actor.status.innerThoughts }}</div>
                                                </div>
                                        </div>
                                        <div class="status-item"
                                                v-if="!actor?.status?.text && !actor?.status?.mood && !actor?.status?.location && !actor?.status?.outfit && !actor?.status?.innerThoughts">
                                                <div class="status-empty">暂无详细状态信息</div>
                                        </div>
                                </div>
                        </div>
                </div>
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
import VoiceMessage from '../components/ui/VoiceMessage.vue';
import ChatMusicPlayer from '../components/ui/ChatMusicPlayer.vue';
import PlaylistPickerModal from '../components/ui/PlaylistPickerModal.vue';
import SongSearchModal from '../components/ui/SongSearchModal.vue';
import PaymentDetailModal from '../components/ui/PaymentDetailModal.vue';
import MessageContextMenu from '../components/ui/MessageContextMenu.vue';
import ForwardModal from '../components/ui/ForwardModal.vue';
import ForwardedMessage from '../components/ui/ForwardedMessage.vue';
import { formatTimestamp, formatDuration } from '../utils/datetime.js';
import { generateAIReply } from '../services/aiChatAPIService.js';
import { getUserPersonaForGroup, getUserPersonaForUngrouped, getDefaultUserPersona } from '../services/userPersonaService.js';
import { USER_ACTOR_ID } from '../services/database.js';
import { getPersonalSettings, getTypingDelayConfig, getRandomMessageDelay, calculateVoiceDuration } from '../services/personalSettingsService.js';
import { getActorBubbleStyle, applyBubbleStyles } from '../services/bubbleStyleService.js';
import { applyActorTheme, toggleActorTheme, restoreOriginalTheme, getActorThemeChoice } from '../services/themeService.js';
import { showActionChoiceModal, showPaymentModal, showUploadChoiceModal, promptForInput, showToast, showConfirmModal } from '../services/uiService.js';
import { addToFavorites, toggleFavorite as toggleFavoriteService } from '../services/favoritesService.js';
import spotifyService from '../services/spotifyService.js';
import * as listenTogetherService from '../services/listenTogetherService.js';
import { setCurrentChatRoom, clearCurrentChatRoom, isCurrentChatRoom } from '../services/currentStateService.js';
import { generateVoiceMessage } from '../services/voiceMessageService.js';

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
const inputAreaRef = ref(null);
const inputAreaHeight = ref(0);
let resizeObserver = null;
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

// 支付详情模态框状态
const showPaymentDetail = ref(false);
const currentPaymentData = ref(null);
const currentPaymentMessageId = ref(null);

// 拍一拍相关状态
const lastAvatarClickTime = ref(0);
const avatarClickCount = ref(0);
const avatarTouchStartTime = ref(0);
const avatarTouchTimeout = ref(null);

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

const chatBackgroundStyle = computed(() => {
        if (actor.value?.chatBackground) {
                return {
                        backgroundImage: `url('${actor.value.chatBackground}')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundAttachment: 'fixed' // 核心属性：使背景固定，不随内容滚动
                };
        }
        // 如果没有背景图，返回空对象，会使用 main.css 中的默认背景色
        return {};
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
                        .and(event => {
                                // 只显示私聊消息，并且过滤掉不可见的系统消息
                                return event.type === 'privateMessage' && 
                                       !(event.content?.isVisible === false || 
                                         event.content?.type === 'system' && event.content?.isVisible === false);
                        })
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

// 点击消息区域时关闭表情面板和右键菜单
const handleContentClick = () => {
	if (showStickerPanel.value) {
		showStickerPanel.value = false;
	}
	if (contextMenu.value.visible) {
		hideContextMenu();
	}
	// 如果是多选模式且没有点击消息，退出多选模式
	if (multiSelectMode.value) {
		// 这里可以选择是否在点击空白区域时退出多选模式
		// exitMultiSelectMode();
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
                
                // 注意：不再自动生成AI回复，只有用户点击生成回复按钮时才会触发
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
                
                // 注意：不再自动生成AI回复，只有用户点击生成回复按钮时才会触发
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

// 处理支付消息点击
const handlePaymentClick = (message) => {
        currentPaymentData.value = message.content;
        currentPaymentMessageId.value = message.id;
        showPaymentDetail.value = true;
};

// 接受支付
const handlePaymentAccept = async () => {
        try {
                // 更新原始支付消息的状态
                const messageToUpdate = allMessages.value.find(msg => msg.id === currentPaymentMessageId.value);
                if (messageToUpdate) {
                        await db.events.update(messageToUpdate.id, {
                                'content.status': 'accepted'
                        });
                }
                
                // 发送用户可见的系统消息
                const systemMessage = currentPaymentData.value.subtype === 'transfer' 
                        ? '转账已接受' 
                        : '代付已接受';
                await sendSystemMessage(systemMessage, true, 'payment-accept');
                
                // 发送用户不可见的系统消息，告知AI
                const aiSystemMessage = currentPaymentData.value.subtype === 'transfer'
                        ? `用户接受了转账，金额：¥${currentPaymentData.value.amount}`
                        : `用户接受了代付，金额：¥${currentPaymentData.value.amount}，商品：${currentPaymentData.value.productInfo || '无'}`;
                await sendSystemMessage(aiSystemMessage, false, 'user-action-payment-accept');
                
                showToast(`${currentPaymentData.value.subtype === 'transfer' ? '转账' : '代付'}已接受`, 'success');
                
        } catch (error) {
                console.error('接受支付失败:', error);
                showToast('操作失败', 'error');
        }
};

// 拒绝支付
const handlePaymentReject = async () => {
        try {
                // 更新原始支付消息的状态
                const messageToUpdate = allMessages.value.find(msg => msg.id === currentPaymentMessageId.value);
                if (messageToUpdate) {
                        await db.events.update(messageToUpdate.id, {
                                'content.status': 'rejected'
                        });
                }
                
                // 发送用户可见的系统消息
                const systemMessage = currentPaymentData.value.subtype === 'transfer' 
                        ? '转账已拒绝' 
                        : '代付已拒绝';
                await sendSystemMessage(systemMessage, true, 'payment-reject');
                
                // 发送用户不可见的系统消息，告知AI
                const aiSystemMessage = currentPaymentData.value.subtype === 'transfer'
                        ? `用户拒绝了转账，金额：¥${currentPaymentData.value.amount}`
                        : `用户拒绝了代付，金额：¥${currentPaymentData.value.amount}，商品：${currentPaymentData.value.productInfo || '无'}`;
                await sendSystemMessage(aiSystemMessage, false, 'user-action-payment-reject');
                
                showToast(`${currentPaymentData.value.subtype === 'transfer' ? '转账' : '代付'}已拒绝`, 'info');
                
        } catch (error) {
                console.error('拒绝支付失败:', error);
                showToast('操作失败', 'error');
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
                await sendCallMessage(choice);
        }
};

// 发送通话消息
const sendCallMessage = async (callType) => {
        const message = {
                timestamp: Date.now(),
                actorId: USER_ACTOR_ID,
                contextId: actorId.value,
                type: 'privateMessage',
                content: {
                        type: 'call',
                        callType: callType,
                        message: `发起了${callType === 'voice' ? '语音' : '视频'}通话邀请`
                }
        };

        try {
                await db.events.add(message);
                await updateConversation(message);
                showToast(`${callType === 'voice' ? '语音' : '视频'}通话邀请已发送`, 'success');
                
                // 注意：不再自动生成AI回复，只有用户点击生成回复按钮时才会触发
        } catch (error) {
                console.error('发送通话消息失败:', error);
                showToast('发送失败', 'error');
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
                
                // 发送用户不可见的系统消息，告知AI
                const aiSystemMessage = `用户接受了一起听音乐邀请，歌单：${playlist?.name || '未知歌单'}`;
                await sendSystemMessage(aiSystemMessage, false, 'user-action-listen-together-accept');
                
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
                
                // 注意：不再自动生成AI回复，只有用户点击生成回复按钮时才会触发
                
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
                await sendSystemMessage('已拒绝一起听邀请', true, 'listen-together-decline');
                
                // 发送用户不可见的系统消息，告知AI
                const playlistName = inviteMessage?.content?.playlist?.name || '未知歌单';
                await sendSystemMessage(`用户拒绝了一起听音乐邀请，歌单：${playlistName}`, false, 'user-action-listen-together-decline');
                
                showToast('已拒绝邀请', 'info');
                
        } catch (error) {
                console.error('拒绝一起听邀请失败:', error);
                showToast('操作失败', 'error');
        }
};

// 接受通话
const handleCallAccept = async (message) => {
	try {
		const callType = message.content.callType === 'video' ? '视频通话' : '语音通话';
		
		// 发送用户可见的系统消息
		await sendSystemMessage(`已接听${callType}`, true, 'call-accept');
		
		// 发送用户不可见的系统消息，告知AI
		await sendSystemMessage(`用户接听了${callType}`, false, 'user-action-call-accept');
		
		showToast('通话功能暂未实现', 'info');
	} catch (error) {
		console.error('接听通话失败:', error);
		showToast('操作失败', 'error');
	}
};

// 拒绝通话
const handleCallDecline = async (message) => {
	try {
		const callType = message.content.callType === 'video' ? '视频通话' : '语音通话';
		
		// 发送用户可见的系统消息
		await sendSystemMessage(`已拒绝${callType}`, true, 'call-decline');
		
		// 发送用户不可见的系统消息，告知AI
		await sendSystemMessage(`用户拒绝了${callType}`, false, 'user-action-call-decline');
		
		showToast(`已拒绝${callType}`, 'info');
	} catch (error) {
		console.error('拒绝通话失败:', error);
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

        const messageContent = newMessage.value.trim();

        const message = {
                timestamp: Date.now(),
                actorId: USER_ACTOR_ID,
                contextId: actorId.value,
                type: 'privateMessage',
                content: {
                        type: 'text',
                        content: messageContent,
                        // 只使用手动引用
                        ...(quotedMessage.value && {
                                quotedMessage: {
                                        id: quotedMessage.value.id || quotedMessage.value.timestamp,
                                        timestamp: quotedMessage.value.timestamp,
                                        actorId: quotedMessage.value.actorId,
                                        content: {
                                                type: quotedMessage.value.content?.type || 'text',
                                                content: quotedMessage.value.content?.content || quotedMessage.value.content?.text || ''
                                        }
                                }
                        })
                }
        };

        try {
                // 保存消息到events表
                await db.events.add(message);
                
                // 更新conversation表
                await updateConversation(message);
                
                newMessage.value = '';
                quotedMessage.value = null; // 清除引用消息
                adjustTextareaHeight();

                // 注意：不再自动生成AI回复，只有用户点击生成回复按钮时才会触发
        } catch (error) {
                console.error('发送消息失败:', error);
        }
};

// AI回复生成函数
const generateReply = async () => {
	if (isGenerating.value) return;
	
	isGenerating.value = true;
	
	try {
		// 获取当前角色信息
		const currentActor = await db.actors.get(actorId.value);
		if (!currentActor) {
			throw new Error('角色信息不存在');
		}

		// 获取有效的用户人格ID
		const effectiveUserId = await getEffectiveUserId(currentActor);
		
		// 获取用户消息内容
		const userMessageContent = getLastUserMessageContent(effectiveUserId);
		
		// 检查最后一条用户消息是否包含引用
		const lastUserMessage = displayedMessages.value
			.filter(msg => msg.actorId === USER_ACTOR_ID || msg.actorId === effectiveUserId)
			.pop();
			
		let finalUserMessage = userMessageContent;
		if (lastUserMessage && lastUserMessage.content.quotedMessage) {
			// 构建包含引用信息的消息
			finalUserMessage = JSON.stringify({
				content: userMessageContent,
				quotedMessage: lastUserMessage.content.quotedMessage
			});
		}

		console.log('生成回复 - 用户消息:', userMessageContent, '有效用户ID:', effectiveUserId);

		// 调用AI服务生成回复
		const aiResult = await generateAIReply(
			actorId.value, 
			effectiveUserId, 
			finalUserMessage
		);

		// 验证AI回复结果
		if (!validateAIResult(aiResult)) {
			return;
		}

		if (aiResult.success && aiResult.events?.length > 0) {
			// 处理AI生成的事件
			await processAIEvents(aiResult.events);
			
			// 记录关系变化（如果有）
			if (aiResult.relationship) {
				console.log('AI回复包含关系变化:', aiResult.relationship);
			}
		} else if (aiResult.error) {
			showToast(aiResult.error, 'error');
		}
		
	} catch (error) {
		console.error('生成回复失败:', error);
		showToast(getErrorMessage(error), 'error');
	} finally {
		isGenerating.value = false;
		isTyping.value = false;
		typingMessage.value = '';
	}
};

// 验证AI回复结果
const validateAIResult = (aiResult) => {
	if (!aiResult) {
		showToast('AI回复结果为空', 'error');
		return false;
	}
	
	if (!aiResult.success) {
		const errorMsg = aiResult.error || '未知错误';
		showToast(errorMsg, 'error');
		return false;
	}
	
	if (!aiResult.events || aiResult.events.length === 0) {
		showToast('AI没有生成有效的回复', 'warning');
		return false;
	}
	
	return true;
};

// 获取有效的用户人格ID
const getEffectiveUserId = async (actor) => {
	if (actor.groupIds?.length > 0) {
		const groupPersona = await getUserPersonaForGroup(actor.groupIds[0]);
		if (groupPersona) {
			console.log('使用分组用户人格:', groupPersona.name);
			return groupPersona.id;
		}
	}
	
	const defaultPersona = await getDefaultUserPersona();
	if (defaultPersona && defaultPersona.id !== USER_ACTOR_ID) {
		console.log('使用默认用户人格:', defaultPersona.name);
		return defaultPersona.id;
	}
	
	return USER_ACTOR_ID;
};

// 获取最后一条用户消息内容
const getLastUserMessageContent = (effectiveUserId) => {
	const lastUserMessage = displayedMessages.value
		.filter(msg => msg.actorId === USER_ACTOR_ID || msg.actorId === effectiveUserId)
		.pop();
		
	return lastUserMessage ? 
		(lastUserMessage.content.content || lastUserMessage.content.text || '继续聊天') : 
		'开始对话';
};

// 处理AI生成的事件
const processAIEvents = async (events) => {
	for (let i = 0; i < events.length; i++) {
		const event = events[i];
		
		// 检查是否需要生成AI语音消息
		if (event.content.type === 'text') {
			// 检查角色是否有TTS配置
			const currentActor = await db.actors.get(actorId.value);
			if (currentActor?.ttsProfileId || currentActor?.voiceId) {
				try {
					// 生成语音消息
					const voiceResult = await generateVoiceMessage(currentActor, event.content.content);
					if (voiceResult.success) {
						// 创建AI语音消息事件
						const voiceEvent = {
							timestamp: event.timestamp + 1, // 稍微延迟显示
							actorId: event.actorId,
							contextId: event.contextId,
							type: event.type,
							content: {
								type: 'ai_voice',
								text: event.content.content,
								audioUrl: voiceResult.audioUrl,
								duration: voiceResult.duration
							}
						};
						
						// 保存语音消息
						await db.events.add(voiceEvent);
						await updateConversation(voiceEvent);
						
						console.log('AI语音消息已生成:', voiceResult);
					} else {
						console.warn('AI语音生成失败，fallback到文字消息:', voiceResult.error);
						// Fallback: 创建带有fallback标记的文字消息
						const fallbackEvent = {
							timestamp: event.timestamp + 1, // 稍微延迟显示
							actorId: event.actorId,
							contextId: event.contextId,
							type: event.type,
							content: {
								type: 'text',
								content: event.content.content,
								isTtsFallback: true, // 标记为TTS fallback
								ttsError: voiceResult.error // 记录错误信息
							}
						};
						
						// 保存fallback消息
						await db.events.add(fallbackEvent);
						await updateConversation(fallbackEvent);
						
						console.log('已保存TTS fallback消息');
					}
				} catch (voiceError) {
					console.error('AI语音生成出错，fallback到文字消息:', voiceError);
					// Fallback: 创建带有fallback标记的文字消息
					const fallbackEvent = {
						timestamp: event.timestamp + 1, // 稍微延迟显示
						actorId: event.actorId,
						contextId: event.contextId,
						type: event.type,
						content: {
							type: 'text',
							content: event.content.content,
							isTtsFallback: true, // 标记为TTS fallback
							ttsError: voiceError.message || '语音生成服务错误'
						}
					};
					
					// 保存fallback消息
					await db.events.add(fallbackEvent);
					await updateConversation(fallbackEvent);
					
					console.log('已保存TTS fallback消息');
				}
			}
		}
		
		// 只对text类型的消息使用打字特效
		if (event.content.type === 'text' && personalSettings.value.typingSimulation.enabled) {
			isTyping.value = true;
			// 重置打字状态，防止显示上一条消息的内容
			typingMessage.value = '';
			currentTypingIndex.value = 0;
			await simulatePinyinTyping(event.content.content);
		} else if (personalSettings.value.typingSimulation.enabled) {
			// 其他类型消息添加随机延迟
			const delay = Math.random() * 1000 + 500;
			await new Promise(resolve => setTimeout(resolve, delay));
		}
		
		// 保存消息到数据库
		await db.events.add(event);
		
		// 每条AI消息都单独更新会话，确保未读计数正确
		await updateConversation(event);
		
		// 消息间添加间隔，但在最后一条消息后不需要延迟
		if (i < events.length - 1) {
			// 确保打字状态已清除
			isTyping.value = false;
			typingMessage.value = '';
			
			const betweenDelay = Math.random() * 1000 + 500;
			await new Promise(resolve => setTimeout(resolve, betweenDelay));
		}
	}
	
	// 最终清除打字状态
	isTyping.value = false;
	typingMessage.value = '';
};

// 获取错误消息
const getErrorMessage = (error) => {
	if (error.message.includes('API配置')) return '请先在设置中配置AI API';
	if (error.message.includes('网络') || error.message.includes('HTTP')) return '网络连接异常，请检查网络设置';
	if (error.message.includes('JSON') || error.message.includes('解析')) return 'AI回复格式异常，请重试';
	if (error.message.includes('API密钥')) return 'API密钥无效，请检查设置';
	return '生成回复失败';
};

// 模拟拼音打字特效
const simulatePinyinTyping = async (fullMessage) => {
        // 确保打字状态初始化正确
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
        
        // 注意：不在这里清除打字状态，由调用者控制
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
const updateConversation = async (message, contextId = null) => {
	// 忽略系统消息和不可见消息，不更新会话列表
	if (message.actorId === "system" || 
	    message.content?.type === 'system' || 
	    message.content?.isVisible === false ||
	    message.type === 'system') {
		return; // 直接返回，不更新conversations表
	}
	
	// 将特殊消息内容转化为文字描述
	const textContent = convertMessageToText(message.content);
	
	// 使用传入的contextId或者消息中的contextId或者当前actorId
	const conversationId = contextId || message.contextId || actorId.value;
	
	// 计算未读数量
	let unreadCount = 0;
	if (message.actorId !== USER_ACTOR_ID) {
		// 只有非用户消息才可能增加未读数
		
		// 检查用户是否当前在该聊天室
		if (!isCurrentChatRoom(conversationId)) {
			// 用户不在当前聊天室，需要增加未读数
			// 获取现有的会话记录
			const existingConversation = await db.conversations.get(conversationId);
			unreadCount = (existingConversation?.unreadCount || 0) + 1;
		} else {
			// 用户在当前聊天室，未读数保持为0
			unreadCount = 0;
		}
	}
	
	const conversation = {
		id: conversationId,
		lastEventTimestamp: message.timestamp,
		lastEventContent: {  type: 'text', content: textContent },
		unreadCount: unreadCount,
		summaryState: null
	};
	await db.conversations.put(conversation);
};

// 将消息内容转化为文字描述
const convertMessageToText = (content) => {
	if (!content) return '';
	
	switch (content.type) {
		case 'text':
			return content.content || '';
		case 'sticker':
			return `[表情包: ${content.name || '表情'}]`;
		case 'image':
			if (content.subtype === 'text') {
				return `[图片描述: ${content.description || '图片'}]`;
			}
			return `[图片: ${content.fileName || '图片'}]`;
		case 'voice':
			return `[语音消息: ${content.text || '语音'}]`;
		case 'ai_voice':
			return `[AI语音消息: ${content.text || '语音'}]`;
		case 'payment':
			const paymentType = content.subtype === 'transfer' ? '转账' : '代付';
			const amount = content.amount || 0;
			const note = content.message || content.note || '';
			const product = content.productInfo ? ` (${content.productInfo})` : '';
			return `[${paymentType}: ¥${amount}${product} - ${note}]`;
		case 'listen-together-invite':
			const playlist = content.playlist || {};
			return `[一起听邀请: ${playlist.name || '歌单'}]`;
		case 'music-card':
			const song = content.song || {};
			const artists = song.artists ? song.artists.map(a => a.name).join('、') : '未知歌手';
			return `[音乐分享: ${song.name || '歌曲'} - ${artists}]`;
		case 'call':
			const callType = content.callType === 'voice' ? '语音' : '视频';
			return `[${callType}通话邀请]`;
		case 'pat':
			return `[拍一拍: ${content.message || '拍了拍'}]`;
		case 'forwarded_message':
			const fromCharName = content.fromCharName || '某人';
			const userPersonaName = content.userPersonaName || '用户';
			const messageCount = content.messageCount || 0;
			return `[转发消息: ${fromCharName}和${userPersonaName}的 ${messageCount} 条消息]`;
		case 'system':
			// 处理系统消息的不同类型
			if (content.systemType === 'post_created') {
				return `[发布了一条新动态]`;
			} else if (content.systemType === 'post_liked') {
				return `[点赞了一条动态]`;
			} else if (content.systemType === 'post_unliked') {
				return `[取消点赞了一条动态]`;
			} else if (content.systemType === 'post_commented') {
				return `[评论了一条动态]`;
			} else if (content.systemType === 'call_initiate') {
				return content.content || '[发起通话]';
			} else if (content.systemType === 'call_response') {
				return content.content || '[回应通话]';
			} else {
				return content.content || '[系统消息]';
			}
		default:
			return content.content || content.text || '[消息]';
	}
};

// 返回上一页
const goBack = () => {
        // 手动清除当前聊天室状态（防止路由导航时onUnmounted没有及时触发）
        clearCurrentChatRoom();
        
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

// 显示状态详情
const showStatusDetail = () => {
        if (actor.value) {
                showStatusModal.value = true;
        }
};

// 拍一拍功能
const handleAvatarClick = () => {
        const now = Date.now();
        const timeDiff = now - lastAvatarClickTime.value;
        
        // 如果两次点击间隔小于500ms，认为是双击
        if (timeDiff < 500 && avatarClickCount.value === 1) {
                handlePatUser();
        } else {
                avatarClickCount.value = 1;
        }
        
        lastAvatarClickTime.value = now;
        
        // 500ms后重置点击计数
        setTimeout(() => {
                avatarClickCount.value = 0;
        }, 500);
};

// 移动端触摸事件处理
const handleAvatarTouchStart = (event) => {
        event.preventDefault();
        avatarTouchStartTime.value = Date.now();
        
        // 清除之前的超时
        if (avatarTouchTimeout.value) {
                clearTimeout(avatarTouchTimeout.value);
        }
        
        // 设置长按检测
        avatarTouchTimeout.value = setTimeout(() => {
                // 长按500ms触发拍一拍
                handlePatUser();
        }, 500);
};

const handleAvatarTouchEnd = (event) => {
        event.preventDefault();
        
        // 清除长按检测
        if (avatarTouchTimeout.value) {
                clearTimeout(avatarTouchTimeout.value);
                avatarTouchTimeout.value = null;
        }
        
        const touchDuration = Date.now() - avatarTouchStartTime.value;
        
        // 如果是短触摸（少于500ms），按双击逻辑处理
        if (touchDuration < 500) {
                handleAvatarClick();
        }
};

// 处理拍一拍
const handlePatUser = async () => {
        try {
                const suffix = await promptForInput('拍一拍', '请输入后缀（可选）', '', true);
                if (suffix !== null) { // 用户点击了确认（包括空字符串）
                        await sendPatMessage(suffix || '');
                        // 触发屏幕震动动画
                        triggerShakeAnimation();
                }
        } catch (error) {
                if (error !== 'cancel') {
                        console.error('发送拍一拍失败:', error);
                        showToast('发送失败', 'error');
                }
        }
};

// 触发屏幕震动动画
const triggerShakeAnimation = () => {
        // 触发设备震动
        if (navigator.vibrate) {
                navigator.vibrate([50, 50, 50]);
        }
        
        // 触发屏幕震动动画
        const container = document.querySelector('.page-container');
        if (container) {
                container.classList.add('shake-animation');
                setTimeout(() => {
                        container.classList.remove('shake-animation');
                }, 600);
        }
};

// 发送拍一拍消息（系统消息）
const sendPatMessage = async (suffix) => {
        try {
                const patMessage = {
                        timestamp: Date.now(),
                        actorId: 'system',
                        contextId: actorId.value,
                        type: 'privateMessage',
                        content: {
                                type: 'system',
                                content: `你拍了拍${actor.value?.name || '对方'}${suffix ? `，${suffix}` : ''}`,
                                isVisible: true,
                                systemType: 'pat'
                        }
                };

                await db.events.add(patMessage);
                await updateConversation(patMessage);
                
                showToast(`你拍了拍${actor.value?.name || '对方'}${suffix ? `，${suffix}` : ''}`, 'success');
        } catch (error) {
                console.error('发送拍一拍消息失败:', error);
                showToast('发送失败', 'error');
        }
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

// 获取角色头像（优先使用currentAvatar，然后是avatar）
const getActorAvatar = (actor) => {
	if (!actor) return null;
	// 优先使用currentAvatar（自定义头像）
	if (actor.currentAvatar) {
		return actor.currentAvatar;
	}
	// 其次使用默认avatar
	if (actor.avatar) {
		return actor.avatar;
	}
	return null;
};

// 获取引用消息的文本内容
const getQuotedMessageText = (message) => {
	if (!message || !message.content) return '';
	
	const content = message.content;
	switch (content.type) {
		case 'text':
			return content.content || '';
		case 'sticker':
			return `[表情包: ${content.name || '表情'}]`;
		case 'image':
			if (content.subtype === 'text') {
				return `[图片描述: ${content.description || '图片'}]`;
			}
			return `[图片: ${content.fileName || '图片'}]`;
		case 'voice':
			return `[语音消息: ${content.text || '语音'}]`;
		case 'payment':
			const paymentType = content.subtype === 'transfer' ? '转账' : '代付';
			return `[${paymentType}: ¥${content.amount || 0}]`;
		case 'music-card':
			const song = content.song || {};
			return `[音乐分享: ${song.name || '歌曲'}]`;
		case 'call':
			const callType = content.callType === 'voice' ? '语音' : '视频';
			return `[${callType}通话邀请]`;
		case 'pat':
			return `[拍一拍: ${content.message || '拍了拍'}]`;
		case 'system':
			return content.content || '[系统消息]';
		default:
			return content.content || content.text || '[消息]';
	}
};

// 获取消息文本内容（用于收藏）
const getMessageText = (content) => {
	if (!content) return '';
	
	switch (content.type) {
		case 'text':
			return content.content || '';
		case 'sticker':
			return `[表情包: ${content.name || '表情'}]`;
		case 'image':
			if (content.subtype === 'text') {
				return `[图片描述: ${content.description || '图片'}]`;
			}
			return `[图片: ${content.fileName || '图片'}]`;
		case 'voice':
			return `[语音消息: ${content.text || '语音'}]`;
		case 'ai_voice':
			return `[AI语音消息: ${content.text || '语音'}]`;
		case 'payment':
			const paymentType = content.subtype === 'transfer' ? '转账' : '代付';
			const amount = content.amount || 0;
			const note = content.message || content.note || '';
			const product = content.productInfo ? ` (${content.productInfo})` : '';
			return `[${paymentType}: ¥${amount}${product} - ${note}]`;
		case 'listen-together-invite':
			const playlist = content.playlist || {};
			return `[一起听邀请: ${playlist.name || '歌单'}]`;
		case 'music-card':
			const song = content.song || {};
			const artists = song.artists ? song.artists.map(a => a.name).join('、') : '未知歌手';
			return `[音乐分享: ${song.name || '歌曲'} - ${artists}]`;
		case 'call':
			const callType = content.callType === 'voice' ? '语音' : '视频';
			return `[${callType}通话邀请]`;
		case 'pat':
			return `[拍一拍: ${content.message || '拍了拍'}]`;
		default:
			return content.content || content.text || '[消息]';
	}
};

// 获取作者名称
const getAuthorName = async (message) => {
	if (message.actorId === USER_ACTOR_ID) {
		return currentUserPersona.value?.name || 'User';
	} else if (message.actorId === 'system') {
		return '系统';
	} else {
		try {
			const author = await db.actors.get(message.actorId);
			return author?.name || message.actorId;
		} catch (e) {
			return message.actorId;
		}
	}
};

// 右键菜单相关状态
const contextMenu = ref({
	visible: false,
	x: 0,
	y: 0,
	message: null
});

// 长按相关状态
const longPressTimer = ref(null);
const longPressStartTime = ref(0);
const isLongPressing = ref(false);
const longPressActive = ref(false); // 标记长按是否已激活

// 多选模式相关状态
const multiSelectMode = ref(false);
const selectedMessages = ref(new Set());

// 转发相关状态
const isForwardModalVisible = ref(false);
const forwardSelectedMessagesList = computed(() => {
        return displayedMessages.value.filter(msg => 
                selectedMessages.value.has(msg.id || msg.timestamp)
        );
});

// 引用消息相关状态
const quotedMessage = ref(null);

// 状态详情模态框
const showStatusModal = ref(false);



// 右键菜单处理函数
const showContextMenu = (event, message) => {
	event.preventDefault();
	event.stopPropagation();
	
	contextMenu.value = {
		visible: true,
		x: event.clientX || event.touches?.[0]?.clientX || 0,
		y: event.clientY || event.touches?.[0]?.clientY || 0,
		message: message
	};
};

const hideContextMenu = () => {
	contextMenu.value.visible = false;
	contextMenu.value.message = null;
};

// 消息右键处理（PC端）
const handleMessageRightClick = (event, message) => {
	showContextMenu(event, message);
};

// 消息长按处理（移动端）
const handleMessageTouchStart = (event, message) => {
	// 如果是多选模式，直接处理选择逻辑
	if (multiSelectMode.value) {
		toggleMessageSelection(message);
		return;
	}
	
	longPressStartTime.value = Date.now();
	isLongPressing.value = false;
	longPressActive.value = false;
	
	longPressTimer.value = setTimeout(() => {
		if (!isLongPressing.value && !longPressActive.value) {
			isLongPressing.value = true;
			longPressActive.value = true;
			showContextMenu(event, message);
			// 触发震动反馈（如果支持）
			if (navigator.vibrate) {
				navigator.vibrate(50);
			}
		}
	}, 500); // 500ms长按触发
};

const handleMessageTouchEnd = (event) => {
	if (longPressTimer.value) {
		clearTimeout(longPressTimer.value);
		longPressTimer.value = null;
	}
	
	// 如果长按已激活，不要立即重置状态
	if (longPressActive.value) {
		// 延迟重置状态，给菜单显示留出时间
		setTimeout(() => {
			isLongPressing.value = false;
			longPressActive.value = false;
		}, 100);
		
		event.preventDefault();
		event.stopPropagation();
		return;
	}
	
	isLongPressing.value = false;
	longPressActive.value = false;
};

const handleMessageTouchMove = (event) => {
	// 触摸移动超过10px时取消长按
	const touch = event.touches[0];
	const startTouch = event.target.getBoundingClientRect();
	const moveDistance = Math.sqrt(
		Math.pow(touch.clientX - startTouch.left, 2) + 
		Math.pow(touch.clientY - startTouch.top, 2)
	);
	
	if (moveDistance > 10) {
		if (longPressTimer.value) {
			clearTimeout(longPressTimer.value);
			longPressTimer.value = null;
		}
		isLongPressing.value = false;
		longPressActive.value = false;
	}
};

// 菜单操作处理
const handleQuoteMessage = (message) => {
	quotedMessage.value = message;
	// 聚焦到输入框
	if (messageInput.value) {
		messageInput.value.focus();
	}
	hideContextMenu();
	showToast('已引用消息', 'success');
};

const handleFavoriteMessage = async (message) => {
	try {
		const favoriteParams = {
			eventId: message.id || message.timestamp,
			eventType: 'message',
			authorId: message.actorId,
			authorName: await getAuthorName(message),
			content: {
				text: getMessageText(message.content),
				type: message.content?.type || 'text',
				timestamp: message.timestamp
			}
		};

		const newFavoriteStatus = await toggleFavoriteService(favoriteParams);
		showToast(newFavoriteStatus ? '已收藏' : '已取消收藏', 'success');
	} catch (error) {
		console.error('收藏失败:', error);
		showToast('收藏失败', 'error');
	}
};

const handleEditMessage = async (message) => {
	try {
		// 只支持编辑text类型的消息
		if (!message.content || message.content.type !== 'text') {
			showToast('只能编辑文本消息', 'warning');
			return;
		}
		
		const newContent = await promptForInput(
			'编辑消息',
			'请输入新的消息内容',
			true, // isTextarea
			false, // isOptional
			message.content.content // initialValue
		);
		
		if (newContent && newContent !== message.content.content) {
			await db.events.update(message.id, {
				'content.content': newContent
			});
			showToast('消息已更新', 'success');
		}
	} catch (error) {
		if (error !== 'cancel') {
			console.error('编辑消息失败:', error);
			showToast('编辑失败', 'error');
		}
	}
};

const handleMultiSelectMessage = (message) => {
	// 进入多选模式
	multiSelectMode.value = true;
	selectedMessages.value.clear();
	selectedMessages.value.add(message.id || message.timestamp);
	hideContextMenu();
};

const handleDeleteMessage = async (message) => {
	try {
		const confirmed = await showConfirmModal(
			'确认删除',
			'确定要删除这条消息吗？此操作无法撤销。'
		);
		
		if (confirmed) {
			await db.events.delete(message.id);
			showToast('消息已删除', 'success');
		}
	} catch (error) {
		console.error('删除消息失败:', error);
		showToast('删除失败', 'error');
	}
};

// 多选模式相关函数
const toggleMessageSelection = (message) => {
	const messageKey = message.id || message.timestamp;
	if (selectedMessages.value.has(messageKey)) {
		selectedMessages.value.delete(messageKey);
	} else {
		selectedMessages.value.add(messageKey);
	}
};

const exitMultiSelectMode = () => {
	multiSelectMode.value = false;
	selectedMessages.value.clear();
};

const deleteSelectedMessages = async () => {
	try {
		const count = selectedMessages.value.size;
		if (count === 0) {
			showToast('请先选择要删除的消息', 'warning');
			return;
		}
		
		const confirmed = await showConfirmModal(
			'批量删除',
			`确定要删除选中的 ${count} 条消息吗？此操作无法撤销。`
		);
		
		if (confirmed) {
			const messageIds = Array.from(selectedMessages.value);
			let successCount = 0;
			let failCount = 0;
			
			for (const id of messageIds) {
				try {
					await db.events.delete(id);
					successCount++;
				} catch (error) {
					console.error(`删除消息 ${id} 失败:`, error);
					failCount++;
				}
			}
			
			if (successCount > 0) {
				showToast(`已删除 ${successCount} 条消息${failCount > 0 ? `，${failCount} 条删除失败` : ''}`, successCount === count ? 'success' : 'warning');
			} else {
				showToast('删除失败', 'error');
			}
			
			exitMultiSelectMode();
		}
	} catch (error) {
		console.error('批量删除失败:', error);
		showToast('批量删除失败', 'error');
	}
};

const favoriteSelectedMessages = async () => {
	try {
		const count = selectedMessages.value.size;
		if (count === 0) {
			showToast('请先选择要收藏的消息', 'warning');
			return;
		}
		
		const messageIds = Array.from(selectedMessages.value);
		const messages = [];
		
		// 收集所有选中的消息
		for (const messageId of messageIds) {
			const message = displayedMessages.value.find(msg => msg.id === messageId || msg.timestamp === messageId);
			if (message) {
				messages.push(message);
			}
		}
		
		if (messages.length === 0) {
			showToast('未找到选中的消息', 'error');
			return;
		}
		
		// 按时间排序
		messages.sort((a, b) => a.timestamp - b.timestamp);
		
		// 获取角色名称用于显示
		const characterName = actor.value?.name || '角色';
		
		// 简化批量收藏数据结构，支持手风琴展示
		const messageDetails = [];
		for (const msg of messages) {
			const authorName = await getAuthorName(msg);
			const text = getMessageText(msg.content);
			messageDetails.push({
				author: authorName,
				content: text,
				timestamp: msg.timestamp
			});
		}
		
		// 创建批量收藏记录
		const batchFavoriteParams = {
			eventId: `batch_${Date.now()}`, // 使用唯一ID
			eventType: 'message_batch',
			authorId: actorId.value, // 使用角色ID而不是'batch'
			authorName: characterName, // 使用角色名称
			content: {
				text: `批量收藏了 ${messages.length} 条消息`,
				type: 'batch',
				messageCount: messages.length,
				messages: messageDetails, // 详细消息列表，用于手风琴展示
				firstMessageTime: messages[0]?.timestamp,
				lastMessageTime: messages[messages.length - 1]?.timestamp
			},
			// 使用最后一条消息的时间作为收藏时间
			timestamp: messages[messages.length - 1]?.timestamp || Date.now()
		};

		await toggleFavoriteService(batchFavoriteParams);
		showToast(`已批量收藏 ${messages.length} 条消息`, 'success');
		
		exitMultiSelectMode();
	} catch (error) {
		console.error('批量收藏失败:', error);
		showToast('批量收藏失败', 'error');
	}
};

const forwardSelectedMessages = () => {
        if (selectedMessages.value.size === 0) {
                showToast('请先选择要转发的消息', 'warning');
                return;
        }
        
        // 显示转发模态框
        isForwardModalVisible.value = true;
};

// 处理转发模态框关闭
const handleForwardModalClose = () => {
        isForwardModalVisible.value = false;
};

// 处理转发确认
const handleForwardConfirm = async (forwardData) => {
        try {
                // 构建转发消息的内容
                const selectedMessagesList = forwardSelectedMessagesList.value;
                const messagesForForward = selectedMessagesList.map(msg => ({
                        author: getAuthorName(msg),
                        content: getMessageContent(msg),
                        timestamp: msg.timestamp
                }));
                
                // 发送转发消息
                await sendForwardedMessage(forwardData.targetCharacter, messagesForForward, forwardData.currentCharName, forwardData.userPersonaName);
                
                // 成功后关闭模态框并退出多选模式
                isForwardModalVisible.value = false;
                exitMultiSelectMode();
                
                showToast(`已转发 ${selectedMessagesList.length} 条消息给 ${forwardData.targetCharacter.name}`, 'success');
                
        } catch (error) {
                console.error('转发消息失败:', error);
                showToast('转发消息失败', 'error');
        }
};

// 发送转发消息
const sendForwardedMessage = async (targetCharacter, messages, fromCharName, userPersonaName) => {
        // 导航到目标角色的聊天页面
        router.push(`/chat/${targetCharacter.id}`);
        
        // 等待页面切换完成
        await nextTick();
        
        // 构建转发消息
        const forwardMessage = {
                timestamp: Date.now(),
                actorId: USER_ACTOR_ID,
                contextId: targetCharacter.id,
                type: 'privateMessage',
                content: {
                        type: 'forwarded_message',
                        fromCharName: fromCharName,
                        fromCharId: actorId.value,
                        userPersonaName: userPersonaName,
                        messages: messages,
                        messageCount: messages.length
                }
        };
        
        // 保存转发消息到目标对话
        await db.events.add(forwardMessage);
        
        // 更新目标对话
        await updateConversation(forwardMessage, targetCharacter.id);
};

// 获取消息内容的辅助函数
const getMessageContent = (message) => {
        if (message.content?.type === 'text') {
                return message.content.content || message.content.text || '[消息]';
        } else if (message.content?.type === 'voice' || message.content?.type === 'voice_message') {
                return `[语音消息: ${message.content.text || '语音'}]`;
        } else if (message.content?.type === 'ai_voice') {
                return `[AI语音消息: ${message.content.text || '语音'}]`;
        } else if (message.content?.type === 'sticker') {
                return `[表情包: ${message.content.name || '表情'}]`;
        } else if (message.content?.type === 'image') {
                return message.content.subtype === 'text' ? 
                        `[文字图片: ${message.content.description}]` : 
                        '[图片]';
        } else if (message.content?.type === 'payment') {
                const paymentType = message.content.subtype === 'transfer' ? '转账' : '代付';
                return `[${paymentType}: ¥${message.content.amount || 0}]`;
        } else if (message.content?.type === 'music-card') {
                const song = message.content.song || {};
                return `[音乐分享: ${song.name || '歌曲'}]`;
        } else if (message.content?.type === 'call') {
                const callType = message.content.callType === 'voice' ? '语音' : '视频';
                return `[${callType}通话邀请]`;
        } else if (message.content?.type === 'pat') {
                return `[拍一拍: ${message.content.message || '拍了拍'}]`;
        } else if (message.content?.type === 'system') {
                return message.content.content || '[系统消息]';
        } else {
                return message.content?.content || message.content?.text || '[消息]';
        }
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
	// 设置当前聊天室状态
	setCurrentChatRoom(actorId.value);
	console.log('进入聊天室:', actorId.value);
	
	// 清除未读消息数（进入聊天室时立即清除）
	try {
		await clearUnreadMessages();
	} catch (error) {
		console.error('清除未读消息失败:', error);
	}
	
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
	
		} catch (error) {
			console.error('Failed to load bubble style:', error);
		}
	}
        if (inputAreaRef.value) {
                resizeObserver = new ResizeObserver(entries => {
                        for (let entry of entries) {
                                // 读取 input-area 的实际高度，并赋值给 inputAreaHeight
                                // 这样 padding-bottom 就会自动更新
                                inputAreaHeight.value = entry.contentRect.height;
                        }
                });
                resizeObserver.observe(inputAreaRef.value);
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

// 清除未读消息数
const clearUnreadMessages = async () => {
	try {
		const conversation = await db.conversations.get(actorId.value);
		if (conversation && conversation.unreadCount > 0) {
			await db.conversations.update(actorId.value, {
				unreadCount: 0
			});
			console.log('已清除未读消息数:', conversation.unreadCount);
		}
	} catch (error) {
		console.error('清除未读消息失败:', error);
	}
};

// 组件卸载时恢复原始主题
onUnmounted(() => {
        if (resizeObserver && inputAreaRef.value) {
                resizeObserver.unobserve(inputAreaRef.value);
        }
        // 清除当前聊天室状态
        clearCurrentChatRoom();
        console.log('离开聊天室:', actorId.value);
        
        restoreOriginalTheme();
        // 停止音乐跟踪
        stopTrackingMusic();
});
</script>

<style scoped>

.page-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
}

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
        padding-top: 0;
        margin-bottom: -120px;
}

.messages-container {
        flex-grow: 1;
        overflow-y: auto;
        padding: 0 20px;
        /* 为header和音乐播放器预留空间 */
        display: flex;
        flex-direction: column;
        gap: 15px;
        transition: padding-bottom 0.3s ease;
        background-color: transparent;
        padding-top: calc(10px + var(--header-height));
        padding-bottom: 120px;
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
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        -webkit-touch-callout: none;
        -webkit-tap-highlight-color: transparent;
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
        background-color: var(--footer-bg);
        /* 使用 Footer 的半透明背景色 */
        backdrop-filter: blur(15px);
        -webkit-backdrop-filter: blur(15px);
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        border-top: 1px solid var(--border-color);
        padding-top: 5px;
        padding-bottom: max(var(--safe-bottom), 15px);
        padding-left: 15px;
        padding-right: 15px;
        z-index: 100;
        max-height: 100px;
}

.message-input {
        background-color: rgba(var(--bg-card-rgb), 0.5);
        /* 使用卡片背景色，并增加透明度 */
        color: var(--text-primary);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.message-input::placeholder {
        color: var(--accent-text);
        /* 确保占位符颜色有足够对比度 */
}

.function-btn {
        background-color: rgba(var(--bg-card-rgb), 0.3);
}

.function-btn:hover {
        background-color: rgba(var(--bg-card-rgb), 0.5);
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
        transition: all 0.2s;
}

.payment-message.clickable {
        cursor: pointer;
}

.payment-message.clickable:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
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

.payment-status {
        margin-top: 12px;
        padding-top: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.status-accepted {
        color: #4CAF50;
        font-weight: 600;
        font-size: 12px;
}

.status-rejected {
        color: #FF5722;
        font-weight: 600;
        font-size: 12px;
}

.payment-pending {
        margin-top: 12px;
        padding-top: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
        font-size: 12px;
        opacity: 0.8;
        font-style: italic;
}

/* 拍一拍消息样式 */
.pat-message {
        background: linear-gradient(135deg, #FFE082, #FFAB91) !important;
        color: #5D4037 !important;
        font-style: italic;
        text-align: center;
        border-radius: 20px !important;
        padding: 12px 16px !important;
        margin: 8px 0 !important;
        box-shadow: 0 2px 8px rgba(255, 171, 145, 0.3);
        animation: patBounce 0.6s ease-out;
}

.pat-suffix {
        color: #FF7043;
        font-weight: 600;
}

@keyframes patBounce {
        0% { transform: scale(0.8); opacity: 0; }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); opacity: 1; }
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
        color: var(--accent-primary);
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

/* 通话消息样式 */
.call-message {
	background: linear-gradient(135deg, var(--accent-primary), var(--accent-darker));
	color: var(--text-inverse);
	padding: 16px;
	border-radius: 16px;
	min-width: 200px;
	text-align: center;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 拍一拍消息样式 */
.pat-message {
	background: linear-gradient(135deg, #FFE4B5, #FFD700);
	color: #8B4513;
	padding: 12px 16px;
	border-radius: 16px;
	text-align: center;
	box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
	animation: pat-shake 0.5s ease-in-out;
}

.pat-content {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
}

.pat-icon {
	font-size: 18px;
	animation: pat-wave 0.6s ease-in-out;
}

.pat-text {
	font-weight: 500;
	font-size: 14px;
}

@keyframes pat-shake {
	0%, 100% { transform: translateX(0); }
	10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
	20%, 40%, 60%, 80% { transform: translateX(2px); }
}

@keyframes pat-wave {
	0%, 100% { transform: rotate(0deg); }
	25% { transform: rotate(-10deg); }
	75% { transform: rotate(10deg); }
}

.call-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-bottom: 8px;
        font-weight: 600;
        font-size: 14px;
}

.call-message-content {
        margin-bottom: 12px;
        font-size: 14px;
        opacity: 0.9;
}

.call-actions {
        display: flex;
        gap: 8px;
        justify-content: center;
}

.accept-call-btn,
.decline-call-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
}

.accept-call-btn {
        background-color: rgba(76, 175, 80, 0.9);
        color: white;
}

.accept-call-btn:hover {
        background-color: rgba(76, 175, 80, 1);
        transform: scale(1.05);
}

.decline-call-btn {
        background-color: rgba(244, 67, 54, 0.9);
        color: white;
}

.decline-call-btn:hover {
        background-color: rgba(244, 67, 54, 1);
        transform: scale(1.05);
}

/* 多选模式样式 */
.message-item.multi-select-mode {
	padding-left: 50px;
	position: relative;
}

.message-item.selected {
	background-color: var(--accent-bg, rgba(var(--accent-primary-rgb, 59, 130, 246), 0.1));
	border-radius: 8px;
	margin: 2px 0;
}

.message-checkbox {
	position: absolute;
	left: 10px;
	top: 50%;
	transform: translateY(-50%);
	z-index: 10;
}

.message-checkbox input[type="checkbox"] {
	width: 18px;
	height: 18px;
	accent-color: var(--accent-primary);
	cursor: pointer;
}

.header-action-button:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

/* 震动动画 */
@keyframes shake {
	0%, 100% { transform: translateX(0); }
	10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
	20%, 40%, 60%, 80% { transform: translateX(3px); }
}

.shake-animation {
	animation: shake 0.6s ease-in-out;
}

/* 多选操作按钮样式 */
.multi-select-actions {
	display: flex;
	gap: 8px;
	align-items: center;
}

.multi-select-btn {
	display: flex;
	align-items: center;
	gap: 4px;
	padding: 6px 12px;
	border: none;
	border-radius: 16px;
	font-size: 12px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
	min-width: 60px;
	justify-content: center;
}

.multi-select-btn:disabled {
	opacity: 0.4;
	cursor: not-allowed;
}

.multi-select-btn svg {
	width: 14px;
	height: 14px;
}

.multi-select-btn span {
	font-size: 11px;
}

.delete-btn {
	background-color: rgba(255, 59, 48, 0.1);
	color: #ff3b30;
}

.delete-btn:hover:not(:disabled) {
	background-color: rgba(255, 59, 48, 0.2);
}

.favorite-btn {
	background-color: rgba(255, 149, 0, 0.1);
	color: #ff9500;
}

.favorite-btn:hover:not(:disabled) {
	background-color: rgba(255, 149, 0, 0.2);
}

.forward-btn {
	background-color: rgba(0, 122, 255, 0.1);
	color: #007aff;
}

.forward-btn:hover:not(:disabled) {
	background-color: rgba(0, 122, 255, 0.2);
}

/* 引用消息样式 */
.quoted-message-display {
	background-color: var(--bg-secondary);
	border-top: 1px solid var(--border-color);
	padding: 12px 15px 8px;
	margin: 0 -15px 0 -15px;
}

.quoted-message-content {
	background-color: var(--bg-card);
	border-left: 3px solid var(--accent-primary);
	border-radius: 6px;
	padding: 8px 12px;
	position: relative;
}

.quoted-message-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 4px;
}

.quoted-message-author {
	font-size: 12px;
	font-weight: 600;
	color: var(--accent-primary);
}

.quoted-message-close {
	background: none;
	border: none;
	color: var(--text-secondary);
	cursor: pointer;
	padding: 2px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.quoted-message-close:hover {
	color: var(--text-primary);
	background-color: var(--bg-secondary);
}

.quoted-message-text {
	font-size: 13px;
	color: var(--text-secondary);
	line-height: 1.3;
	max-height: 40px;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	-webkit-box-orient: vertical;
}

/* 消息气泡内的引用样式 */
.quoted-message-in-bubble {
	display: flex;
	gap: 8px;
	margin-bottom: 8px;
	padding: 8px;
	background-color: rgba(var(--bg-secondary-rgb, 128, 128, 128), 0.3);
	border-radius: 6px;
}

.quoted-message-bar {
	width: 3px;
	background-color: var(--accent-primary);
	border-radius: 1px;
	flex-shrink: 0;
}

.quoted-message-info {
	flex: 1;
	min-width: 0;
}

.quoted-message-author-name {
	font-size: 11px;
	font-weight: 600;
	color: var(--accent-primary);
	display: block;
	margin-bottom: 2px;
}

.quoted-message-content-text {
	font-size: 12px;
	color: var(--text-secondary);
	line-height: 1.2;
	max-height: 32px;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	-webkit-box-orient: vertical;
}

/* 状态详情模态框样式 */
.status-modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.6);
	backdrop-filter: blur(4px);
	-webkit-backdrop-filter: blur(4px);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	padding: 20px;
}

.status-modal {
	background: var(--bg-card);
	border-radius: 16px;
	width: 100%;
	max-width: 400px;
	max-height: 80vh;
	overflow: hidden;
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
	border: 1px solid var(--border-color);
}

.status-modal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 20px 24px 16px;
	border-bottom: 1px solid var(--border-color);
}

.status-modal-header h3 {
	margin: 0;
	font-size: 18px;
	font-weight: 600;
	color: var(--text-primary);
}

.close-btn {
	background: none;
	border: none;
	color: var(--text-secondary);
	cursor: pointer;
	padding: 4px;
	border-radius: 50%;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;
}

.close-btn:hover {
	background-color: var(--bg-secondary);
	color: var(--text-primary);
}

.status-modal-content {
	padding: 24px;
}

.status-item {
	display: flex;
	align-items: flex-start;
	gap: 12px;
	padding: 12px 0;
}

.status-item:not(:last-child) {
	border-bottom: 1px solid var(--border-light);
}

.status-icon {
	font-size: 24px;
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 8px;
	flex-shrink: 0;
}

.status-info {
	flex: 1;
	min-width: 0;
}

.status-label {
	font-size: 12px;
	color: var(--text-secondary);
	margin-bottom: 4px;
	text-transform: uppercase;
	letter-spacing: 0.5px;
}

.status-value {
	font-size: 16px;
	color: var(--text-primary);
	font-weight: 500;
	word-wrap: break-word;
}

.status-value.inner-thoughts {
	font-style: italic;
	color: var(--text-secondary);
	background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
	border-left: 3px solid var(--accent-primary);
	padding: 12px 16px;
	border-radius: 0 8px 8px 0;
	margin-top: 4px;
	position: relative;
}

.status-value.inner-thoughts::before {
	content: '"';
	font-size: 24px;
	color: var(--accent-primary);
	position: absolute;
	left: 8px;
	top: -2px;
	opacity: 0.5;
}

.status-value.inner-thoughts::after {
	content: '"';
	font-size: 24px;
	color: var(--accent-primary);
	position: absolute;
	right: 8px;
	bottom: -10px;
	opacity: 0.5;
}

.status-empty {
	text-align: center;
	color: var(--text-secondary);
	font-style: italic;
	padding: 32px 16px;
}
</style>