<template>
        <div class="page-container">
                <!-- 头图区域 - 会跟随页面滚动 -->
                <div class="header-image-container" :class="{ 'expanded': isHeaderExpanded }" @click="toggleHeaderExpanded">
                        <div class="header-image" :style="headerImageStyle"></div>
                        
                        <!-- 头图展开时的控制按钮 -->
                        <div v-if="isHeaderExpanded" class="header-controls">
                                <button class="change-header-btn" @click.stop="changeHeaderImage">
                                        更换头图
                                </button>
                        </div>
                </div>

                <!-- 用户头像 - 一半在头图区域，一半在动态区域 -->
                <div class="user-avatar-section" :class="{ 'hidden': isHeaderExpanded }">
                        <div class="user-info-container">
                                <h2 class="user-name">{{ currentPersona?.name || 'User' }}</h2>
                                <div class="user-avatar">
                                        <img v-if="currentPersona?.avatar" :src="currentPersona.avatar" :alt="currentPersona.name || 'User'">
                                        <span v-else class="avatar-initial">{{ getInitial(currentPersona?.name || 'User') }}</span>
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
                                                <div class="moment-avatar avatar">
                                                        <img v-if="moment.author.avatar" :src="moment.author.avatar" :alt="moment.author.name">
                                                        <span v-else class="avatar-initial">{{ getInitial(moment.author.name) }}</span>
                                                </div>
                                                <h3 class="moment-author">{{ moment.author.name }}</h3>
                                        </div>
                                        
                                        <!-- 第二行：动态内容 -->
                                        <div class="moment-row-2">
                                                <div class="moment-spacer"></div>
                                                <div class="moment-content">
                                                        <p v-if="moment.content.text" class="moment-text">{{ moment.content.text }}</p>
                                                        <div v-if="moment.content.images && moment.content.images.length > 0" class="moment-images">
                                                                <img v-for="(image, index) in moment.content.images" 
                                                                     :key="index" 
                                                                     :src="image" 
                                                                     :alt="`图片 ${index + 1}`"
                                                                     class="moment-image">
                                                        </div>
                                                </div>
                                        </div>
                                        
                                        <!-- 第三行：时间和操作按钮 -->
                                        <div class="moment-row-3">
                                                <div class="moment-spacer"></div>
                                                <p class="moment-time">{{ formatTimestamp(moment.timestamp) }}</p>
                                                <div class="moment-actions">
                                                        <button 
                                                                class="action-btn like-btn" 
                                                                :class="{ 'liked': isLikedByUser(moment) }"
                                                                @click="toggleLike(moment)"
                                                        >
                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                                                </svg>
                                                        </button>
                                                        <button 
                                                                class="action-btn comment-btn"
                                                                @click="toggleComment(moment)"
                                                        >
                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                                                </svg>
                                                        </button>
                                                </div>
                                        </div>
                                        
                                        <!-- 评论输入框 - 紧跟在第三行后面 -->
                                        <div v-if="moment.showCommentInput" class="comment-input-row">
                                                <div class="moment-spacer"></div>
                                                <div class="comment-input-section">
                                                        <input 
                                                                v-model="moment.commentText"
                                                                type="text" 
                                                                placeholder="写评论..."
                                                                class="comment-input"
                                                                @keyup.enter="submitComment(moment)"
                                                        >
                                                        <button @click="submitComment(moment)" class="comment-submit-btn">发送</button>
                                                </div>
                                        </div>
                                        
                                        <!-- 第四行及以后：互动内容 -->
                                        <div v-if="hasInteractions(moment)" class="interactions-container">
                                                <!-- 点赞列表 -->
                                                <div v-if="moment.likeUsers && moment.likeUsers.length > 0" class="likes-section">
                                                        <svg class="heart-icon" width="16" height="16" viewBox="0 0 24 24" fill="#ff4757" stroke="none">
                                                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                                        </svg>
                                                        <div class="like-avatars">
                                                                <div v-for="user in moment.likeUsers" :key="user.id" class="like-avatar avatar">
                                                                        <img v-if="user.avatar" :src="user.avatar" :alt="user.name">
                                                                        <span v-else class="avatar-initial">{{ getInitial(user.name) }}</span>
                                                                </div>
                                                        </div>
                                                </div>
                                                
                                                <!-- 评论列表 -->
                                                <div v-if="moment.recentReplies && moment.recentReplies.length > 0" class="comments-section">
                                                        <div v-for="reply in moment.recentReplies" :key="reply.id" class="comment-item">
                                                                <div class="comment-avatar avatar">
                                                                        <img v-if="reply.author.avatar" :src="reply.author.avatar" :alt="reply.author.name">
                                                                        <span v-else class="avatar-initial">{{ getInitial(reply.author.name) }}</span>
                                                                </div>
                                                                <div class="comment-content">
                                                                        <div class="comment-author">{{ reply.author.name }}</div>
                                                                        <div class="comment-text">{{ reply.content.text }}</div>
                                                                </div>
                                                        </div>
                                                </div>
                                        </div>
                                </div>
                        </div>
                </main>
                
                <!-- 发布动态模态框 -->
                <WritePostModal 
                        :isVisible="showWritePostModal"
                        :postType="postType"
                        @close="closeWritePostModal"
                        @publish="publishMoment"
                />
        </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import db, { USER_ACTOR_ID, resolveUserPersonaForMoments } from '../../services/database.js';
import { getDefaultUserPersona } from '../../services/userPersonaService.js';
import { showAlbumPickerModal, showUploadChoiceModal } from '../../services/uiService.js';
import { uploadToCloudinary } from '../../services/cloudinaryService.js';
import { formatTimestamp } from '../../utils/datetime.js';
import WritePostModal from '../../components/ui/WritePostModal.vue';

const router = useRouter();

// 响应式数据
const isHeaderExpanded = ref(false);
const currentPersona = ref(null);
const moments = ref([]);
const wallpaperSettings = ref(null);
const momentsHeaderImage = ref(null); // moments独立头图

// 发布动态模态框
const showWritePostModal = ref(false);
const postType = ref('text'); // 'text' 或 'image'

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

// 检查是否有互动内容
const hasInteractions = (moment) => {
        return (moment.likeUsers && moment.likeUsers.length > 0) || 
               (moment.recentReplies && moment.recentReplies.length > 0) ||
               moment.showCommentInput;
};

// 检查用户是否已点赞
const isLikedByUser = (moment) => {
        return moment.likeUsers && moment.likeUsers.some(user => user.id === USER_ACTOR_ID || user.id === currentPersona.value?.id);
};

// 切换点赞状态
const toggleLike = async (moment) => {
        try {
                if (!currentPersona.value?.id) return;

                const isLiked = isLikedByUser(moment);
                
                if (isLiked) {
                        // 取消点赞 - 查找用户的点赞事件（可能使用 __USER__ 或具体人格ID）
                        const likeEvent = await db.events
                                .where('contextId').equals(moment.id)
                                .and(event => 
                                        event.type === 'like' && 
                                        (event.actorId === USER_ACTOR_ID || event.actorId === currentPersona.value.id)
                                )
                                .first();
                        
                        if (likeEvent) {
                                await db.events.delete(likeEvent.id);
                        }
                        
                        // 更新本地状态
                        moment.likeUsers = moment.likeUsers.filter(user => 
                                user.id !== USER_ACTOR_ID && user.id !== currentPersona.value.id
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
                                user.id !== USER_ACTOR_ID && user.id !== currentPersona.value.id
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

// 打开发布动态模态框
const openWritePostModal = (type = 'text') => {
        postType.value = type;
        showWritePostModal.value = true;
};

// 关闭发布动态模态框
const closeWritePostModal = () => {
        showWritePostModal.value = false;
};

// 发布动态
const publishMoment = async (postData) => {
        try {
                const newMomentEvent = {
                        type: 'post',
                        contextId: Date.now().toString(),
                        actorId: currentPersona.value?.id || USER_ACTOR_ID,
                        content: {
                                text: postData.text,
                                images: Array.isArray(postData.images) ? [...postData.images] : [],
                                imageDescription: typeof postData.imageDescription === 'string' ? postData.imageDescription : ''
                        },
                        timestamp: Date.now(),
                        visibility: postData.visibility
                };

                // 保存到数据库
                await db.events.add(newMomentEvent);

                // 重新加载动态列表
                await loadMoments();

                console.log('动态发布成功:', newMomentEvent);
        } catch (error) {
                console.error('发布动态失败:', error);
        }
};

// 计算头图样式
const headerImageStyle = computed(() => {
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
                        imageUrl = await showAlbumPickerModal();
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

// 加载动态数据
const loadMoments = async () => {
        try {
                // 获取所有动态相关的事件
                const postEvents = await db.events
                        .where('type')
                        .equals('post')
                        .reverse()
                        .sortBy('timestamp');
                
                const momentsList = [];
                
                for (const event of postEvents) {
                        // 获取作者信息 - 处理用户动态
                        let author;
                        if (event.actorId === USER_ACTOR_ID) {
                                // 用户发布的动态，使用当前默认人格
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
                                if (reply.actorId === USER_ACTOR_ID) {
                                        // 用户的回复，需要根据上下文判断使用哪个人格
                                        // 如果是在其他角色的动态下回复，显示当前默认人格
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
                        
                        momentsList.push({
                                id: event.contextId,
                                author: author,
                                content: event.content,
                                timestamp: event.timestamp,
                                likes: likes.length,
                                replies: replies.length,
                                likeUsers: likeUsers,
                                recentReplies: recentReplies,
                                showCommentInput: false,
                                commentText: ''
                        });
                }
                
                moments.value = momentsList;
        } catch (error) {
                console.error('加载动态失败:', error);
        }
};

onMounted(() => {
        loadCurrentPersona().then(() => {
                loadMoments(); // 确保在加载当前人格后再加载动态
        });
        loadWallpaperSettings();
        loadMomentsHeaderImage(); // 加载moments独立头图
        
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

// 清理事件监听器
onUnmounted(() => {
        if (window.removeWritePostListener) {
                window.removeWritePostListener();
                delete window.removeWritePostListener;
        }
});

// 监听当前人格的变化，重新加载动态
const reloadMomentsOnPersonaChange = () => {
        loadMoments();
};

// 调试函数
const debugUserActions = () => {
        console.log('Current persona:', currentPersona.value);
        console.log('Moments:', moments.value);
};
</script>

<style scoped>
.page-container {
        background-color: var(--bg-primary);
        min-height: 100vh;
        padding-bottom: 60px; /* 为底部导航留出空间 */
}

/* 头图区域 - 跟随页面滚动 */
.header-image-container {
        position: relative;
        height: 200px;
        min-height: 200px;
        width: 100%;
        transition: all 0.3s ease;
        cursor: pointer;
        overflow: hidden;
        margin-top: calc(56px + var(--safe-top, 0px)); /* 为ChatLayout的Header留出空间 */
}

.header-image-container.expanded {
        height: 40vh;
        min-height: 300px;
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
        border: 4px solid white;
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
        color: var(--text-primary);
        font-size: 20px;
        font-weight: 600;
        margin: 0;
        text-align: right;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
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

/* 动态内容区域 */
.moments-content {
        padding: 0 15px;
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
        display: grid;
        grid-template-columns: 48px 1fr;
        gap: 12px;
        align-items: center;
        margin-bottom: 8px;
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
        margin: 0 0 12px 0;
}

.moment-images {
        display: grid;
        gap: 8px;
        grid-template-columns: repeat(3, 1fr);
}

.moment-images:has(.moment-image:only-child) {
        grid-template-columns: 1fr;
        max-width: 300px;
}

.moment-images:has(.moment-image:nth-child(2):last-child) {
        grid-template-columns: repeat(2, 1fr);
}

.moment-image {
        width: 100%;
        aspect-ratio: 1;
        object-fit: cover;
        border-radius: 8px;
        cursor: pointer;
        transition: transform 0.2s ease;
}

.moment-image:hover {
        transform: scale(1.02);
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
        background-color: var(--bg-secondary);
        color: var(--accent-primary);
}

.like-btn.liked {
        color: #ff4757;
}

.like-btn.liked svg {
        fill: #ff4757;
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
        width: 24px;
        height: 24px;
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


</style>