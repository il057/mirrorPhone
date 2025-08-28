// src/services/voiceMessageService.js
import { generateSpeech, createAudioBlobUrl } from './elevenLabsService.js';
import { uploadToCloudinary } from './cloudinaryService.js';
import db from './database.js';

/**
 * 语音消息服务
 * 处理角色发送语音消息的逻辑
 */

/**
 * 生成角色语音消息
 * @param {Object} actor - 角色对象
 * @param {string} text - 要转换的文本
 * @param {Object} options - 可选配置
 * @returns {Promise<Object>} 语音消息结果
 */
export async function generateVoiceMessage(actor, text, options = {}) {
        try {
                // 验证参数
                if (!actor || typeof actor !== 'object') {
                        return {
                                success: false,
                                error: '角色参数无效'
                        };
                }

                // 检查角色是否配置了声音
                if (!actor.ttsProfileId || !actor.voiceId) {
                        return {
                                success: false,
                                error: '角色未配置语音设置'
                        };
                }

                // 获取TTS配置
                const ttsProfile = await db.ttsProfiles.get(actor.ttsProfileId);
                if (!ttsProfile || !ttsProfile.apiKey) {
                        return {
                                success: false,
                                error: 'TTS配置无效或API密钥缺失'
                        };
                }

                // 处理文本，支持 Eleven v3 的标签和格式
                const processedText = processTextForElevenV3(text);

                // 生成语音
                const audioData = await generateSpeech(
                        ttsProfile.apiKey,
                        actor.voiceId,
                        processedText,
                        {
                                stability: options.stability || 0.6, // Natural模式
                                similarityBoost: options.similarityBoost || 0.8,
                                style: options.style || 0.0,
                                useSpeakerBoost: options.useSpeakerBoost !== false
                        }
                );

                // 创建临时 Blob URL
                const tempBlobUrl = createAudioBlobUrl(audioData);

                // 尝试上传到 Cloudinary（如果配置了）
                let permanentUrl = null;
                const globalSettings = await db.globalSettings.get('global');
                
                if (globalSettings?.cloudinaryCloudName && globalSettings?.cloudinaryUploadPreset) {
                        try {
                                // 将 ArrayBuffer 转换为 File 对象
                                const audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
                                const audioFile = new File([audioBlob], `voice_${Date.now()}.mp3`, { 
                                        type: 'audio/mpeg' 
                                });

                                permanentUrl = await uploadToCloudinary(
                                        audioFile,
                                        globalSettings.cloudinaryCloudName,
                                        globalSettings.cloudinaryUploadPreset,
                                        { resource_type: 'auto' }
                                );
                        } catch (uploadError) {
                                console.warn('上传到 Cloudinary 失败:', uploadError);
                                // 继续使用本地 Blob URL
                        }
                }

                return {
                        success: true,
                        audioUrl: permanentUrl || tempBlobUrl,
                        duration: estimateAudioDuration(text), // 估算时长
                        text: text, // 保留原始文本用于显示
                        processedText: processedText, // 保留处理后的文本用于调试
                        isPermanent: !!permanentUrl,
                        actorId: actor.id,
                        timestamp: Date.now()
                };

        } catch (error) {
                console.error('生成语音消息失败:', error);
                return {
                        success: false,
                        error: error.message || '语音生成失败'
                };
        }
}

/**
 * 处理文本以优化 Eleven v3 效果
 * @param {string} text - 原始文本
 * @returns {string} 处理后的文本
 */
function processTextForElevenV3(text) {
        if (!text || typeof text !== 'string') {
                return text;
        }

        let processed = text;

        // 处理中文情感标签（AI生成的标签）
        const emotionTagMap = {
                '[笑]': '[laughs]',
                '[叹气]': '[sighs]',
                '[耳语]': '[whispers]',
                '[兴奋]': '[excited]',
                '[惊讶]': '[surprised]',
                '[失望]': '[disappointed]',
                '[温柔]': '[gentle]',
                '[严肃]': '[serious]',
                '[调皮]': '[playful]',
                '[害羞]': '[shy]',
                '[生气]': '[angry]',
                '[悲伤]': '[sad]',
                '[开心]': '[happy]',
                '[紧张]': '[nervous]',
                '[放松]': '[relaxed]',
                '[疑惑]': '[confused]',
                '[肯定]': '[confident]',
                '[否定]': '[denying]',
                '[思考]': '[thinking]',
                '[赞同]': '[agreeing]'
        };

        // 替换中文情感标签为英文标签
        for (const [chineseTag, englishTag] of Object.entries(emotionTagMap)) {
                processed = processed.replace(new RegExp(chineseTag.replace(/[\[\]]/g, '\\$&'), 'g'), englishTag);
        }

        // 检测并自动优化常见表情和语气（如果没有手动标签）
        if (!processed.includes('[')) { // 只在没有手动标签时进行自动检测
                processed = processed
                        // 笑声相关
                        .replace(/哈哈哈+/g, '[laughs]')
                        .replace(/呵呵+/g, '[laughs]')
                        .replace(/嘿嘿+/g, '[laughs]')
                        .replace(/嘻嘻+/g, '[laughs]')
                        
                        // 叹气相关
                        .replace(/唉+/g, '[sighs]')
                        .replace(/哎+/g, '[sighs]')
                        
                        // 小声说话
                        .replace(/\(小声说\)|（小声说）/g, '[whispers]')
                        .replace(/\(悄悄话\)|（悄悄话）/g, '[whispers]')
                        
                        // 兴奋相关
                        .replace(/哇+!/g, '[excited] 哇!')
                        .replace(/太棒了!/g, '[excited] 太棒了!')
                        .replace(/太好了!/g, '[excited] 太好了!')
                        .replace(/真的吗！/g, '[excited] 真的吗!')
                        
                        // 好奇/疑问相关
                        .replace(/\?{2,}/g, '[confused] ?')
                        .replace(/咦[？?]*/g, '[confused] 咦?')
                        .replace(/嗯[？?]+/g, '[confused] 嗯?')
                        
                        // 温柔相关
                        .replace(/亲爱的/g, '[gentle] 亲爱的')
                        .replace(/宝贝/g, '[gentle] 宝贝')
                        
                        // 害羞相关
                        .replace(/不好意思/g, '[shy] 不好意思')
                        .replace(/有点尴尬/g, '[shy] 有点尴尬')
                        
                        // 生气相关
                        .replace(/哼!/g, '[angry] 哼!')
                        .replace(/讨厌/g, '[angry] 讨厌')
                        
                        // 思考相关
                        .replace(/让我想想/g, '[thinking] 让我想想')
                        .replace(/嗯……/g, '[thinking] 嗯……');
        }

        // 添加适当的停顿和自然语音效果
        processed = processed
                .replace(/[。！？]/g, '$&…')
                .replace(/，/g, '，…')
                .replace(/……+/g, '……'); // 统一省略号

        // 强调大写（保持中文，但英文单词转换）
        processed = processed.replace(/\b[A-Z]{2,}\b/g, match => `${match}`);

        // 确保文本长度适合 v3（建议 >150 字符以获得更好效果）
        if (processed.length < 150 && processed.length > 0) {
                // 对于较短的文本，添加自然的开场
                const naturalPrefixes = [
                        '[gentle] 嗯…… ',
                        '[thinking] 让我想想…… ',
                        '[happy] 好的…… ',
                        '[gentle] 这样啊…… ',
                        '[thinking] 我觉得…… ',
                        '[gentle] 其实…… ',
                        '[relaxed] 说起来…… '
                ];
                const randomPrefix = naturalPrefixes[Math.floor(Math.random() * naturalPrefixes.length)];
                processed = randomPrefix + processed;
        }

        // 清理多余的空格和格式
        processed = processed
                .replace(/\s+/g, ' ')
                .replace(/\[\s*([a-z]+)\s*\]/g, '[$1]') // 清理标签内的空格
                .trim();

        return processed;
}

/**
 * 估算音频时长（基于文本长度）
 * @param {string} text - 文本内容
 * @returns {number} 估算时长（秒）
 */
function estimateAudioDuration(text) {
        if (!text) return 0;
        
        // 中文约 3-4 字符/秒，英文约 15-20 字符/秒
        // 这里取保守估计
        const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
        const englishChars = text.length - chineseChars;
        
        const chineseDuration = chineseChars / 3.5;
        const englishDuration = englishChars / 17.5;
        
        return Math.max(1, Math.round(chineseDuration + englishDuration));
}

/**
 * 清理临时音频 URL
 * @param {string} url - 要清理的 URL
 */
export function cleanupAudioUrl(url) {
        if (url && url.startsWith('blob:')) {
                URL.revokeObjectURL(url);
        }
}

/**
 * 检查角色是否可以发送语音消息
 * @param {string|Object} actorIdOrObject - 角色ID或角色对象
 * @returns {Promise<boolean>} 是否可以发送语音消息
 */
export async function canSendVoiceMessage(actorIdOrObject) {
        try {
                let actor;
                if (typeof actorIdOrObject === 'string') {
                        actor = await db.actors.get(actorIdOrObject);
                } else if (typeof actorIdOrObject === 'object' && actorIdOrObject.id) {
                        actor = actorIdOrObject;
                } else {
                        return false;
                }

                if (!actor || !actor.ttsProfileId || !actor.voiceId) {
                        return false;
                }

                const ttsProfile = await db.ttsProfiles.get(actor.ttsProfileId);
                return !!(ttsProfile && ttsProfile.apiKey);
        } catch {
                return false;
        }
}
