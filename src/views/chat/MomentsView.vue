<template>
        <div class="page-container">
                <!-- 个人动态页面的头部导航 -->
                <AppHeader v-if="isPersonalFeed" :title="(displayUser?.name || 'User') + '的动态'"
                        :override-back-action="handleBack">
                </AppHeader>

                <!-- 个人动态页面需要包装在main中以提供正确的滚动容器 -->
                <main v-if="isPersonalFeed" class="personal-moments-main">
                        <!-- 头图区域 - 会跟随页面滚动 -->
                        <div class="header-image-container" :class="{ 'expanded': isHeaderExpanded }"
                                @click="toggleHeaderExpanded">
                                <div class="header-image" :style="headerImageStyle"></div>

                                <!-- 头图展开时的控制按钮 -->
                                <div v-if="isHeaderExpanded" class="header-controls">
                                        <button v-if="canChangeHeader" class="change-header-btn"
                                                @click.stop="changeHeaderImage">
                                                更换头图
                                        </button>
                                </div>
                        </div>

                        <!-- 用户头像 - 一半在头图区域，一半在动态区域 -->
                        <div class="user-avatar-section" :class="{ 'hidden': isHeaderExpanded }">
                                <div class="user-info-container">
                                        <h2 class="user-name">{{ displayUser?.name || 'User' }}</h2>
                                        <div class="user-avatar">
                                                <img v-if="avatarToShow" :src="avatarToShow"
                                                        :alt="displayUser?.name || 'User'">
                                                <span v-else class="avatar-initial">{{ getInitial(displayUser?.name ||
                                                        'User') }}</span>
                                        </div>
                                </div>
                                <p class="user-signature">{{ displayUser?.signature }}</p>
                        </div>

                        <!-- 动态列表 -->
                        <div class="moments-content" @click="collapseHeader">
                                <div v-if="moments.length === 0" class="empty-state">
                                        <p>还没有动态</p>
                                </div>

                                <div v-else class="moments-list">
                                        <div v-for="moment in moments" :key="moment.id" class="moment-item">
                                                <!-- 第一行：头像和名字 -->
                                                <div class="moment-row-1">
                                                        <div class="moment-author-info">
                                                                <div class="moment-avatar avatar">
                                                                        <img v-if="getMomentAuthorAvatar(moment.author)"
                                                                                :src="getMomentAuthorAvatar(moment.author)"
                                                                                :alt="moment.author.name">
                                                                        <span v-else class="avatar-initial">{{
                                                                                getInitial(moment.author.name) }}</span>
                                                                </div>
                                                                <h3 class="moment-author">{{ moment.author.name }}</h3>
                                                        </div>

                                                        <!-- 菜单按钮 -->
                                                        <div v-if="canEditMoment(moment)" class="moment-menu">
                                                                <button class="menu-trigger"
                                                                        @click.stop="toggleDropdown(moment.id)">
                                                                        <svg width="20" height="20" viewBox="0 0 24 24"
                                                                                fill="currentColor">
                                                                                <circle cx="12" cy="5" r="2" />
                                                                                <circle cx="12" cy="12" r="2" />
                                                                                <circle cx="12" cy="19" r="2" />
                                                                        </svg>
                                                                </button>

                                                                <DropdownMenu :isOpen="activeDropdown === moment.id"
                                                                        @close="closeDropdown">
                                                                        <li @click="openEditModal(moment)">编辑</li>
                                                                        <li @click="deleteMoment(moment)">删除</li>
                                                                </DropdownMenu>
                                                        </div>
                                                </div>

                                                <!-- 第二行：动态内容 -->
                                                <div class="moment-row-2">
                                                        <div class="moment-spacer"></div>
                                                        <div class="moment-content">
                                                                <div v-if="moment.content.text" class="moment-text">
                                                                        <span v-for="(part, index) in parseAtMentions(moment.content.text)" :key="index">
                                                                                <span v-if="part.type === 'text'">{{ part.content }}</span>
                                                                                <span v-else-if="part.type === 'mention'" 
                                                                                        class="mention" 
                                                                                        @click="handleMentionClick(part.actorName)">
                                                                                        {{ part.content }}
                                                                                </span>
                                                                        </span>
                                                                </div>

                                                                <div v-if="moment.content.images && moment.content.images.length > 0"
                                                                        class="moment-images">
                                                                        <div v-for="(image, index) in moment.content.images"
                                                                                :key="index"
                                                                                class="moment-image-container"
                                                                                @click="showOverlay(moment.id, index)">
                                                                                <img :src="image"
                                                                                        :alt="`图片 ${index + 1}`"
                                                                                        class="moment-image">

                                                                                <transition name="fade">
                                                                                        <div v-if="activeOverlay && activeOverlay.momentId === moment.id && activeOverlay.imageIndex === index"
                                                                                                class="image-description-overlay"
                                                                                                @click.stop="hideOverlay()">
                                                                                                <p>{{ getDescriptions(moment)[index]
                                                                                                        || '无描述' }}</p>
                                                                                        </div>
                                                                                </transition>
                                                                        </div>
                                                                </div>

                                                                <div v-if="moment.content.placeholders && moment.content.placeholders.length > 0"
                                                                        class="moment-placeholders">
                                                                        <div v-for="(desc, index) in moment.content.placeholders"
                                                                                :key="index" class="placeholder-item">
                                                                                <p class="placeholder-description">{{
                                                                                        desc }}
                                                                                </p>
                                                                        </div>
                                                                </div>
                                                        </div>
                                                </div>

                                                <!-- 第三行：时间和操作按钮 -->
                                                <div class="moment-row-3">
                                                        <div class="moment-spacer"></div>
                                                        <p class="moment-time">{{ formatTimestamp(moment.timestamp) }}
                                                        </p>
                                                        <div class="moment-actions">
                                                                <button class="action-btn like-btn"
                                                                        :class="{ 'liked': isLikedByUser(moment) }"
                                                                        @click="toggleLike(moment)">
                                                                        <svg width="18" height="18" viewBox="0 0 24 24"
                                                                                fill="none" stroke="currentColor"
                                                                                stroke-width="2">
                                                                                <path
                                                                                        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z">
                                                                                </path>
                                                                        </svg>
                                                                </button>
                                                                <button class="action-btn comment-btn"
                                                                        @click="toggleComment(moment)">
                                                                        <svg width="18" height="18" viewBox="0 0 24 24"
                                                                                fill="none" stroke="currentColor"
                                                                                stroke-width="2">
                                                                                <path
                                                                                        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z">
                                                                                </path>
                                                                        </svg>
                                                                </button>
                                                                <button class="action-btn favorite-btn"
                                                                        :class="{ 'favorited': moment.isFavorited }"
                                                                        @click="toggleFavorite(moment)">
                                                                        <svg v-if="!moment.isFavorited"
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                width="18" height="18"
                                                                                fill="currentColor"
                                                                                class="bi bi-bookmark-star"
                                                                                viewBox="0 0 16 16">
                                                                                <path
                                                                                        d="M7.84 4.1a.178.178 0 0 1 .32 0l.634 1.285a.18.18 0 0 0 .134.098l1.42.206c.145.021.204.2.098.303L9.42 6.993a.18.18 0 0 0-.051.158l.242 1.414a.178.178 0 0 1-.258.187l-1.27-.668a.18.18 0 0 0-.165 0l-1.27.668a.178.178 0 0 1-.257-.187l.242-1.414a.18.18 0 0 0-.05-.158l-1.03-1.001a.178.178 0 0 1 .098-.303l1.42-.206a.18.18 0 0 0 .134-.098z" />
                                                                                <path
                                                                                        d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1z" />
                                                                        </svg>
                                                                        <svg v-else xmlns="http://www.w3.org/2000/svg"
                                                                                width="18" height="18"
                                                                                fill="currentColor"
                                                                                class="bi bi-bookmark-star-fill"
                                                                                viewBox="0 0 16 16">
                                                                                <path fill-rule="evenodd"
                                                                                        d="M2 15.5V2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.74.439L8 13.069l-5.26 2.87A.5.5 0 0 1 2 15.5M8.16 4.1a.178.178 0 0 0-.32 0l-.634 1.285a.18.18 0 0 1-.134.098l-1.42.206a.178.178 0 0 0-.098.303L6.58 6.993c.042.041.061.1.051.158L6.39 8.565a.178.178 0 0 0 .258.187l1.27-.668a.18.18 0 0 1 .165 0l1.27.668a.178.178 0 0 0 .257-.187L9.368 7.15a.18.18 0 0 1 .05-.158l1.028-1.001a.178.178 0 0 0-.098-.303l-1.42-.206a.18.18 0 0 1-.134-.098z" />
                                                                        </svg>
                                                                </button>
                                                        </div>
                                                </div>

                                                <!-- 评论输入框 - 紧跟在第三行后面 -->
                                                <div v-if="moment.showCommentInput" class="comment-input-row">
                                                        <div class="moment-spacer"></div>
                                                        <div class="comment-input-section">
                                                                <input v-model="moment.commentText" type="text"
                                                                        placeholder="写评论..." class="comment-input"
                                                                        @input="handleCommentInput($event, moment)"
                                                                        @keydown="handleCommentKeydown($event, moment)"
                                                                        @keyup.enter="submitComment(moment)">
                                                                <button @click="submitComment(moment)"
                                                                        class="comment-submit-btn">发送</button>
                                                        </div>
                                                </div>

                                                <!-- 第四行及以后：互动内容 -->
                                                <div v-if="hasInteractions(moment)" class="interactions-container">
                                                        <!-- 点赞列表 -->
                                                        <div v-if="moment.likeUsers && moment.likeUsers.length > 0"
                                                                class="likes-section">
                                                                <svg class="heart-icon" width="16" height="16"
                                                                        viewBox="0 0 24 24" fill="var(--accent-primary)"
                                                                        stroke="none">
                                                                        <path
                                                                                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z">
                                                                        </path>
                                                                </svg>
                                                                <div class="like-avatars">
                                                                        <div v-for="user in moment.likeUsers"
                                                                                :key="user.id"
                                                                                class="like-avatar avatar">
                                                                                <img v-if="user.avatar"
                                                                                        :src="user.avatar"
                                                                                        :alt="user.name">
                                                                                <span v-else class="avatar-initial">{{
                                                                                        getInitial(user.name) }}</span>
                                                                        </div>
                                                                </div>
                                                        </div>

                                                        <!-- 评论列表 -->
                                                        <div v-if="moment.recentReplies && moment.recentReplies.length > 0"
                                                                class="comments-section">
                                                                <div v-for="reply in moment.recentReplies"
                                                                        :key="reply.id" class="comment-item">
                                                                        <div class="comment-avatar avatar">
                                                                                <img v-if="reply.author.avatar"
                                                                                        :src="reply.author.avatar"
                                                                                        :alt="reply.author.name">
                                                                                <span v-else class="avatar-initial">{{
                                                                                        getInitial(reply.author.name)
                                                                                        }}</span>
                                                                        </div>
                                                                        <div class="comment-content">
                                                                                <div class="comment-author">{{
                                                                                        reply.author.name
                                                                                        }}</div>
                                                                                <div class="comment-text">
                                                                                        <span v-for="(part, index) in parseAtMentions(reply.content.text)" :key="index">
                                                                                                <span v-if="part.type === 'text'">{{ part.content }}</span>
                                                                                                <span v-else-if="part.type === 'mention'" 
                                                                                                        class="mention" 
                                                                                                        @click="handleMentionClick(part.actorName)">
                                                                                                        {{ part.content }}
                                                                                                </span>
                                                                                        </span>
                                                                                </div>
                                                                        </div>
                                                                </div>
                                                        </div>
                                                </div>
                                        </div>
                                </div>
                        </div>
                </main>

                <!-- 公共动态页面保持原有结构 -->
                <template v-else>
                        <!-- 头图区域 - 会跟随页面滚动 -->
                        <div class="header-image-container" :class="{ 'expanded': isHeaderExpanded }"
                                @click="toggleHeaderExpanded">
                                <div class="header-image" :style="headerImageStyle"></div>

                                <!-- 头图展开时的控制按钮 -->
                                <div v-if="isHeaderExpanded" class="header-controls">
                                        <button v-if="canChangeHeader" class="change-header-btn"
                                                @click.stop="changeHeaderImage">
                                                更换头图
                                        </button>
                                </div>
                        </div>

                        <!-- 用户头像 - 一半在头图区域，一半在动态区域 -->
                        <div class="user-avatar-section" :class="{ 'hidden': isHeaderExpanded }">
                                <div class="user-info-container">
                                        <h2 class="user-name">{{ displayUser?.name || 'User' }}</h2>
                                        <div class="user-avatar">
                                                <img v-if="avatarToShow" :src="avatarToShow"
                                                        :alt="displayUser?.name || 'User'">
                                                <span v-else class="avatar-initial">{{ getInitial(displayUser?.name ||
                                                        'User') }}</span>
                                        </div>
                                </div>
                        </div>

                        <!-- 动态列表 -->
                        <main class="moments-content" @click="collapseHeader">
                                <div v-if="moments.length === 0" class="empty-state">
                                        <p>还没有动态</p>
                                </div>

                                <div v-else class="moments-list">
                                        <div v-for="moment in moments" :key="moment.id" class="moment-item">
                                                <!-- 第一行：头像和名字 -->
                                                <div class="moment-row-1">
                                                        <div class="moment-author-info">
                                                                <div class="moment-avatar avatar">
                                                                        <img v-if="getMomentAuthorAvatar(moment.author)"
                                                                                :src="getMomentAuthorAvatar(moment.author)"
                                                                                :alt="moment.author.name">
                                                                        <span v-else class="avatar-initial">{{
                                                                                getInitial(moment.author.name) }}</span>
                                                                </div>
                                                                <h3 class="moment-author">{{ moment.author.name }}</h3>
                                                        </div>

                                                        <!-- 菜单按钮 -->
                                                        <div v-if="canEditMoment(moment)" class="moment-menu">
                                                                <button class="menu-trigger"
                                                                        @click.stop="toggleDropdown(moment.id)">
                                                                        <svg width="20" height="20" viewBox="0 0 24 24"
                                                                                fill="currentColor">
                                                                                <circle cx="12" cy="5" r="2" />
                                                                                <circle cx="12" cy="12" r="2" />
                                                                                <circle cx="12" cy="19" r="2" />
                                                                        </svg>
                                                                </button>

                                                                <DropdownMenu :isOpen="activeDropdown === moment.id"
                                                                        @close="closeDropdown">
                                                                        <li @click="openEditModal(moment)">编辑</li>
                                                                        <li @click="deleteMoment(moment)">删除</li>
                                                                </DropdownMenu>
                                                        </div>
                                                </div>

                                                <!-- 第二行：动态内容 -->
                                                <div class="moment-row-2">
                                                        <div class="moment-spacer"></div>
                                                        <div class="moment-content">
                                                                <div v-if="moment.content.text" class="moment-text">
                                                                        <span v-for="(part, index) in parseAtMentions(moment.content.text)" :key="index">
                                                                                <span v-if="part.type === 'text'">{{ part.content }}</span>
                                                                                <span v-else-if="part.type === 'mention'" 
                                                                                        class="mention" 
                                                                                        @click="handleMentionClick(part.actorName)">
                                                                                        {{ part.content }}
                                                                                </span>
                                                                        </span>
                                                                </div>

                                                                <div v-if="moment.content.images && moment.content.images.length > 0"
                                                                        class="moment-images">
                                                                        <div v-for="(image, index) in moment.content.images"
                                                                                :key="index"
                                                                                class="moment-image-container"
                                                                                @click="showOverlay(moment.id, index)">
                                                                                <img :src="image"
                                                                                        :alt="`图片 ${index + 1}`"
                                                                                        class="moment-image">

                                                                                <transition name="fade">
                                                                                        <div v-if="activeOverlay && activeOverlay.momentId === moment.id && activeOverlay.imageIndex === index"
                                                                                                class="image-description-overlay"
                                                                                                @click.stop="hideOverlay()">
                                                                                                <p>{{ getDescriptions(moment)[index]
                                                                                                        || '无描述' }}</p>
                                                                                        </div>
                                                                                </transition>
                                                                        </div>
                                                                </div>

                                                                <div v-if="moment.content.placeholders && moment.content.placeholders.length > 0"
                                                                        class="moment-placeholders">
                                                                        <div v-for="(desc, index) in moment.content.placeholders"
                                                                                :key="index" class="placeholder-item">
                                                                                <p class="placeholder-description">{{
                                                                                        desc }}
                                                                                </p>
                                                                        </div>
                                                                </div>
                                                        </div>
                                                </div>

                                                <!-- 第三行：时间和操作按钮 -->
                                                <div class="moment-row-3">
                                                        <div class="moment-spacer"></div>
                                                        <p class="moment-time">{{ formatTimestamp(moment.timestamp) }}
                                                        </p>
                                                        <div class="moment-actions">
                                                                <button class="action-btn like-btn"
                                                                        :class="{ 'liked': isLikedByUser(moment) }"
                                                                        @click="toggleLike(moment)">
                                                                        <svg width="18" height="18" viewBox="0 0 24 24"
                                                                                fill="none" stroke="currentColor"
                                                                                stroke-width="2">
                                                                                <path
                                                                                        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z">
                                                                                </path>
                                                                        </svg>
                                                                </button>
                                                                <button class="action-btn comment-btn"
                                                                        @click="toggleComment(moment)">
                                                                        <svg width="18" height="18" viewBox="0 0 24 24"
                                                                                fill="none" stroke="currentColor"
                                                                                stroke-width="2">
                                                                                <path
                                                                                        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z">
                                                                                </path>
                                                                        </svg>
                                                                </button>
                                                                <button class="action-btn favorite-btn"
                                                                        :class="{ 'favorited': moment.isFavorited }"
                                                                        @click="toggleFavorite(moment)">
                                                                        <svg v-if="!moment.isFavorited"
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                width="18" height="18"
                                                                                fill="currentColor"
                                                                                class="bi bi-bookmark-star"
                                                                                viewBox="0 0 16 16">
                                                                                <path
                                                                                        d="M7.84 4.1a.178.178 0 0 1 .32 0l.634 1.285a.18.18 0 0 0 .134.098l1.42.206c.145.021.204.2.098.303L9.42 6.993a.18.18 0 0 0-.051.158l.242 1.414a.178.178 0 0 1-.258.187l-1.27-.668a.18.18 0 0 0-.165 0l-1.27.668a.178.178 0 0 1-.257-.187l.242-1.414a.18.18 0 0 0-.05-.158l-1.03-1.001a.178.178 0 0 1 .098-.303l1.42-.206a.18.18 0 0 0 .134-.098z" />
                                                                                <path
                                                                                        d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1z" />
                                                                        </svg>
                                                                        <svg v-else xmlns="http://www.w3.org/2000/svg"
                                                                                width="18" height="18"
                                                                                fill="currentColor"
                                                                                class="bi bi-bookmark-star-fill"
                                                                                viewBox="0 0 16 16">
                                                                                <path fill-rule="evenodd"
                                                                                        d="M2 15.5V2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.74.439L8 13.069l-5.26 2.87A.5.5 0 0 1 2 15.5M8.16 4.1a.178.178 0 0 0-.32 0l-.634 1.285a.18.18 0 0 1-.134.098l-1.42.206a.178.178 0 0 0-.098.303L6.58 6.993c.042.041.061.1.051.158L6.39 8.565a.178.178 0 0 0 .258.187l1.27-.668a.18.18 0 0 1 .165 0l1.27.668a.178.178 0 0 0 .257-.187L9.368 7.15a.18.18 0 0 1 .05-.158l1.028-1.001a.178.178 0 0 0-.098-.303l-1.42-.206a.18.18 0 0 1-.134-.098z" />
                                                                        </svg>
                                                                </button>
                                                        </div>
                                                </div>

                                                <!-- 评论输入框 - 紧跟在第三行后面 -->
                                                <div v-if="moment.showCommentInput" class="comment-input-row">
                                                        <div class="moment-spacer"></div>
                                                        <div class="comment-input-section">
                                                                <input v-model="moment.commentText" type="text"
                                                                        placeholder="写评论..." class="comment-input"
                                                                        @input="handleCommentInput($event, moment)"
                                                                        @keydown="handleCommentKeydown($event, moment)"
                                                                        @keyup.enter="submitComment(moment)">
                                                                <button @click="submitComment(moment)"
                                                                        class="comment-submit-btn">发送</button>
                                                        </div>
                                                </div>

                                                <!-- 第四行及以后：互动内容 -->
                                                <div v-if="hasInteractions(moment)" class="interactions-container">
                                                        <!-- 点赞列表 -->
                                                        <div v-if="moment.likeUsers && moment.likeUsers.length > 0"
                                                                class="likes-section">
                                                                <svg class="heart-icon" width="16" height="16"
                                                                        viewBox="0 0 24 24" fill="var(--accent-primary)"
                                                                        stroke="none">
                                                                        <path
                                                                                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z">
                                                                        </path>
                                                                </svg>
                                                                <div class="like-avatars">
                                                                        <div v-for="user in moment.likeUsers"
                                                                                :key="user.id"
                                                                                class="like-avatar avatar">
                                                                                <img v-if="user.avatar"
                                                                                        :src="user.avatar"
                                                                                        :alt="user.name">
                                                                                <span v-else class="avatar-initial">{{
                                                                                        getInitial(user.name) }}</span>
                                                                                </div>
                                                                        </div>
                                                                </div>                                                        <!-- 评论列表 -->
                                                        <div v-if="moment.recentReplies && moment.recentReplies.length > 0"
                                                                class="comments-section">
                                                                <div v-for="reply in moment.recentReplies"
                                                                        :key="reply.id" class="comment-item">
                                                                        <div class="comment-avatar avatar">
                                                                                <img v-if="reply.author.avatar"
                                                                                        :src="reply.author.avatar"
                                                                                        :alt="reply.author.name">
                                                                                <span v-else class="avatar-initial">{{
                                                                                        getInitial(reply.author.name)
                                                                                        }}</span>
                                                                        </div>
                                                                        <div class="comment-content">
                                                                                <div class="comment-author">{{
                                                                                        reply.author.name
                                                                                        }}</div>
                                                                                <div class="comment-text">
                                                                                        <span v-for="(part, index) in parseAtMentions(reply.content.text)" :key="index">
                                                                                                <span v-if="part.type === 'text'">{{ part.content }}</span>
                                                                                                <span v-else-if="part.type === 'mention'" 
                                                                                                        class="mention" 
                                                                                                        @click="handleMentionClick(part.actorName)">
                                                                                                        {{ part.content }}
                                                                                                </span>
                                                                                        </span>
                                                                                </div>
                                                                        </div>
                                                                </div>
                                                        </div>
                                                </div>
                                        </div>
                                </div>
                        </main>
                </template>

                <!-- @下拉菜单 -->
                <div v-if="showAtDropdown" class="at-dropdown" :style="{ top: dropdownPosition.top + 'px', left: dropdownPosition.left + 'px' }">
                        <div v-for="actor in filteredActors" :key="actor.id" 
                                class="at-option" @click="selectCommentAtActor(actor, currentCommentMoment)">
                                <div class="actor-avatar">
                                        <img v-if="getActorAvatar(actor)" :src="getActorAvatar(actor)" :alt="actor.name">
                                        <span v-else class="avatar-initial">{{ getInitial(actor.name) }}</span>
                                </div>
                                <span class="actor-name">{{ actor.name }}</span>
                        </div>
                        <div v-if="filteredActors.length === 0" class="no-results">
                                没有找到匹配的角色
                        </div>
                </div>

                <!-- 发布动态模态框 -->
                <WritePostModal :isVisible="showWritePostModal" :postType="postType" :editData="editingMoment"
                        :isEditMode="isEditMode" @close="closeWritePostModal" @publish="publishMoment" />
        </div>
</template><script setup>
import { ref, onMounted, onUnmounted, computed, watch, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import db, { USER_ACTOR_ID, resolveUserPersonaForMoments } from '../../services/database.js';
import { getDefaultUserPersona } from '../../services/userPersonaService.js';
import { showAlbumPickerModal, showUploadChoiceModal, showConfirm } from '../../services/uiService.js';
import { uploadToCloudinary } from '../../services/cloudinaryService.js';
import { formatTimestamp } from '../../utils/datetime.js';
import { applyActorTheme, restoreOriginalTheme } from '../../services/themeService.js';
import { toggleFavorite as toggleFavoriteService, isFavorited } from '../../services/favoritesService.js';
import { getActorBubbleStyle } from '../../services/bubbleStyleService.js';
import WritePostModal from '../../components/ui/WritePostModal.vue';
import DropdownMenu from '../../components/ui/DropdownMenu.vue';
import AppHeader from '../../components/layout/Header.vue';

const router = useRouter();

const props = defineProps({
        id: {
                type: String,
                default: null
        }
});

// 响应式数据
const isPersonalFeed = computed(() => !!props.id);
const profileActor = ref(null); // 个人动态页面的主人
const isHeaderExpanded = ref(false);
const currentPersona = ref(null);
const moments = ref([]);
const wallpaperSettings = ref(null);
const momentsHeaderImage = ref(null); // moments独立头图
const actorHeaderStyle = ref(null); // 角色头图样式
const activeOverlay = ref(null);

// 发布动态模态框
const showWritePostModal = ref(false);
const postType = ref('text'); // 'text' 或 'image'

// 编辑动态相关
const isEditMode = ref(false);
const editingMoment = ref(null);

// 动态菜单
const activeDropdown = ref(null);

// @功能相关
const showAtDropdown = ref(false);
const dropdownPosition = ref({ top: 0, left: 0 });
const atQuery = ref('');
const allActors = ref([]);
const filteredActors = ref([]);
const activeCommentInput = ref(null); // 当前激活的评论输入框引用
const currentCommentMoment = ref(null); // 当前正在评论的动态

// 根据当前是公共动态还是个人动态，决定显示谁的头像和名字
const displayUser = computed(() => {
        return isPersonalFeed.value ? profileActor.value : currentPersona.value;
});

// 获取角色动态页面的头图样式
const getActorMomentsHeaderStyle = async (actorId) => {
        try {
                const bubbleStyle = await getActorBubbleStyle(actorId);
                return {
                        background: `linear-gradient(135deg, ${bubbleStyle.userBubbleBg}, ${bubbleStyle.charBubbleBg})`
                };
        } catch (error) {
                console.error('Failed to get actor bubble style for moments header:', error);
                // 回退到默认渐变
                return {
                        background: 'linear-gradient(135deg, #007aff, #f0f0f0)'
                };
        }
};

// 计算头像显示逻辑
const avatarToShow = computed(() => {
        if (!displayUser.value) return null;
        
        // 如果是用户动态页面，使用当前人格的头像
        if (isPersonalFeed.value && (props.id === '__USER__' || props.id?.startsWith('user_'))) {
                return displayUser.value.avatar;
        }
        
        // 如果是角色动态页面，使用角色的当前头像或头像库中的第一个
        if (isPersonalFeed.value) {
                return displayUser.value.currentAvatar || 
                       (displayUser.value.avatarLibrary && displayUser.value.avatarLibrary.length > 0 ? 
                        displayUser.value.avatarLibrary[0] : displayUser.value.avatar);
        }
        
        // 公共动态页面，使用当前人格的头像
        return displayUser.value.avatar;
});

// 判断是否可以更换头图
const canChangeHeader = computed(() => {
        // 只有在公共动态页面或用户自己的动态页面才能更换头图
        return !isPersonalFeed.value || props.id === '__USER__' || props.id?.startsWith('user_');
});

// 获取动态中作者的头像
const getMomentAuthorAvatar = (author) => {
        if (!author) return null;
        
        // 如果是用户发布的动态，使用当前人格的头像
        if (author.id === USER_ACTOR_ID || author.id?.startsWith('user_')) {
                return currentPersona.value?.avatar;
        }
        
        // 如果是角色发布的动态，优先使用当前头像，否则使用头像库第一个，最后是默认头像
        return author.currentAvatar || 
               (author.avatarLibrary && author.avatarLibrary.length > 0 ? 
                author.avatarLibrary[0] : author.avatar);
};

// 处理返回导航
const handleBack = () => {
        if (isPersonalFeed.value) {
                // 个人动态页面
                if (props.id === '__USER__' || props.id?.startsWith('user_')) {
                        // 用户自己的动态，返回到 Me 页面
                        router.push('/chat/me');
                } else {
                        // 角色的动态，检查来源
                        const fromPage = router.currentRoute.value.query.from;
                        if (fromPage === 'profile') {
                                // 从profile页面来的，查看profile的来源并直接跳转
                                const profileFromPage = sessionStorage.getItem(`profile_${props.id}_from`);
                                if (profileFromPage === 'contacts') {
                                        router.push('/chat/contacts');
                                } else if (profileFromPage === 'messages') {
                                        router.push('/chat/messages');
                                } else if (profileFromPage === 'chatroom') {
                                        router.push(`/chatroom/${props.id}`);
                                } else {
                                        // 如果没有找到profile的来源，默认返回消息页面
                                        router.push('/chat/messages');
                                }
                        } else if (fromPage === 'contacts') {
                                router.push('/chat/contacts');
                        } else if (fromPage === 'messages') {
                                router.push('/chat/messages');
                        } else if (fromPage === 'chatroom') {
                                router.push(`/chatroom/${props.id}`);
                        } else {
                                router.push('/chat/messages');
                        }
                }
        } else {
                // 公共动态页面
                router.push('/chat/moments');
        }
};

// 切换头图展开状态
const toggleHeaderExpanded = () => {
        isHeaderExpanded.value = !isHeaderExpanded.value;
};

// 点击动态内容区域时收起头图
const collapseHeader = () => {
        if (isHeaderExpanded.value) {
                isHeaderExpanded.value = false;
        }
};

const showOverlay = (momentId, imageIndex) => {
        activeOverlay.value = { momentId, imageIndex };
};

const hideOverlay = () => {
        activeOverlay.value = null;
};

// 解析结构化描述文本
const getDescriptions = (moment) => {
        if (!moment.content.imageDescription) return [];
        // 假设描述格式为 "第1张：xxx\n第2张：yyy"
        return moment.content.imageDescription.split('\n')
                .map(line => line.replace(/^第\d+张：/, '').trim())
                .filter(line => line);
};

// 检查是否有互动内容
const hasInteractions = (moment) => {
        return (moment.likeUsers && moment.likeUsers.length > 0) || 
               (moment.recentReplies && moment.recentReplies.length > 0) ||
               moment.showCommentInput;
};

// 检查用户是否已点赞
const isLikedByUser = (moment) => {
        return moment.likeUsers && moment.likeUsers.some(user => 
                user.id === USER_ACTOR_ID || 
                (currentPersona.value && user.id === currentPersona.value.id) ||
                (user.id && user.id.startsWith('user_'))
        );
};

// 切换点赞状态
const toggleLike = async (moment) => {
        try {
                if (!currentPersona.value?.id) return;

                const isLiked = isLikedByUser(moment);
                
                if (isLiked) {
                        // 取消点赞 - 查找用户的点赞事件
                        const likeEvent = await db.events
                                .where('contextId').equals(moment.id)
                                .and(event => 
                                        event.type === 'like' && 
                                        (event.actorId === USER_ACTOR_ID || 
                                         (event.actorId && event.actorId.startsWith('user_')))
                                )
                                .first();
                        
                        if (likeEvent) {
                                await db.events.delete(likeEvent.id);
                        }
                        
                        // 更新本地状态
                        moment.likeUsers = moment.likeUsers.filter(user => 
                                user.id !== USER_ACTOR_ID && 
                                !(user.id && user.id.startsWith('user_'))
                        );
                        moment.likes = Math.max(0, moment.likes - 1);
                } else {
                        // 添加点赞 - 使用特殊标识符
                        await db.events.add({
                                timestamp: Date.now(),
                                actorId: USER_ACTOR_ID,
                                contextId: moment.id,
                                type: 'like',
                                content: {}
                        });
                        
                        // 更新本地状态 - 显示当前人格信息
                        if (!moment.likeUsers) moment.likeUsers = [];
                        
                        // 移除可能存在的旧用户点赞记录
                        moment.likeUsers = moment.likeUsers.filter(user => 
                                user.id !== USER_ACTOR_ID && 
                                !(user.id && user.id.startsWith('user_'))
                        );
                        
                        // 添加当前人格作为点赞用户
                        moment.likeUsers.push({ ...currentPersona.value, id: USER_ACTOR_ID });
                        moment.likes = (moment.likes || 0) + 1;
                }
        } catch (error) {
                console.error('点赞操作失败:', error);
        }
};

// 切换评论输入框显示状态
const toggleComment = (moment) => {
        moment.showCommentInput = !moment.showCommentInput;
        if (moment.showCommentInput && !moment.commentText) {
                moment.commentText = '';
        }
};

// 提交评论
const submitComment = async (moment) => {
        try {
                const commentText = moment.commentText?.trim();
                
                if (!currentPersona.value?.id || !commentText) return;

                // 添加评论事件 - 使用特殊标识符
                await db.events.add({
                        timestamp: Date.now(),
                        actorId: USER_ACTOR_ID,
                        contextId: moment.id,
                        type: 'reply',
                        content: { text: commentText }
                });
                
                // 更新本地状态 - 显示当前人格信息
                if (!moment.recentReplies) moment.recentReplies = [];
                moment.recentReplies.push({
                        id: Date.now(), // 临时ID
                        author: currentPersona.value,
                        content: { text: commentText },
                        timestamp: Date.now()
                });
                
                moment.replies = (moment.replies || 0) + 1;
                moment.commentText = '';
                moment.showCommentInput = false;
                
        } catch (error) {
                console.error('发表评论失败:', error);
        }
};

// 生成首字母头像
const getInitial = (name) => {
        if (!name) return 'U';
        return name.charAt(0).toUpperCase();
};

// 获取角色头像
const getActorAvatar = (actor) => {
        if (!actor) return null;
        return actor.currentAvatar || (actor.avatarLibrary && actor.avatarLibrary.length > 0 ? actor.avatarLibrary[0] : actor.avatar);
};

// 处理评论输入的@功能
const handleCommentInput = (event, moment) => {
        const input = event.target;
        const cursorPosition = input.selectionStart;
        const text = input.value;
        
        // 设置当前正在评论的动态
        currentCommentMoment.value = moment;
        
        // 检查光标前是否有@
        const beforeCursor = text.substring(0, cursorPosition);
        const atIndex = beforeCursor.lastIndexOf('@');
        
        if (atIndex !== -1) {
                const afterAt = beforeCursor.substring(atIndex + 1);
                // 如果@后面没有空格或换行符，显示下拉菜单
                if (!/\s/.test(afterAt)) {
                        atQuery.value = afterAt;
                        showAtDropdown.value = true;
                        activeCommentInput.value = input;
                        updateCommentDropdownPosition(input, atIndex);
                        filterActors();
                        return;
                }
        }
        
        // 隐藏下拉菜单
        showAtDropdown.value = false;
        activeCommentInput.value = null;
};

// 处理评论输入的键盘事件
const handleCommentKeydown = (event, moment) => {
        if (showAtDropdown.value) {
                if (event.key === 'Escape') {
                        showAtDropdown.value = false;
                        activeCommentInput.value = null;
                        event.preventDefault();
                } else if (event.key === 'ArrowDown') {
                        // 可以添加上下选择逻辑
                        event.preventDefault();
                } else if (event.key === 'Enter' && filteredActors.value.length > 0) {
                        selectCommentAtActor(filteredActors.value[0], moment);
                        event.preventDefault();
                }
        }
};

// 更新评论下拉菜单位置
const updateCommentDropdownPosition = (input, atIndex) => {
        const text = input.value.substring(0, atIndex);
        
        const span = document.createElement('span');
        span.style.font = window.getComputedStyle(input).font;
        span.style.whiteSpace = 'pre';
        span.textContent = text;
        document.body.appendChild(span);
        
        const textWidth = span.offsetWidth;
        document.body.removeChild(span);
        
        const rect = input.getBoundingClientRect();
        
        dropdownPosition.value = {
                top: rect.bottom + 5,
                left: rect.left + textWidth
        };
};

// 筛选角色
const filterActors = () => {
        if (!atQuery.value) {
                filteredActors.value = allActors.value.slice(0, 10); // 显示前10个
        } else {
                const query = atQuery.value.toLowerCase();
                filteredActors.value = allActors.value
                        .filter(actor => actor.name.toLowerCase().includes(query))
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .slice(0, 10);
        }
};

// 选择评论中的@角色
const selectCommentAtActor = (actor, moment) => {
        const input = activeCommentInput.value;
        if (!input) return;
        
        const cursorPosition = input.selectionStart;
        const text = input.value;
        
        // 找到最后一个@的位置
        const beforeCursor = text.substring(0, cursorPosition);
        const atIndex = beforeCursor.lastIndexOf('@');
        
        if (atIndex !== -1) {
                // 替换@后面的内容为角色名
                const beforeAt = text.substring(0, atIndex);
                const afterAt = text.substring(atIndex + 1);
                const spaceIndex = afterAt.search(/\s/);
                const afterSelection = spaceIndex !== -1 ? afterAt.substring(spaceIndex) : '';
                
                // 更新Vue的响应式数据
                const newText = beforeAt + '@' + actor.name + ' ' + afterSelection;
                moment.commentText = newText;
                
                // 设置光标位置
                const newCursorPosition = beforeAt.length + actor.name.length + 2;
                setTimeout(() => {
                        input.setSelectionRange(newCursorPosition, newCursorPosition);
                        input.focus();
                }, 0);
        }
        
        showAtDropdown.value = false;
        activeCommentInput.value = null;
        currentCommentMoment.value = null;
};

// 加载所有角色
const loadAllActors = async () => {
        try {
                const actors = await db.actors
                        .where('isGroup').equals(0) // 不包括群组
                        .and(actor => !actor.id.startsWith('user_') && actor.id !== '__USER__') // 排除用户预设
                        .toArray();
                allActors.value = actors.sort((a, b) => a.name.localeCompare(b.name));
        } catch (error) {
                console.error('加载角色列表失败:', error);
        }
};

// 解析@角色的方法
const parseAtMentions = (text) => {
        if (!text) return [];
        
        const parts = [];
        const regex = /(@[^\s]+)/g;
        let lastIndex = 0;
        let match;
        
        while ((match = regex.exec(text)) !== null) {
                // 添加@前的文本
                if (match.index > lastIndex) {
                        parts.push({
                                type: 'text',
                                content: text.substring(lastIndex, match.index)
                        });
                }
                
                // 添加@角色
                const mention = match[1];
                const actorName = mention.substring(1); // 去掉@
                parts.push({
                        type: 'mention',
                        content: mention,
                        actorName: actorName
                });
                
                lastIndex = match.index + match[0].length;
        }
        
        // 添加剩余文本
        if (lastIndex < text.length) {
                parts.push({
                        type: 'text',
                        content: text.substring(lastIndex)
                });
        }
        
        return parts;
};

// 点击@角色跳转到profile
const handleMentionClick = (actorName) => {
        // 查找对应的角色
        const actor = allActors.value.find(a => a.name === actorName);
        if (actor) {
                // 记录来源页面
                sessionStorage.setItem(`profile_${actor.id}_from`, 'moments');
                router.push(`/profile/${actor.id}`);
        }
};
const toggleFavorite = async (moment) => {
        try {
                if (!currentPersona.value?.id) return;

                // 使用保存的事件ID
                const eventId = moment.eventId;
                if (!eventId) {
                        console.error('找不到对应的事件ID');
                        return;
                }

                const favoriteParams = {
                        eventId: eventId,
                        eventType: 'post',
                        authorId: moment.author.id,
                        authorName: moment.author.name,
                        content: {
                                text: moment.content.text,
                                images: Array.isArray(moment.content.images)
                                        ? moment.content.images.map(img => typeof img === 'string' ? img : (img.url || ''))
                                        : [],
                                timestamp: moment.timestamp
                        }
                };

                const newFavoriteStatus = await toggleFavoriteService(favoriteParams);
                moment.isFavorited = newFavoriteStatus;
                
                console.log(newFavoriteStatus ? '已收藏' : '已取消收藏');
        } catch (error) {
                console.error('收藏操作失败:', error);
        }
};

// 打开发布动态模态框
const openWritePostModal = (type = 'text') => {
        postType.value = type;
        isEditMode.value = false;
        editingMoment.value = null;
        showWritePostModal.value = true;
};

// 打开编辑动态模态框
const openEditModal = (moment) => {
        isEditMode.value = true;
        editingMoment.value = moment;
        
        // 根据动态内容确定类型
        if (moment.content.images && moment.content.images.length > 0) {
                postType.value = 'image';
        } else {
                postType.value = 'text';
        }
        
        showWritePostModal.value = true;
        activeDropdown.value = null;
};

// 删除动态
const deleteMoment = async (moment) => {
        try {
                const confirmed = await showConfirm(
                        '删除动态',
                        '确定要删除这条动态吗？此操作无法撤销。'
                );
                
                if (confirmed) {
                        // 查找对应的事件
                        const eventId = moment.eventId;
                        if (eventId) {
                                await db.events.delete(eventId);
                                // 重新加载动态列表
                                await loadMoments();
                                console.log('动态已删除');
                        }
                }
        } catch (error) {
                console.error('删除动态失败:', error);
        }
        activeDropdown.value = null;
};

// 切换下拉菜单
const toggleDropdown = (momentId) => {
        activeDropdown.value = activeDropdown.value === momentId ? null : momentId;
};

// 关闭下拉菜单
const closeDropdown = () => {
        activeDropdown.value = null;
};

// 检查是否可以编辑/删除动态
const canEditMoment = (moment) => {
        // 用户可以编辑所有的动态
        return true;
};

// 关闭发布动态模态框
const closeWritePostModal = () => {
        showWritePostModal.value = false;
        isEditMode.value = false;
        editingMoment.value = null;
};

// 发布动态
const publishMoment = async (postData) => {
        try {
                if (isEditMode.value && editingMoment.value) {
                        // 编辑模式：更新现有动态
                        const eventId = editingMoment.value.id || editingMoment.value.eventId;
                        if (eventId) {
                                await db.events.update(eventId, {
                                        content: {
                                                text: postData.text,
                                                images: Array.isArray(postData.images) ? postData.images.map(img => img.url) : [],
                                                imageDescription: typeof postData.imageDescription === 'string' ? postData.imageDescription : '',
                                                placeholders: Array.isArray(postData.placeholders) ? postData.placeholders : []
                                        },
                                        timestamp: Date.now() // 更新时间戳
                                });
                                await showToast('动态更新成功', 'success');
                                console.log('动态更新成功');
                        }
                } else {
                        // 新建模式：创建新动态
                        const newMomentEvent = {
                                type: 'post',
                                contextId: '', // 先留空，待会儿更新
                                actorId: USER_ACTOR_ID, // 统一使用特殊标识符，显示时使用当前人格
                                content: {
                                        text: postData.text,
                                        images: Array.isArray(postData.images) ? postData.images.map(img => img.url) : [],
                                        imageDescription: typeof postData.imageDescription === 'string' ? postData.imageDescription : '',
                                        placeholders: Array.isArray(postData.placeholders) ? postData.placeholders : []
                                },
                                timestamp: Date.now(),
                                visibility: JSON.parse(JSON.stringify(postData.visibility))
                        };

                        // 保存到数据库，获取自动生成的ID
                        const eventId = await db.events.add(newMomentEvent);
                        
                        // 使用事件ID作为contextId更新记录
                        await db.events.update(eventId, { contextId: "post_" + eventId.toString() });
                        console.log('动态发布成功:', newMomentEvent);
                }

                // 重置编辑状态
                isEditMode.value = false;
                editingMoment.value = null;

                // 重新加载动态列表
                await loadMoments();
        } catch (error) {
                console.error('发布/更新动态失败:', error);
                await showToast('操作失败', 'error');
        }
};
// 计算头图样式
const headerImageStyle = computed(() => {
        // --- 个人动态页面的头图逻辑 ---
        if (isPersonalFeed.value && profileActor.value) {
                // 用户自己的个人动态页
                if (profileActor.value.id === USER_ACTOR_ID || profileActor.value.id?.startsWith('user_')) {
                        // 用户动态页的头图逻辑与公共页一致，继续向下执行
                } else {
                        // 角色的个人动态页，使用角色气泡样式的渐变（用户气泡背景 -> 角色气泡背景）
                        return actorHeaderStyle.value || {
                                background: 'linear-gradient(135deg, var(--user-bubble-bg), var(--char-bubble-bg))'
                        };
                }
        }

        // --- 公共动态页或用户个人页的头图逻辑 ---
        // 优先使用moments独立头图
        if (momentsHeaderImage.value) {
                const headerImage = momentsHeaderImage.value;

                // 处理动态渐变壁纸
                if (headerImage.startsWith('animated(')) {
                        const match = headerImage.match(/animated\((.*?),(.*?),(\d+)\)/);
                        if (match) {
                                const [_, color1, color2, angle] = match;
                                const gradientStyle = `linear-gradient(${angle}deg, ${color1} 0%, ${color2} 100%)`;
                                return {
                                        background: gradientStyle,
                                        backgroundSize: '200% 200%',
                                        animation: 'gradientAnimation 6s ease infinite'
                                };
                        }
                }

                // 处理渐变壁纸
                if (headerImage.startsWith('linear-gradient') || headerImage.startsWith('radial-gradient')) {
                        return { background: headerImage };
                }

                // 处理图片壁纸
                if (headerImage.startsWith('url(')) {
                        // 已经是url()格式
                        return {
                                backgroundImage: headerImage,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                        };
                } else {
                        // 普通URL，需要包装
                        return {
                                backgroundImage: `url(${headerImage})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                        };
                }
        }

        // 如果没有独立头图，使用全局壁纸设置
        if (!wallpaperSettings.value) return { backgroundColor: 'var(--bg-secondary)' };

        const wallpaper = wallpaperSettings.value.wallpaper;
        if (!wallpaper) return { backgroundColor: 'var(--bg-secondary)' };

        // 处理动态渐变壁纸
        if (wallpaper.startsWith('animated(')) {
                const match = wallpaper.match(/animated\((.*?),(.*?),(\d+)\)/);
                if (match) {
                        const [_, color1, color2, angle] = match;
                        const gradientStyle = `linear-gradient(${angle}deg, ${color1} 0%, ${color2} 100%)`;
                        return {
                                background: gradientStyle,
                                backgroundSize: '200% 200%',
                                animation: 'gradientAnimation 6s ease infinite'
                        };
                }
        }

        // 处理渐变壁纸
        if (wallpaper.startsWith('linear-gradient') || wallpaper.startsWith('radial-gradient')) {
                return { background: wallpaper };
        }

        // 处理图片壁纸
        if (wallpaper.startsWith('url(')) {
                // 已经是url()格式
                return {
                        backgroundImage: wallpaper,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                };
        } else {
                // 普通URL，需要包装
                return {
                        backgroundImage: `url(${wallpaper})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                };
        }
    });

// 更换头图
const changeHeaderImage = async () => {
        try {
                const choice = await showUploadChoiceModal();
                if (!choice) return;

                let imageUrl;
                if (choice.type === 'local') {
                        imageUrl = await uploadToCloudinary(choice.value);
                } else if (choice.type === 'album') {
                        const selectedPhoto = await showAlbumPickerModal();
                        imageUrl = selectedPhoto ? selectedPhoto.url : null;
                } else {
                        imageUrl = choice.value;
                }

                if (imageUrl) {
                        // 更新moments独立头图设置，而不是全局壁纸
                        await db.globalSettings.update('global', { momentsHeaderImage: imageUrl });
                        await loadMomentsHeaderImage();
                }
        } catch (error) {
                console.error('更换头图失败:', error);
        }
};

// 加载当前默认人格
const loadCurrentPersona = async () => {
        try {
                const defaultPersona = await getDefaultUserPersona();
                if (defaultPersona) {
                        currentPersona.value = defaultPersona;
                } else {
                        // 创建默认人格
                        const defaultUserPersona = {
                                id: 'user_persona_default',
                                name: 'User',
                                realName: '',
                                aliases: [],
                                gender: '',
                                birthday: '',
                                persona: '',
                                avatar: '',
                                groupIds: [],
                                isDefault: true,
                                type: 'user_persona',
                                avatarLibrary: []
                        };
                        
                        await db.actors.put(defaultUserPersona);
                        currentPersona.value = defaultUserPersona;
                }
        } catch (error) {
                console.error('加载当前人格预设失败:', error);
        }
};

// 加载壁纸设置
const loadWallpaperSettings = async () => {
        try {
                const settings = await db.globalSettings.get('global');
                wallpaperSettings.value = settings;
                console.log('Wallpaper settings loaded:', settings?.wallpaper);
        } catch (error) {
                console.error('加载壁纸设置失败:', error);
        }
};

// 加载moments头图设置
const loadMomentsHeaderImage = async () => {
        try {
                const settings = await db.globalSettings.get('global');
                momentsHeaderImage.value = settings?.momentsHeaderImage || null;
                console.log('Moments header image loaded:', momentsHeaderImage.value);
        } catch (error) {
                console.error('加载moments头图设置失败:', error);
        }
};

const loadMoments = async () => {
        try {
                // 获取所有动态相关的事件
                let query = db.events.where('type').equals('post');

                // 如果是个人动态页，则增加筛选条件
                if (isPersonalFeed.value) {
                        const targetId = props.id === '__USER__' ? USER_ACTOR_ID : props.id;
                        query = query.and(event => event.actorId === targetId);
                }

                const postEvents = await query.reverse().sortBy('timestamp');

                const momentsList = [];

                for (const event of postEvents) {
                        // 获取作者信息 - 处理用户动态
                        let author;
                        if (event.actorId === USER_ACTOR_ID || (event.actorId && event.actorId.startsWith('user_'))) {
                                // 用户发布的动态（使用特殊标识符或用户人格ID），使用当前默认人格
                                author = currentPersona.value;
                        } else {
                                // 其他角色发布的动态
                                author = await db.actors.get(event.actorId);
                        }

                        if (!author) continue;

                        // 获取该动态的回复和点赞
                        const replies = await db.events
                                .where('contextId')
                                .equals(event.contextId)
                                .and(e => e.type === 'reply')
                                .toArray();

                        const likes = await db.events
                                .where('contextId')
                                .equals(event.contextId)
                                .and(e => e.type === 'like')
                                .toArray();

                        // 获取点赞用户信息
                        const likeUsers = [];
                        for (const like of likes) {
                                let likeUser;
                                if (like.actorId === USER_ACTOR_ID) {
                                        // 用户的点赞，显示当前默认人格
                                        likeUser = { ...currentPersona.value, id: USER_ACTOR_ID };
                                } else {
                                        // 其他角色的点赞
                                        likeUser = await db.actors.get(like.actorId);
                                }

                                if (likeUser) {
                                        likeUsers.push(likeUser);
                                }
                        }

                        // 获取最近的几条回复
                        const recentReplies = [];
                        for (const reply of replies.slice(-3)) {
                                let replyAuthor;
                                if (reply.actorId === USER_ACTOR_ID || (reply.actorId && reply.actorId.startsWith('user_'))) {
                                        // 用户的回复，显示当前默认人格
                                        replyAuthor = currentPersona.value;
                                } else {
                                        // 其他角色的回复
                                        replyAuthor = await db.actors.get(reply.actorId);
                                }

                                if (replyAuthor) {
                                        recentReplies.push({
                                                id: reply.id,
                                                author: replyAuthor,
                                                content: reply.content,
                                                timestamp: reply.timestamp
                                        });
                                }
                        }

                        // 检查收藏状态
                        const isFavoritedStatus = await isFavorited(event.id);

                        momentsList.push({
                                id: event.contextId,
                                eventId: event.id, // 保存真实的事件ID以供收藏功能使用
                                author: author,
                                content: event.content,
                                timestamp: event.timestamp,
                                likes: likes.length,
                                replies: replies.length,
                                likeUsers: likeUsers,
                                recentReplies: recentReplies,
                                showCommentInput: false,
                                commentText: '',
                                isFavorited: isFavoritedStatus
                        });
                }

                moments.value = momentsList;
        } catch (error) {
                console.error('加载动态失败:', error);
        }
};


// 监听当前人格变化，重新加载动态以更新用户动态的显示信息
watch(currentPersona, (newPersona, oldPersona) => {
        if (newPersona && oldPersona && newPersona.id !== oldPersona.id) {
                console.log('User persona changed, reloading moments...');
                loadMoments();
        }
}, { deep: true });

watchEffect(async () => {
        // 这个函数会在组件挂载时以及 props.id 变化时自动运行
        if (isPersonalFeed.value) {
                // 如果是个人动态页，加载该页主人的信息
                if (props.id === '__USER__') {
                        // 用户自己的动态页，使用当前默认人格
                        profileActor.value = currentPersona.value;
                } else {
                        // 角色的动态页，从数据库加载角色信息
                        const actor = await db.actors.get(props.id);
                        profileActor.value = actor || null;
                }
        } else {
                // 如果是公共动态页，清空 profileActor
                profileActor.value = null;
        }
});


onMounted(async () => {
        // (onMounted 中关于 profileActor 的加载逻辑已被移至 watchEffect)
        await loadCurrentPersona();
        await loadWallpaperSettings();
        await loadMomentsHeaderImage();
        await loadAllActors();
        await loadMoments();

        // 清除moments未读状态
        await clearMomentsUnreadStatus();

        // 如果是角色的个人动态页面，应用角色主题（使用用户保存的主题选择）
        if (isPersonalFeed.value && props.id && props.id !== USER_ACTOR_ID && !props.id?.startsWith('user_')) {
                await applyActorTheme(props.id, null);
        }

        // 监听来自ChatLayout的发布动态事件
        const handleWritePostEvent = (event) => {
                const { type } = event.detail;
                openWritePostModal(type);
        };

        window.addEventListener('openWritePostModal', handleWritePostEvent);

        // 保存清理函数
        window.removeWritePostListener = () => {
                window.removeEventListener('openWritePostModal', handleWritePostEvent);
        };

        // 调试信息
        console.log('MomentsView mounted');
});

// 清除moments未读状态
const clearMomentsUnreadStatus = async () => {
        try {
                // 更新全局设置，记录用户最后查看moments的时间
                const settings = await db.globalSettings.get('global') || {};
                await db.globalSettings.put({
                        ...settings,
                        id: 'global',
                        lastViewedMoments: Date.now()
                });
                console.log('已清除moments未读状态');
        } catch (error) {
                console.error('清除moments未读状态失败:', error);
        }
};

// 清理事件监听器
onUnmounted(() => {
        if (window.removeWritePostListener) {
                window.removeWritePostListener();
                delete window.removeWritePostListener;
        }
        
        // 如果是角色的个人动态页面，恢复原始主题
        if (isPersonalFeed.value && props.id && props.id !== USER_ACTOR_ID && !props.id?.startsWith('user_')) {
                restoreOriginalTheme();
        }
});


</script>

<style scoped>

.page-container {
        background-color: var(--bg-primary);
        min-height: 100vh;
}

/* 头图区域 - 跟随页面滚动 */
.header-image-container {
        position: relative;
        height: 300px;
        min-height: 300px;
        width: 100%;
        transition: all 0.3s ease;
        cursor: pointer;
        overflow: hidden;
        margin-top: calc(-56px - var(--safe-top, 0px));
}

/* 个人动态页面的头图需要适应头部导航 */
:deep(.page-container:has(.app-header)) .header-image-container {
        margin-top: 0;
}

.header-image-container.expanded {
        height: 60vh;
        min-height: 400px;
}

.header-image {
        width: 100%;
        height: 100%;
        min-height: inherit;
        position: relative;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        background-color: var(--bg-secondary);
}

.wallpaper-effect {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
}

/* 用户头像区域 - 一半在头图区域，一半在动态区域 */
.user-avatar-section {
        position: relative;
        z-index: 10;
        margin-top: -40px; /* 让头像一半显示在头图上 */
        padding: 0 20px 20px;
        transition: opacity 0.3s ease, visibility 0.3s ease;
}

.user-avatar-section.hidden {
        opacity: 0;
        visibility: hidden;
}

.user-info-container {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 12px;
}

.user-avatar {
        width: 80px;
        height: 80px;
        border-radius: 8px;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: var(--bg-secondary);
        overflow: hidden;
        border: 1px solid var(--border-color);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        flex-shrink: 0;
}

.user-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
}

.user-avatar .avatar-initial {
        color: var(--accent-primary);
        font-size: 32px;
        font-weight: bold;
}

.user-name {
        color: var(--accent-text);
        font-size: 20px;
        font-weight: 600;
        margin: -40px 0 0 0;
        text-align: right;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.user-signature {
        color: var(--accent-text);
        font-size: 14px;
        margin: 10px 0 0 0;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        text-align: right;
}

/* 头图展开时的控制按钮 */
.header-controls {
        position: absolute;
        bottom: 20px;
        right: 20px;
        z-index: 15;
}

.change-header-btn {
        background: rgba(0, 0, 0, 0.6);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
}

.change-header-btn:hover {
        background: rgba(0, 0, 0, 0.8);
}

/* 个人动态页面的主容器 */
.personal-moments-main {
        height: 100vh;
        overflow-y: auto;
        overflow-x: hidden;
        /* 提供整个页面的滚动 */
}

/* 动态内容区域 */
.moments-content {
        padding: 0 15px;
        padding-bottom: calc(var(--footer-height) + 10px);
}

/* 个人动态页面特殊样式 - 没有Footer，调整底部空间 */
.personal-moments-main .moments-content {
        padding-bottom: 30px; /* 给底部留出足够空间 */
}

.empty-state {
        text-align: center;
        padding: 50px 20px;
        color: var(--text-secondary);
}

.moments-list {
        display: flex;
        flex-direction: column;
        gap: 20px;
}

.moment-item {
        background-color: var(--bg-card);
        border-radius: 12px;
        padding: 16px;
        border: 1px solid var(--border-color);
}

/* 第一行：头像和名字 */
.moment-row-1 {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
}

.moment-author-info {
        display: flex;
        align-items: center;
        gap: 12px;
}

.moment-menu {
        position: relative;
}

.menu-trigger {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
}

.menu-trigger:hover {
        color: var(--text-primary);
}

.moment-author {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
}

/* 第二行：动态内容 */
.moment-row-2 {
        display: grid;
        grid-template-columns: 48px 1fr;
        gap: 12px;
        margin-bottom: 8px;
}

.moment-spacer {
        /* 空白占位符，用于网格布局对齐 */
        width: 48px;
}

.moment-content {
        /* 动态内容容器 */
        width: 100%;
}

.moment-text {
        font-size: 15px;
        line-height: 1.5;
        color: var(--text-primary);
        margin-bottom: 12px;
        word-wrap: break-word;
}

.mention {
        color: var(--accent-primary);
        cursor: pointer;
        font-weight: 500;
}

.mention:hover {
        text-decoration: underline;
}

.moment-text.image-description {
        font-size: 14px;
        color: var(--text-secondary);
        background-color: var(--bg-secondary);
        padding: 8px 12px;
        border-radius: 8px;
        margin-top: 10px;
}

.moment-images {
        display: grid;
        gap: 8px;
        grid-template-columns: repeat(3, 1fr);
}

.moment-images:has(.moment-image-container:only-child) {
        grid-template-columns: 1fr;
        max-width: 300px;
}

.moment-images:has(.moment-image-container:nth-child(2):last-child) {
        grid-template-columns: repeat(2, 1fr);
}

.moment-image:hover {
        transform: scale(1.02);
}

.moment-placeholders {
        display: grid;
        gap: 8px;
        grid-template-columns: repeat(3, 1fr);
        margin-top: 12px;
}

.moment-placeholders:has(.placeholder-item:only-child) {
        grid-template-columns: 1fr;
        max-width: 300px;
}

.moment-placeholders:has(.placeholder-item:nth-child(2):last-child) {
        grid-template-columns: repeat(2, 1fr);
}

.placeholder-item {
        display: flex;
        flex-direction: column;
        /* 让图标和文字垂直排列 */
        align-items: center;
        justify-content: center;
        /* 垂直和水平居中 */
        gap: 8px;
        background-color: var(--bg-secondary);
        padding: 12px;
        border-radius: 8px;
        border: 1px solid var(--border-color);
        aspect-ratio: 1;
        /* 保持1:1的正方形比例 */
        text-align: center;
        /* 文字居中 */
}
.moment-image-container {
        position: relative;
        cursor: pointer;
        overflow: hidden;
        border-radius: 8px;
        aspect-ratio: 1;
        /* 关键：保持容器为1:1的正方形 */
}

.moment-image {
        width: 100%;
        height: 100%;
        /* 让图片填满其容器 */
        object-fit: cover;
        transition: transform 0.2s ease;
}

.image-description-overlay {
        position: absolute;
        inset: 0;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 10px;
        text-align: center;
        font-size: 14px;
        line-height: 1.5;
        overflow-y: auto;
}


.image-description-overlay p {
        margin: auto 0;
        white-space: pre-wrap;
        word-break: break-word;
}

/* 渐入渐出动画 */
.fade-enter-active,
.fade-leave-active {
        transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
        opacity: 0;
}

/* 第三行：时间和操作按钮 */
.moment-row-3 {
        display: grid;
        grid-template-columns: 48px 1fr auto;
        gap: 12px;
        align-items: center;
}

.moment-time {
        font-size: 12px;
        color: var(--text-secondary);
        margin: 0;
}

.moment-actions {
        display: flex;
        gap: 16px;
}

.action-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s ease;
        color: var(--text-secondary);
}

.action-btn:hover {
        color: var(--accent-primary);
}

.like-btn.liked {
        color: var(--accent-primary);
}

.like-btn.liked svg {
        fill: var(--accent-primary);
}

/* 评论输入框行 - 紧跟在第三行后面 */
.comment-input-row {
        display: grid;
        grid-template-columns: 48px 1fr;
        gap: 12px;
        margin-top: 8px;
        margin-bottom: 12px;
}

/* 互动内容容器 */
.interactions-container {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--border-color);
}

/* 点赞区域 */
.likes-section {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        flex-wrap: wrap;
}

.heart-icon {
        flex-shrink: 0;
}

.like-avatars {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
}

.like-avatar {
        width: 30px;
        height: 30px;
        border-radius: 4px;
        border: 1px solid var(--border-color);
        font-size: 10px;
}

/* 评论区域 */
.comments-section {
        margin-bottom: 12px;
}

.comment-item {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
}

.comment-item:last-child {
        margin-bottom: 0;
}

.comment-avatar {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        flex-shrink: 0;
        font-size: 14px;
}

.comment-content {
        flex: 1;
}

.comment-author {
        font-size: 13px;
        font-weight: 600;
        color: var(--accent-primary);
        margin-bottom: 2px;
}

.comment-text {
        font-size: 14px;
        color: var(--text-primary);
        line-height: 1.4;
}

/* 评论输入区域 */
.comment-input-section {
        display: flex;
        gap: 8px;
        align-items: center;
}

.comment-input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid var(--border-color);
        border-radius: 20px;
        background-color: var(--bg-secondary);
        color: var(--text-primary);
        font-size: 14px;
        outline: none;
}

.comment-input:focus {
        border-color: var(--accent-primary);
}

.comment-submit-btn {
        background: var(--accent-primary);
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 16px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
}

.comment-submit-btn:hover {
        background: var(--accent-darker);
}

/* 动画效果 */
@keyframes gradientShift {
        0% { transform: rotate(0deg) scale(1); }
        50% { transform: rotate(180deg) scale(1.1); }
        100% { transform: rotate(360deg) scale(1); }
}

@keyframes gradientAnimation {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
}

:deep(.animated-gradient) {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
}

/* 菜单按钮样式 */
.menu-button {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        position: relative;
}

.menu-button:hover {
        background-color: var(--bg-secondary);
        color: var(--text-primary);
}

.menu-button svg {
        width: 16px;
        height: 16px;
}

.at-dropdown {
        position: fixed;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        max-height: 200px;
        overflow-y: auto;
        z-index: 1000;
        min-width: 200px;
        max-width: 300px;
}

.at-option {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        cursor: pointer;
        border-bottom: 1px solid var(--border-color);
}

.at-option:last-child {
        border-bottom: none;
}

.at-option:hover {
        background: var(--bg-secondary);
}

.actor-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        overflow: hidden;
        flex-shrink: 0;
}

.actor-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
}

.avatar-initial {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--accent-primary);
        color: white;
        font-weight: 600;
        font-size: 14px;
}

.actor-name {
        color: var(--text-primary);
        font-size: 14px;
        flex: 1;
}

.no-results {
        padding: 12px;
        color: var(--text-secondary);
        font-size: 14px;
        text-align: center;
}

</style>