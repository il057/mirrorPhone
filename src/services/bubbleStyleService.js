import db from './database.js';

/**
 * 气泡样式服务
 * 负责管理和应用聊天气泡的样式
 */

// 默认气泡样式
export const DEFAULT_BUBBLE_STYLE = {
        charBubbleBg: '#f0f0f0',
        charBubbleText: '#333333',
        userBubbleBg: '#007aff',
        userBubbleText: '#ffffff'
};

// 获取全局气泡样式预设
export async function getBubbleStylePresets() {
        try {
                const settings = await db.globalSettings.get('global');
                return settings?.bubbleStylePresets || [];
        } catch (error) {
                console.error('Failed to load bubble style presets:', error);
                return [];
        }
}

// 根据预设名称获取气泡样式
export async function getBubbleStyleByName(presetName) {
        if (!presetName) return DEFAULT_BUBBLE_STYLE;
        
        try {
                const presets = await getBubbleStylePresets();
                const preset = presets.find(p => p.name === presetName);
                return preset || DEFAULT_BUBBLE_STYLE;
        } catch (error) {
                console.error('Failed to get bubble style by name:', error);
                return DEFAULT_BUBBLE_STYLE;
        }
}

// 获取角色的气泡样式
export async function getActorBubbleStyle(actorId) {
        if (!actorId) return DEFAULT_BUBBLE_STYLE;
        
        try {
                const actor = await db.actors.get(actorId);
                if (actor && actor.bubbleStylePreset) {
                        return await getBubbleStyleByName(actor.bubbleStylePreset);
                }
                return DEFAULT_BUBBLE_STYLE;
        } catch (error) {
                console.error('Failed to get actor bubble style:', error);
                return DEFAULT_BUBBLE_STYLE;
        }
}

// 应用气泡样式到DOM元素
export function applyBubbleStyles(bubbleStyle) {
        if (!bubbleStyle) return;
        
        const root = document.documentElement;
        
        // 设置CSS自定义属性
        root.style.setProperty('--char-bubble-bg', bubbleStyle.charBubbleBg);
        root.style.setProperty('--char-bubble-text', bubbleStyle.charBubbleText);
        root.style.setProperty('--user-bubble-bg', bubbleStyle.userBubbleBg);
        root.style.setProperty('--user-bubble-text', bubbleStyle.userBubbleText);
}

// 应用角色气泡样式作为主题色（用于profile、chatroom等界面）
export function applyBubbleStyleAsTheme(bubbleStyle) {
        if (!bubbleStyle) return;
        
        const root = document.documentElement;
        
        // 使用角色气泡背景色作为主题色
        root.style.setProperty('--accent-primary', bubbleStyle.charBubbleBg);
        // 使用角色气泡文字色作为对比色
        root.style.setProperty('--accent-text', bubbleStyle.charBubbleText);
        
        // 也设置气泡样式
        applyBubbleStyles(bubbleStyle);
}

// 重置气泡样式为默认
export function resetBubbleStyles() {
        applyBubbleStyles(DEFAULT_BUBBLE_STYLE);
}

// 保存气泡样式预设到数据库
export async function saveBubbleStylePresets(presets) {
        try {
                const settings = await db.globalSettings.get('global') || { id: 'global' };
                // 创建一个简单的副本以避免Dexie克隆错误
                settings.bubbleStylePresets = JSON.parse(JSON.stringify(presets));
                await db.globalSettings.put(settings);
                return true;
        } catch (error) {
                console.error('Failed to save bubble style presets:', error);
                return false;
        }
}

// 创建预设默认气泡样式
export async function initializeDefaultBubbleStyles() {
        const presets = await getBubbleStylePresets();
        if (presets.length === 0) {
                const defaultPresets = [
                        {
                                name: '默认',
                                charBubbleBg: '#f0f0f0',
                                charBubbleText: '#333333',
                                userBubbleBg: '#007aff',
                                userBubbleText: '#ffffff',
                                isDefault: true
                        },
                        {
                                name: '深色',
                                charBubbleBg: '#2c2c2e',
                                charBubbleText: '#ffffff',
                                userBubbleBg: '#0a84ff',
                                userBubbleText: '#ffffff',
                                isDefault: true
                        },
                        {
                                name: '粉色',
                                charBubbleBg: '#ffe4e1',
                                charBubbleText: '#8b4513',
                                userBubbleBg: '#ff69b4',
                                userBubbleText: '#ffffff',
                                isDefault: true
                        },
                        {
                                name: '绿色',
                                charBubbleBg: '#e8f5e8',
                                charBubbleText: '#2e7d32',
                                userBubbleBg: '#4caf50',
                                userBubbleText: '#ffffff',
                                isDefault: true
                        }
                ];
                await saveBubbleStylePresets(defaultPresets);
                return defaultPresets;
        }
        return presets;
}
