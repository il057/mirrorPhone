/**
 * 主题管理服务
 * 负责管理全局主题色和角色特定主题色的切换
 */

import { getActorBubbleStyle } from './bubbleStyleService.js';
import {
        calculateThemeColors,
        applyThemeColors,
        getCurrentThemeColors,
        createBubbleThemeColors
} from '../utils/colorUtils.js';

// 保存原始全局主题色
let originalTheme = {
        primary: null,
        text: null,
        darker: null,
        lighter: null
};

// 当前角色主题状态
let currentActorTheme = {
        actorId: null,
        bubbleStyle: null,
        isUsingUserBubble: true
};

// 用户对每个角色的主题选择（保存在localStorage中）
const THEME_CHOICE_KEY = 'actorThemeChoices';

// 获取角色的主题选择
export function getActorThemeChoice(actorId) {
        try {
                const choices = JSON.parse(localStorage.getItem(THEME_CHOICE_KEY) || '{}');
                return choices[actorId] ?? true; // 默认使用用户气泡色
        } catch {
                return true;
        }
}

// 保存角色的主题选择
export function saveActorThemeChoice(actorId, isUsingUserBubble) {
        try {
                const choices = JSON.parse(localStorage.getItem(THEME_CHOICE_KEY) || '{}');
                choices[actorId] = isUsingUserBubble;
                localStorage.setItem(THEME_CHOICE_KEY, JSON.stringify(choices));
        } catch (error) {
                console.error('Failed to save actor theme choice:', error);
        }
}

// 初始化时保存原始主题色
export function saveOriginalTheme() {
        const currentTheme = getCurrentThemeColors();

        if (currentTheme) {
                originalTheme.primary = currentTheme.primary;
                originalTheme.text = currentTheme.text;
                originalTheme.darker = currentTheme.darker;
                originalTheme.lighter = currentTheme.lighter;
        }

        console.log('Saved original theme:', originalTheme);
}// 恢复原始全局主题色
export function restoreOriginalTheme() {
        if (!originalTheme.primary) return;

        // 使用新的函数应用原始主题色
        const originalThemeColors = {
                primary: originalTheme.primary,
                text: originalTheme.text,
                darker: originalTheme.darker,
                lighter: originalTheme.lighter,
                glowShadow: '0 0 0 2px rgba(0, 0, 0, 0.2)', // 默认值
                primaryRgba20: 'rgba(0, 0, 0, 0.2)', // 默认值
                primaryRgba30: 'rgba(0, 0, 0, 0.3)', // 默认值
                primaryRgba50: 'rgba(0, 0, 0, 0.5)'  // 默认值
        };

        applyThemeColors(originalThemeColors);

        // 清除角色主题状态
        currentActorTheme.actorId = null;
        currentActorTheme.bubbleStyle = null;

        console.log('Restored original theme');
}

// 应用角色主题色
export async function applyActorTheme(actorId, isUsingUserBubble = null, force = false) {
        try {
                // 如果没有明确指定主题选择，使用保存的用户选择
                if (isUsingUserBubble === null) {
                        isUsingUserBubble = getActorThemeChoice(actorId);
                }

                // 如果已经在使用这个角色的主题，并且不是强制更新，则跳过
                if (!force && currentActorTheme.actorId === actorId && currentActorTheme.isUsingUserBubble === isUsingUserBubble) {
                        console.log('Actor theme already applied for', actorId);
                        return currentActorTheme.bubbleStyle;
                }

                const bubbleStyle = await getActorBubbleStyle(actorId);

                // 更新当前角色主题状态
                currentActorTheme.actorId = actorId;
                currentActorTheme.bubbleStyle = bubbleStyle;
                currentActorTheme.isUsingUserBubble = isUsingUserBubble;

                // 使用新的函数创建和应用主题色
                const themeColors = createBubbleThemeColors(bubbleStyle, isUsingUserBubble);
                if (themeColors) {
                        applyThemeColors(themeColors);

                        // 同时设置气泡样式CSS变量
                        const root = document.documentElement;
                        root.style.setProperty('--char-bubble-bg', bubbleStyle.charBubbleBg);
                        root.style.setProperty('--char-bubble-text', bubbleStyle.charBubbleText);
                        root.style.setProperty('--user-bubble-bg', bubbleStyle.userBubbleBg);
                        root.style.setProperty('--user-bubble-text', bubbleStyle.userBubbleText);
                }

                console.log('Applied actor theme for', actorId, 'using', isUsingUserBubble ? 'user' : 'char', 'bubble color');

                return bubbleStyle;
        } catch (error) {
                console.error('Failed to apply actor theme:', error);
                return null;
        }
}// 切换当前角色的主题色（用户气泡色 ↔ 角色气泡色）
export function toggleActorTheme() {
        if (!currentActorTheme.bubbleStyle || !currentActorTheme.actorId) return false;

        const newIsUsingUserBubble = !currentActorTheme.isUsingUserBubble;
        currentActorTheme.isUsingUserBubble = newIsUsingUserBubble;

        // 保存用户的选择
        saveActorThemeChoice(currentActorTheme.actorId, newIsUsingUserBubble);

        // 使用新的函数创建和应用主题色
        const themeColors = createBubbleThemeColors(currentActorTheme.bubbleStyle, newIsUsingUserBubble);
        if (themeColors) {
                applyThemeColors(themeColors);
        }

        console.log('Toggled actor theme to', newIsUsingUserBubble ? 'user' : 'char', 'bubble color');
        return newIsUsingUserBubble;
}

// 获取当前角色主题状态
export function getCurrentActorTheme() {
        return { ...currentActorTheme };
}

// 检查是否当前正在使用角色主题
export function isUsingActorTheme(actorId) {
        return currentActorTheme.actorId === actorId;
}

// 获取当前主题的详细信息
export function getCurrentThemeInfo() {
        const currentThemeColors = getCurrentThemeColors();

        return {
                ...currentThemeColors,
                isUsingActorTheme: currentActorTheme.actorId !== null,
                currentActorId: currentActorTheme.actorId,
                isUsingUserBubble: currentActorTheme.isUsingUserBubble,
                originalTheme: { ...originalTheme }
        };
}

// 初始化主题系统（在应用启动时调用）
export function initializeThemeSystem() {
        // 确保保存了原始主题
        if (!originalTheme.primary) {
                saveOriginalTheme();
        }

        console.log('Theme system initialized');
}

// 在页面初始化时调用，确保保存原始主题
if (typeof window !== 'undefined') {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initializeThemeSystem);
        } else {
                initializeThemeSystem();
        }
}
