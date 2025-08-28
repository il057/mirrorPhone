<template>
	<div 
		v-if="visible" 
		class="context-menu"
		:style="menuStyle"
		@click.stop
	>
		<div class="context-menu-item" @click="handleQuote">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
				<path d="M7.657 6.247c.11-.33.576-.33.686 0l.645 1.937a2.89 2.89 0 0 0 1.829 1.828l1.936.645c.33.11.33.576 0 .686l-1.937.645a2.89 2.89 0 0 0-1.828 1.829l-.645 1.936a.361.361 0 0 1-.686 0l-.645-1.937a2.89 2.89 0 0 0-1.828-1.828l-1.937-.645a.361.361 0 0 1 0-.686l1.937-.645a2.89 2.89 0 0 0 1.828-1.828zM3.794 1.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387A1.73 1.73 0 0 0 4.593 5.69l-.387 1.162a.217.217 0 0 1-.412 0L3.407 5.69A1.73 1.73 0 0 0 2.31 4.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387A1.73 1.73 0 0 0 3.407 2.31zM10.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.16 1.16 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.16 1.16 0 0 0-.732-.732L9.1 2.137a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732z"/>
			</svg>
			<span>引用</span>
		</div>
		
		<div class="context-menu-item" @click="handleFavorite">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
				<path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143q.09.083.176.171a3 3 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15"/>
			</svg>
			<span>收藏</span>
		</div>
		
		<div class="context-menu-item" @click="handleEdit" v-if="canEdit">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
				<path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
				<path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>
			</svg>
			<span>编辑</span>
		</div>
		
		<div class="context-menu-item" @click="handleMultiSelect">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
				<path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z"/>
				<path d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z"/>
			</svg>
			<span>多选</span>
		</div>
		
		<div class="context-menu-divider"></div>
		
		<div class="context-menu-item danger" @click="handleDelete">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
				<path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
				<path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
			</svg>
			<span>删除</span>
		</div>
	</div>
	
	<!-- 背景遮罩 -->
	<div v-if="visible" class="context-menu-overlay" @click="hide"></div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
	visible: {
		type: Boolean,
		default: false
	},
	x: {
		type: Number,
		default: 0
	},
	y: {
		type: Number,
		default: 0
	},
	message: {
		type: Object,
		default: () => ({})
	},
	isOwnMessage: {
		type: Boolean,
		default: false
	}
});

const emit = defineEmits(['hide', 'quote', 'favorite', 'edit', 'multiSelect', 'delete']);

// 计算菜单位置
const menuStyle = computed(() => {
	const menuWidth = 160;
	const menuHeight = 280;
	const padding = 10;
	
	let x = props.x;
	let y = props.y;
	
	// 防止菜单超出屏幕右侧
	if (x + menuWidth > window.innerWidth - padding) {
		x = window.innerWidth - menuWidth - padding;
	}
	
	// 防止菜单超出屏幕底部
	if (y + menuHeight > window.innerHeight - padding) {
		y = y - menuHeight;
	}
	
	// 防止菜单超出屏幕顶部
	if (y < padding) {
		y = padding;
	}
	
	return {
		left: `${x}px`,
		top: `${y}px`
	};
});

// 计算权限 - 现在允许编辑和删除所有消息
const canEdit = computed(() => {
	// 只允许编辑text类型的消息，且不是系统消息
	const message = props.message;
	if (!message || !message.content) return false;
	
	// 检查消息类型
	const isTextMessage = !message.content.type || message.content.type === 'text';
	const isNotSystemMessage = message.actorId !== 'system';
	
	console.log('编辑权限检查:', {
		messageId: message.id,
		actorId: message.actorId,
		contentType: message.content.type,
		isTextMessage,
		isNotSystemMessage,
		canEdit: isTextMessage && isNotSystemMessage
	});
	
	return isTextMessage && isNotSystemMessage;
});
const canDelete = computed(() => true); // 允许删除所有消息

// 菜单操作处理
const handleQuote = () => {
	emit('quote', props.message);
	hide();
};

const handleFavorite = () => {
	emit('favorite', props.message);
	hide();
};

const handleEdit = () => {
	emit('edit', props.message);
	hide();
};

const handleMultiSelect = () => {
	emit('multiSelect', props.message);
	hide();
};

const handleDelete = () => {
	emit('delete', props.message);
	hide();
};

const hide = () => {
	emit('hide');
};
</script>

<style scoped>
.context-menu {
	position: fixed;
	background: var(--bg-card);
	border: 1px solid var(--border-color);
	border-radius: 8px;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
	backdrop-filter: blur(10px);
	-webkit-backdrop-filter: blur(10px);
	z-index: 1000;
	min-width: 160px;
	padding: 8px 0;
	user-select: none;
}

.context-menu-item {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 10px 16px;
	cursor: pointer;
	transition: background-color 0.2s;
	font-size: 14px;
	color: var(--text-primary);
}

.context-menu-item:hover {
	background-color: var(--bg-secondary);
}

.context-menu-item.danger {
	color: var(--error-color, #ff4757);
}

.context-menu-item.danger:hover {
	background-color: rgba(255, 71, 87, 0.1);
}

.context-menu-item svg {
	flex-shrink: 0;
}

.context-menu-divider {
	height: 1px;
	background-color: var(--border-color);
	margin: 4px 0;
}

.context-menu-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 999;
	background: transparent;
}

/* 移动端适配 */
@media (max-width: 768px) {
	.context-menu {
		min-width: 180px;
		font-size: 16px;
	}
	
	.context-menu-item {
		padding: 14px 20px;
	}
}
</style>
