// 通知特效服务
// 管理通知特效的样式和逻辑

// 通知特效的CSS样式
export const notificationEffectStyles = `
/* === 新消息通知特效 === */
.has-notification {
        position: relative;
        animation: notification-pulse 3s infinite ease-in-out;
}

.has-notification::before {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        border-radius: 16px;
        box-shadow: 0 0 0 2px var(--accent-primary, #3b82f6),
                    0 0 8px var(--accent-primary, #3b82f6),
                    0 0 16px var(--accent-darker, #1e40af);
        animation: notification-border-glow 3s infinite ease-in-out;
        z-index: -1;
        pointer-events: none;
        opacity: 0.7;
}

/* 针对PersonalizationView的图标容器优化 */
/* 让内部的 .icon-image-container 成为定位的基准 */
.preview-app-icon.has-notification .icon-image-container {
        position: relative;
        /* 确保背景和圆角在这个容器上，而不是在SVG上 */
        z-index: 0;
    }

    /* 2. 将辉光应用到尺寸正确的 .icon-image-container 上 */
    .preview-app-icon.has-notification .icon-image-container::before {
        content: '';
        position: absolute;
        /* inset 是 top, right, bottom, left 的简写 */
        inset: -2px;
        border-radius: 12px; /* 务必确保这个圆角值与图标的视觉圆角一致 */
        box-shadow: 0 0 0 2px var(--accent-primary, #3b82f6),
                    0 0 8px var(--accent-primary, #3b82f6),
                    0 0 16px var(--accent-darker, #1e40af);
        animation: notification-border-glow 3s infinite ease-in-out;
        /* 将辉光置于一个独立的层，介于背景和SVG图标之间 */
        z-index: 1;
        pointer-events: none;
        opacity: 0.8;
    }


@keyframes notification-pulse {
        0%, 100% {
                transform: scale(1);
        }
        50% {
                transform: scale(1.01);
        }
}

@keyframes notification-border-glow {
        0%, 100% {
                opacity: 0.5;
        }
        50% {
                opacity: 0.9;
        }
`;

// 注入通知特效样式到页面
export function injectNotificationStyles() {
        if (document.getElementById('notification-effect-styles')) {
                return; // 已经注入过了
        }

        const style = document.createElement('style');
        style.id = 'notification-effect-styles';
        style.textContent = notificationEffectStyles;
        document.head.appendChild(style);
}

// 移除通知特效样式
export function removeNotificationStyles() {
        const style = document.getElementById('notification-effect-styles');
        if (style) {
                style.remove();
        }
}

// 检查元素是否有通知特效
export function hasNotificationEffect(element) {
        return element.classList.contains('has-notification');
}

// 添加通知特效到元素
export function addNotificationEffect(element) {
        element.classList.add('has-notification');
}

// 移除通知特效从元素
export function removeNotificationEffect(element) {
        element.classList.remove('has-notification');
}

// 切换通知特效
export function toggleNotificationEffect(element, enabled) {
        if (enabled) {
                addNotificationEffect(element);
        } else {
                removeNotificationEffect(element);
        }
}
