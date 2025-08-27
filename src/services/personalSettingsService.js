// 个人设置服务
import db, { initializeGlobalSettings } from './database.js';

/**
 * 获取个人设置
 * @returns {Promise<Object>} 个人设置对象
 */
export const getPersonalSettings = async () => {
        try {
                // 确保全局设置已初始化
                await initializeGlobalSettings();
                
                const globalSettings = await db.globalSettings.get('global');
                
                const defaultSettings = {
                        typingSimulation: {
                                enabled: true,
                                speed: 5 // 默认中等速度
                        },
                        voiceToText: {
                                enabled: false
                        },
                        offlineSimulation: {
                                enabled: false
                        }
                };
                
                return globalSettings?.personalSettings || defaultSettings;
        } catch (error) {
                console.error('获取个人设置失败:', error);
                return {
                        typingSimulation: {
                                enabled: true,
                                speed: 5
                        },
                        voiceToText: {
                                enabled: false
                        },
                        offlineSimulation: {
                                enabled: false
                        }
                };
        }
};

/**
 * 保存个人设置
 * @param {Object} settings 要保存的设置
 * @returns {Promise<boolean>} 是否保存成功
 */
export const savePersonalSettings = async (settings) => {
        try {
                // 确保全局设置已初始化
                await initializeGlobalSettings();
                
                // 获取现有的全局设置或创建新的
                let globalSettings = await db.globalSettings.get('global');
                if (!globalSettings) {
                        globalSettings = { id: 'global' };
                }
                
                // 更新个人设置 - 深拷贝以移除 Vue 的 reactive/Proxy，避免 IndexedDB 结构克隆错误
                const safeSettings = JSON.parse(JSON.stringify(settings));
                globalSettings.personalSettings = safeSettings;
                
                console.log('Saving personal settings:', globalSettings);
                
                // 保存到数据库
                await db.globalSettings.put(globalSettings);
                
                console.log('Personal settings saved successfully');
                return true;
        } catch (error) {
                console.error('保存个人设置失败:', error);
                return false;
        }
};

/**
 * 根据打字速度设置计算延迟时间
 * @param {number} speed 打字速度 (1-10)
 * @returns {Object} 包含各种延迟时间的对象
 */
export const getTypingDelayConfig = (speed) => {
        // 速度映射：1=最慢，10=最快
        const baseDelay = 200; // 基础延迟（毫秒）
        const speedMultiplier = 1.2 - (speed / 10); // 速度越快，延迟越短
        
        return {
                characterDelay: Math.max(20, baseDelay * speedMultiplier), // 字符间延迟
                pinyinStepDelay: Math.max(10, (baseDelay * speedMultiplier) / 3), // 拼音步骤延迟
                wordPauseDelay: Math.max(50, baseDelay * speedMultiplier * 1.5), // 词语间停顿
                sentencePauseDelay: Math.max(100, baseDelay * speedMultiplier * 2), // 句子间停顿
        };
};

/**
 * 生成随机的消息间隔时间（当关闭打字模拟时使用）
 * @param {number} messageLength 消息长度
 * @returns {number} 延迟时间（毫秒）
 */
export const getRandomMessageDelay = (messageLength) => {
        // 基于消息长度的基础延迟：每个字符约10-30毫秒
        const baseDelay = messageLength * (10 + Math.random() * 20);
        // 添加随机变化：±50%
        const variation = 0.5;
        const randomFactor = 1 + (Math.random() - 0.5) * variation;
        
        return Math.max(500, Math.min(5000, baseDelay * randomFactor)); // 最小0.5秒，最大5秒
};
