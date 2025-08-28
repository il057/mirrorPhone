/**
 * AI 聊天 API 服务
 * 专门处理聊天室的AI回复生成、关系管理和记忆更新
 */

import db from './database.js';
import { calculateVoiceDuration } from './personalSettingsService.js';
import spotifyService from './spotifyService.js';
import { showToast } from './uiService.js';
import { createPost as createMomentPost, likePost as likeMomentPost, commentOnPost as commentOnMomentPost } from './momentsService.js';
import { formatTimestamp } from '../utils/datetime.js';
import { showLocalNotification } from './notificationService'; 
import { isCurrentChatRoom } from './currentStateService.js';
import { getDefaultUserPersona, getEffectiveUserPersonaId } from './userPersonaService.js';
import * as promptBuilder from './promptBuilder.js';
/**
 * 调用AI API生成回复
 * @param {Object} profile - API配置档案
 * @param {Array} messages - 消息历史记录
 * @param {Object} character - 角色信息
 * @param {Object} context - 上下文信息（记忆、关系等）
 * @returns {Promise<Object>} API响应结果
 */
export async function callAIAPI(profile, messages, character, context) {
    if (!profile || !profile.apiKey) {
        throw new Error('API配置未找到或API密钥为空');
    }

    let apiUrl;
    let requestHeaders = {
        'Content-Type': 'application/json'
    };
    let requestBody;

    // 根据连接方式配置URL和请求头
    if (profile.connectionType === 'direct') {
        // Gemini 直连方式
        apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${profile.model}:generateContent?key=${profile.apiKey}`;
        
        // Gemini API 使用不同的消息格式
        requestBody = {
            contents: messages.map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            })),
            generationConfig: {
                temperature: 0.9,
                candidateCount: 1,
                                response_mime_type: "application/json"

            }
        };
    } else {
        // 反代方式 (兼容OpenAI格式)
        if (!profile.apiUrl || !profile.apiUrl.trim()) {
            throw new Error('反向代理地址不能为空');
        }
        
        const cleanBaseUrl = profile.apiUrl.trim().endsWith('/')
            ? profile.apiUrl.trim().slice(0, -1)
            : profile.apiUrl.trim();

        apiUrl = `${cleanBaseUrl}/v1/chat/completions`;
        requestHeaders['Authorization'] = `Bearer ${profile.apiKey}`;
        
        requestBody = {
            model: profile.model,
            messages: messages,
            temperature: 0.9,
            stream: false,
            response_format: { type: "json_object" }
        };
    }

    const fetchOptions = {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(requestBody)
    };

    try {
        const response = await fetch(apiUrl, fetchOptions);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error?.message || `HTTP 错误, 状态码: ${response.status}`;
            throw new Error(errorMessage);
        }

        const data = await response.json();
        
        // 根据API类型解析响应
        if (profile.connectionType === 'direct') {
            // Gemini 响应格式
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                return {
                    content: data.candidates[0].content.parts[0].text,
                    finishReason: data.candidates[0].finishReason
                };
            } else {
                throw new Error('Gemini API 返回格式异常');
            }
        } else {
            // OpenAI 兼容格式
            if (data.choices && data.choices[0] && data.choices[0].message) {
                return {
                    content: data.choices[0].message.content,
                    finishReason: data.choices[0].finish_reason
                };
            } else {
                throw new Error('API 返回格式异常');
            }
        }
    } catch (error) {
        console.error('AI API 调用失败:', error);
        throw error;
    }
}

/**
 * 从AI返回的内容中提取和解析JSON
 * @param {string} content - AI返回的原始内容
 * @returns {Object} 解析后的结构化数据
 */
export function extractAndParseJson(content) {
    try {
        console.log('extractAndParseJson', content);
        // 清理字符串，移除可能的 BOM 和控制字符
        let cleanContent = content.replace(/[\u0000-\u001F\u007F-\u009F\uFEFF]/g, '').trim();
        
        // 先尝试直接解析整个内容
        try {
            const directParse = JSON.parse(cleanContent);
            return validateAIResponse(directParse);
        } catch (e) {
            // 如果直接解析失败，尝试提取JSON代码块
            const jsonMatch = cleanContent.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                try {
                    const parsed = JSON.parse(jsonMatch[1]);
                    return validateAIResponse(parsed);
                } catch (e2) {
                    console.warn('JSON代码块解析失败:', e2);
                }
            }

            // 尝试找到第一个 { 到最后一个 } 的内容
            const firstBrace = cleanContent.indexOf('{');
            const lastBrace = cleanContent.lastIndexOf('}');
            
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                try {
                    const jsonContent = cleanContent.substring(firstBrace, lastBrace + 1);
                    const parsed = JSON.parse(jsonContent);
                    return validateAIResponse(parsed);
                } catch (e3) {
                    console.warn('大括号提取解析失败:', e3);
                }
            }

            // 如果所有JSON解析都失败，抛出错误让上层处理
            console.warn('无法解析AI返回的JSON');
            throw new Error('AI回复格式解析失败，请重试');
        }
    } catch (error) {
        console.error('JSON解析完全失败:', error);
        throw new Error('AI回复格式解析失败，请重试');
    }
}

/**
 * 验证和标准化AI响应格式
 * @param {Object} response - 解析后的响应对象
 * @returns {Object} 标准化后的响应对象
 */
function validateAIResponse(response) {
    const normalized = {
        messages: [],
        relationship: null,
        status: null
    };

    // 处理多种可能的响应格式
    if (response.messages && Array.isArray(response.messages)) {
        // 格式1：新的多消息格式 {"messages": [...], "relationship": {...}, "status": {...}}
        normalized.messages = response.messages;
        normalized.relationship = response.relationship || null;
        normalized.status = response.status || null;
    } else if (response.message && response.relationship !== undefined) {
        // 格式2：单消息格式 {"message": {...}, "relationship": {...}, "status": {...}}
        normalized.messages = [response.message];
        normalized.relationship = response.relationship;
        normalized.status = response.status || null;
    } else if (response.message) {
        // 格式3：只有message字段
        normalized.messages = [response.message];
        normalized.relationship = null;
        normalized.status = response.status || null;
    } else if (response.status && !response.message && !response.messages) {
        // 格式4：仅状态更新格式 {"relationship": {...}, "status": {...}}
        normalized.messages = [];
        normalized.relationship = response.relationship || null;
        normalized.status = response.status;
    } else if (response.type) {
        // 格式5：直接是消息对象（兼容旧格式）
        normalized.messages = [response];
        normalized.relationship = null;
        normalized.status = null;
    } else if (typeof response === 'string') {
        // 格式6：纯字符串回复
        normalized.messages = [{
            type: 'text',
            content: response
        }];
        normalized.relationship = null;
    } else {
        // 未知格式，尝试转换为文本
        console.warn('未知的AI响应格式:', response);
        normalized.messages = [{
            type: 'text',
            content: JSON.stringify(response)
        }];
        normalized.relationship = null;
    }

    // 确保每个消息对象都有必要的字段，并验证type
    normalized.messages = normalized.messages.map((msg, index) => {
        if (typeof msg === 'string') {
            return { type: 'text', content: msg };
        }
        
        const validatedMsg = {
            type: msg.type || 'text',
            content: msg.content || '',
            ...msg // 保留其他所有字段
        };
        
        // 验证type是否有效
        if (!isValidMessageType(validatedMsg.type)) {
            console.warn(`第${index + 1}条消息类型无效: ${validatedMsg.type}`);
            // 将无效类型转为文本消息，并添加错误标记
            return {
                type: 'text',
                content: validatedMsg.content || `[未知操作: ${validatedMsg.type}]`,
                isInvalidType: true,
                originalType: validatedMsg.type
            };
        }
        
        // 特殊字段验证
        if (validatedMsg.type === 'voice' && !validatedMsg.content) {
            console.warn(`第${index + 1}条语音消息缺少content字段`);
            validatedMsg.content = '语音消息内容为空';
        }
        
        return validatedMsg;
    });

    console.log('AI响应验证结果:', {
        originalFormat: Object.keys(response),
        messagesCount: normalized.messages.length,
        hasRelationship: !!normalized.relationship,
        hasStatus: !!normalized.status
    });

    return normalized;
}

/**
 * 验证消息类型是否有效
 * @param {string} type - 消息类型
 * @returns {boolean} 是否有效
 */
function isValidMessageType(type) {
    const validTypes = [
        'text', 'send_sticker', 'voice', 'send_photo', 
        'transfer', 'payment', 'initiate_voice_call', 'initiate_video_call',
        'update_signature', 'change_avatar', 'update_name', 
        'set_background', 'create_listen_together_invite', 'share_music',
        'respond_to_transfer', 'payment_response', 'respond_to_call',
        'spotify_toggle_play', 'spotify_next_track', 'spotify_previous_track',
        'accept_listen_together', 'decline_listen_together', 'pat_user',
        'create_post', 'like_post', 'comment_on_post', 'quote_reply'
    ];
    
    return validTypes.includes(type);
}

/**
 * 构建AI对话的消息历史
 * @param {string} characterId - 角色ID
 * @param {string} userId - 用户ID
 * @param {string} newUserMessage - 用户的新消息
 * @returns {Promise<Array>} 格式化的消息历史
 */
export async function buildMessageHistory(characterId, userId, newUserMessage) {
    try {
        // 获取角色信息
        const character = await db.actors.get(characterId);
        if (!character) {
            throw new Error('角色不存在');
        }

        // 获取角色的上下文记忆设置
        const contextSettings = character.contextMemorySettings || {
            privateChat: 50,
            memory: 2,
            diary: 2,
            recall: 3,
            moments: 3
        };

        // 获取最近的对话记录
        const recentEvents = await db.events
            .where('contextId').equals(characterId)
            .and(event => event.type === 'privateMessage')
            .reverse()
            .limit(contextSettings.privateChat)
            .toArray();

        // 构建系统提示词（传入最近事件用于特殊任务检测）
        const systemPrompt = await buildSystemPrompt(character, userId, contextSettings, recentEvents);

        // 构建消息历史
        const messages = [
            { role: 'system', content: systemPrompt }
        ];

        // 添加历史消息（按时间正序）
        const sortedEvents = recentEvents.reverse();
        let lastTimeStamp = null;
        
        sortedEvents.forEach((event, index) => {
            // 检查是否需要添加时间戳（每5分钟一次）
            const currentTime = new Date(event.timestamp);
            let shouldAddTime = false;
            
            if (!lastTimeStamp) {
                shouldAddTime = true;
            } else {
                const timeDiff = (currentTime.getTime() - lastTimeStamp.getTime()) / (1000 * 60); // 分钟差
                if (timeDiff >= 5) {
                    shouldAddTime = true;
                }
            }
            
            // 检查是否为用户消息：所有存储为 __USER__ 的消息都是用户消息
            const isUser = event.actorId === '__USER__';
            let content = formatMessageForAI(event.content);
            
            // 如果需要添加时间戳，在消息前加上时间
            if (shouldAddTime) {
                const timeStr = currentTime.toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
                content = `${timeStr} ${content}`;
                lastTimeStamp = currentTime;
            }
            
            messages.push({
                role: isUser ? 'user' : 'assistant',
                content: content
            });
        });

        // 添加新的用户消息（可能包含引用）
        messages.push({
            role: 'user',
            content: formatUserMessageWithQuote(newUserMessage, recentEvents)
        });

        return messages;
    } catch (error) {
        console.error('构建消息历史失败:', error);
        throw error;
    }
}

/**
 * 通过文本内容查找消息
 * @param {string} characterId - 角色ID
 * @param {string} searchText - 要搜索的文本
 * @returns {Promise<Object|null>} 找到的消息对象或null
 */
async function findMessageByText(characterId, searchText) {
    try {
        // 获取最近的对话记录
        const recentEvents = await db.events
            .where('contextId').equals(characterId)
            .and(event => event.type === 'privateMessage')
            .reverse()
            .limit(contextSettings.privateChat) 
            .toArray();

        // 查找包含指定文本的消息
        for (const event of recentEvents) {
            const messageText = formatMessageForAI(event.content);
            if (messageText.includes(searchText)) {
                return event;
            }
        }

        return null;
    } catch (error) {
        console.error('查找引用消息失败:', error);
        return null;
    }
}

/**
 * 将消息内容格式化为AI可理解的格式
 * @param {Object} messageContent - 消息内容对象
 * @returns {string} 格式化后的消息内容
 */
function formatMessageForAI(messageContent) {
    if (!messageContent) return '';
    
    // 如果是简单的文本消息
    if (typeof messageContent === 'string') {
        return messageContent;
    }
    
    // 如果有直接的content字段
    if (messageContent.content && typeof messageContent.content === 'string') {
        return messageContent.content;
    }
    
    // 根据消息类型格式化
    switch (messageContent.type) {
        case 'text':
            return messageContent.content || '';
            
        case 'sticker':
            return `[表情包]: ${messageContent.name || messageContent.content}`;
            
        case 'image':
            if (messageContent.subtype === 'text') {
                return `[图片描述]: ${messageContent.description}`;
            } else {
                return `[图片]: ${messageContent.fileName || '用户发送了一张图片'}`;
            }
            
        case 'voice':
            return `[语音消息]: ${messageContent.text || messageContent.content}`;
            
        case 'payment':
            const paymentType = messageContent.subtype === 'transfer' ? '转账' : '代付';
            const amount = messageContent.amount || 0;
            const note = messageContent.message || messageContent.note || '';
            const product = messageContent.productInfo ? ` (${messageContent.productInfo})` : '';
            return `[${paymentType}]: ¥${amount}${product} - ${note}`;
            
        case 'listen-together-invite':
            const playlist = messageContent.playlist || {};
            const inviteMsg = messageContent.message || '';
            return `[一起听邀请]: 歌单《${playlist.name || '未知歌单'}》 - ${inviteMsg}`;
            
        case 'music-card':
            const song = messageContent.song || {};
            const shareMsg = messageContent.message || '';
            const artists = song.artists ? song.artists.map(a => a.name).join('、') : '未知歌手';
            return `[音乐分享]: 《${song.name || '未知歌曲'}》- ${artists} - ${shareMsg}`;
            
        case 'call':
            const callType = messageContent.callType === 'voice' ? '语音' : '视频';
            return `[${callType}通话]: ${messageContent.message || ''}`;
            
        case 'post':
            const postText = messageContent.text || '';
            const hasImages = messageContent.images && messageContent.images.length > 0;
            return `[发布动态]: ${postText}${hasImages ? ' [配图]' : ''}`;
            
        case 'like':
            return `[点赞]: ${messageContent.targetType === 'post' ? '动态' : '内容'}`;
            
        case 'comment':
            const commentText = messageContent.text || '';
            return `[评论]: ${commentText}`;
            
        case 'system':
            if (messageContent.systemType === 'post_created') {
                return `[系统]: 发布了一条新动态`;
            } else if (messageContent.systemType === 'post_liked') {
                return `[系统]: 点赞了一条动态`;
            } else if (messageContent.systemType === 'post_unliked') {
                return `[系统]: 取消点赞了一条动态`;
            } else if (messageContent.systemType === 'post_commented') {
                return `[系统]: 评论了一条动态`;
            }
            return `[系统]: ${messageContent.content || '系统消息'}`;
            
        default:
            // 默认返回内容
            return messageContent.content || messageContent.text || JSON.stringify(messageContent);
    }
}

/**
 * 格式化包含引用的用户消息
 * @param {string} userMessage - 用户的新消息
 * @param {Array} recentEvents - 最近的事件列表，用于查找引用的消息
 * @returns {string} 格式化后的消息内容
 */
function formatUserMessageWithQuote(userMessage, recentEvents) {
    // 尝试解析用户消息，看是否包含引用信息
    try {
        // 如果userMessage是JSON字符串且包含引用信息
        const parsed = JSON.parse(userMessage);
        if (parsed.quotedMessage && parsed.content) {
            const quotedContent = formatMessageForAI(parsed.quotedMessage.content);
            const quotedAuthor = parsed.quotedMessage.actorId === '__USER__' ? '用户' : '角色';
            return `[引用了${quotedAuthor}的消息: "${quotedContent}"]\n\n${parsed.content}`;
        }
    } catch (e) {
        // 不是JSON，继续处理为普通消息
    }
    
    // 普通消息直接返回
    return userMessage;
}

/**
 * 构建系统提示词
 * @param {Object} character - 角色信息
 * @param {string} userId - 用户人格ID（不是 __USER__）
 * @param {Object} contextSettings - 上下文设置
 * @param {Array} recentEvents - 最近的事件列表（用于检测特殊功能）
 * @returns {Promise<string>} 系统提示词
 */
async function buildSystemPrompt(character, userId, contextSettings, recentEvents = []) {
    return await promptBuilder.buildChatSystemPrompt(character, userId, contextSettings, recentEvents);
}

/**
 * 更新角色与用户的关系
 * @param {string} characterId - 角色ID
 * @param {string} userId - 用户人格ID（将被转换为__USER__）
 * @param {Object} relationshipChange - 关系变化数据
 */
export async function updateRelationship(characterId, userId, relationshipChange) {
    try {
        // 关系始终建立在__USER__和角色之间，不考虑具体的用户人格
        const targetUserId = '__USER__';
        
        const existing = await db.relationships
            .where('sourceId').equals(characterId)
            .and(rel => rel.targetId === targetUserId)
            .first();

        if (existing) {
            // 更新现有关系
            const updates = {};
            
            // 更新好感度
            if (relationshipChange.scoreChange) {
                const newScore = Math.max(-1000, Math.min(1000, 
                    existing.score + relationshipChange.scoreChange));
                updates.score = newScore;
            }

            // 更新关系类型
            if (relationshipChange.typeChange) {
                updates.type = relationshipChange.typeChange;
            }

            // 处理标签变化
            let currentTags = existing.tags || [];
            
            // 移除指定标签
            if (relationshipChange.removeTags && relationshipChange.removeTags.length > 0) {
                currentTags = currentTags.filter(tag => 
                    !relationshipChange.removeTags.includes(tag.name));
            }

            // 添加新标签
            if (relationshipChange.newTags && relationshipChange.newTags.length > 0) {
                for (const newTag of relationshipChange.newTags) {
                    // 检查是否已存在同名标签
                    const existingTagIndex = currentTags.findIndex(tag => tag.name === newTag.name);
                    
                    if (existingTagIndex !== -1) {
                        // 更新现有标签强度
                        currentTags[existingTagIndex].strength = newTag.strength;
                    } else {
                        // 添加新标签
                        currentTags.push({
                            name: newTag.name,
                            strength: newTag.strength
                        });
                    }
                }

                // 确保标签数量不超过10个，移除强度最低的标签
                if (currentTags.length > 10) {
                    currentTags.sort((a, b) => b.strength - a.strength);
                    currentTags = currentTags.slice(0, 10);
                }
            }

            updates.tags = currentTags;

            await db.relationships.update(existing.id, updates);
        } else {
            // 创建新关系
            const newRelationship = {
                sourceId: characterId,
                targetId: targetUserId,
                type: relationshipChange.typeChange || '朋友',
                score: relationshipChange.scoreChange || 0,
                tags: relationshipChange.newTags || []
            };

            // 确保标签格式正确
            if (newRelationship.tags.length > 10) {
                newRelationship.tags = newRelationship.tags.slice(0, 10);
            }

            await db.relationships.add(newRelationship);
        }
    } catch (error) {
        console.error('更新关系失败:', error);
        throw error;
    }
}

/**
 * 根据关键词获取相关记忆
 * @param {string} userId - 用户ID
 * @param {string} message - 用户消息
 * @param {string} characterId - 角色ID
 * @returns {Promise<Array>} 匹配的记忆列表
 */
async function getMemoriesByKeywords(userId, message, characterId) {
    try {
        // 获取用户的所有记忆
        const userMemories = await db.memories
            .where('actorId').equals(userId)
            .toArray();
        
        // 过滤与当前角色相关的记忆
        const relevantMemories = userMemories.filter(memory => 
            !memory.relatedActorId || memory.relatedActorId === characterId
        );
        
        // 简单的关键词匹配
        const matchedMemories = relevantMemories.filter(memory => {
            if (!memory.keywords || memory.keywords.length === 0) {
                return false;
            }
            
            // 检查消息中是否包含记忆的关键词
            const messageText = message.toLowerCase();
            return memory.keywords.some(keyword => 
                messageText.includes(keyword.toLowerCase())
            );
        });
        
        // 按时间戳排序，最新的在前
        return matchedMemories
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
            .slice(0, 3); // 最多返回3条相关记忆
    } catch (error) {
        console.error('获取关键词记忆失败:', error);
        return [];
    }
}

/**
 * 保存AI记忆
 * @param {string} characterId - 角色ID
 * @param {Object} memoryData - 记忆数据
 * @param {Array} relatedEventIds - 相关事件ID数组
 */
export async function saveAIMemory(characterId, memoryData, relatedEventIds = []) {
    try {
        // 用户内容始终保存在 __USER__ 下
        const userId = '__USER__';

        // 创建记忆对象
        const memory = {
            actorId: userId, // 记忆属于用户
            type: memoryData.type || 'fact',
            content: memoryData.content || memoryData.description,
            keywords: memoryData.keywords || [],
            timestamp: Date.now(),
            relatedActorId: characterId // 关联的角色ID
        };

        // 如果是日期类型的记忆，添加目标日期
        if (memoryData.type === 'date' && memoryData.targetDate) {
            memory.targetDate = new Date(memoryData.targetDate).toISOString();
        }

        // 保存到数据库
        const memoryId = await db.memories.add(memory);
        console.log('AI创建了新记忆:', memory);
        
        // 触发记忆更新事件
        window.dispatchEvent(new CustomEvent('memory-updated'));
        
        return memoryId;
    } catch (error) {
        console.error('保存AI记忆失败:', error);
        return null;
    }
}

/**
 * 处理AI消息并生成对应的事件
 * @param {Object} aiMessage - AI返回的消息对象
 * @param {string} characterId - 角色ID
 * @returns {Object} 格式化的事件对象
 */
export async function processAIMessage(aiMessage, characterId) {
    const baseEvent = {
        timestamp: Date.now(),
        actorId: characterId,
        contextId: characterId,
        type: 'privateMessage',
        content: {}
    };

    switch (aiMessage.type) {
        case 'text':
            baseEvent.content = {
                type: 'text',
                content: aiMessage.content
            };
            break;

        case 'quote_reply':
            // 通过文本匹配查找要引用的消息
            const quotedMessage = await findMessageByText(characterId, aiMessage.quote_text);
            if (quotedMessage) {
                baseEvent.content = {
                    type: 'text',
                    content: aiMessage.reply_content,
                    quotedMessage: {
                        timestamp: quotedMessage.timestamp,
                        content: quotedMessage.content,
                        actorId: quotedMessage.actorId
                    }
                };
            } else {
                // 如果找不到引用的消息，就发送普通文本
                baseEvent.content = {
                    type: 'text',
                    content: `[引用: "${aiMessage.quote_text}"] ${aiMessage.reply_content}`
                };
            }
            break;

        case 'send_sticker':
            // 根据表情包名称查找
            const sticker = await db.stickers.where('name').equals(aiMessage.name).first();
            if (sticker) {
                baseEvent.content = {
                    type: 'sticker',
                    url: sticker.url,
                    name: sticker.name
                };
            } else {
                // 如果找不到表情包，转为文本消息
                baseEvent.content = {
                    type: 'text',
                    content: `[表情]: ${aiMessage.name}`
                };
            }
            break;

        case 'voice':
            const duration = calculateVoiceDuration(aiMessage.content);
            baseEvent.content = {
                type: 'voice',
                text: aiMessage.content,
                duration: duration
            };
            break;

        case 'send_photo':
            baseEvent.content = {
                type: 'image',
                subtype: 'text',
                description: aiMessage.description
            };
            break;

        case 'transfer':
            baseEvent.content = {
                type: 'payment',
                subtype: 'transfer',
                amount: Math.min(Math.max(aiMessage.amount || 10, 1), 999),
                message: aiMessage.note || '转账'
            };
            break;

        case 'payment':
            baseEvent.content = {
                type: 'payment',
                subtype: 'pay',
                amount: Math.min(Math.max(aiMessage.amount || 10, 1), 999),
                message: '代付请求',
                productInfo: aiMessage.productInfo || '商品'
            };
            break;

        case 'initiate_voice_call':
            baseEvent.content = {
                type: 'call',
                callType: 'voice',
                message: '发起语音通话'
            };
            break;

        case 'initiate_video_call':
            baseEvent.content = {
                type: 'call',
                callType: 'video',
                message: '发起视频通话'
            };
            break;

        case 'update_signature':
            await updateCharacterSignature(characterId, aiMessage.signature);
            baseEvent.actorId = 'system';
            baseEvent.content = {
                type: 'system',
                content: `更新了签名：${aiMessage.signature}`,
                isVisible: true,
                systemType: 'signature_update'
            };
            break;

        case 'change_avatar':
            await updateCharacterAvatar(characterId, aiMessage.name);
            baseEvent.actorId = 'system';
            baseEvent.content = {
                type: 'system',
                content: `更换了头像`,
                isVisible: true,
                systemType: 'avatar_update'
            };
            break;

        case 'update_name':
            await updateCharacterName(characterId, aiMessage.name);
            baseEvent.actorId = 'system';
            baseEvent.content = {
                type: 'system',
                content: `将昵称改为：${aiMessage.name}`,
                isVisible: true,
                systemType: 'name_update'
            };
            break;

        case 'set_background':
            await updateCharacterBackground(characterId, aiMessage.description);
            baseEvent.actorId = 'system';
            baseEvent.content = {
                type: 'system',
                content: `设置了新的背景`,
                isVisible: true,
                systemType: 'background_update'
            };
            break;

        // 音乐相关功能
        case 'create_listen_together_invite':
            return await processListenTogetherInvite(aiMessage, baseEvent);
            
        case 'share_music':
            return await processMusicShare(aiMessage, baseEvent);

        // 转账和代付响应
        case 'respond_to_transfer':
            baseEvent.content = {
                type: 'payment_response',
                decision: aiMessage.decision,
                targetTimestamp: aiMessage.target_timestamp,
                responseType: 'transfer'
            };
            break;

        case 'payment_response':
            baseEvent.content = {
                type: 'payment_response',
                decision: aiMessage.decision,
                targetTimestamp: aiMessage.target_timestamp,
                responseType: 'waimai'
            };
            break;

        // 通话响应
        case 'respond_to_call':
            baseEvent.content = {
                type: 'call_response',
                decision: aiMessage.decision,
                reason: aiMessage.reason || null
            };
            break;

        // 音乐控制
        case 'spotify_toggle_play':
        case 'spotify_next_track':
        case 'spotify_previous_track':
            // 检查Spotify登录状态
            if (!spotifyService.isLoggedIn()) {
                showToast('需要先连接Spotify才能控制音乐', 'error');
                baseEvent.content = {
                    type: 'system',
                    content: '抱歉，需要连接Spotify才能控制音乐播放',
                    isVisible: true,
                    systemType: 'error'
                };
                break;
            }

            try {
                let actionMessage = '';
                switch (aiMessage.type) {
                    case 'spotify_toggle_play':
                        const currentPlayback = await spotifyService.getCurrentPlayback();
                        if (currentPlayback && currentPlayback.is_playing) {
                            await spotifyService.pausePlayback();
                            actionMessage = '已暂停播放';
                        } else {
                            await spotifyService.resumePlayback();
                            actionMessage = '已继续播放';
                        }
                        break;
                    case 'spotify_next_track':
                        await spotifyService.apiRequest('/me/player/next', { method: 'POST' });
                        actionMessage = '已切换到下一首';
                        break;
                    case 'spotify_previous_track':
                        await spotifyService.apiRequest('/me/player/previous', { method: 'POST' });
                        actionMessage = '已切换到上一首';
                        break;
                }

                baseEvent.content = {
                    type: 'system',
                    content: actionMessage,
                    isVisible: true,
                    systemType: 'music_control'
                };
            } catch (error) {
                console.error('音乐控制失败:', error);
                showToast('音乐控制失败', 'error');
                baseEvent.content = {
                    type: 'system',
                    content: '抱歉，音乐控制出现问题',
                    isVisible: true,
                    systemType: 'error'
                };
            }
            break;

        // 一起听相关
        case 'accept_listen_together':
            // 检查Spotify登录状态
            if (!spotifyService.isLoggedIn()) {
                showToast('需要先连接Spotify才能使用一起听功能', 'error');
                baseEvent.content = {
                    type: 'system',
                    content: '抱歉，需要连接Spotify才能使用一起听功能',
                    isVisible: true,
                    systemType: 'error'
                };
                break;
            }

            baseEvent.content = {
                type: 'listen_together_response',
                decision: 'accept',
                targetTimestamp: aiMessage.target_timestamp
            };
            break;

        case 'decline_listen_together':
            baseEvent.content = {
                type: 'listen_together_response',
                decision: 'decline',
                targetTimestamp: aiMessage.target_timestamp,
                reason: aiMessage.reason || null
            };
            break;

        // 拍一拍
        case 'pat_user':
            baseEvent.content = {
                type: 'pat',
                suffix: aiMessage.suffix || null,
                message: `拍了拍你${aiMessage.suffix ? aiMessage.suffix : ''}`
            };
            break;

        // 动态相关
        case 'create_post':
            // 创建动态而不是聊天消息
            const postResult = await createPost(characterId, aiMessage);
            baseEvent.actorId = 'system';
            baseEvent.content = {
                type: 'system',
                content: `发布了一条新动态`,
                isVisible: true,
                systemType: 'post_created',
                relatedPostId: postResult?.contextId || null
            };
            break;

        case 'like_post':
            // 点赞动态
            const likeResult = await likePost(characterId, aiMessage.postId);
            const likeAction = likeResult ? '点赞了' : '取消点赞了';
            baseEvent.actorId = 'system';
            baseEvent.content = {
                type: 'system',
                content: `${likeAction}一条动态`,
                isVisible: true,
                systemType: likeResult ? 'post_liked' : 'post_unliked',
                relatedPostId: aiMessage.postId
            };
            break;

        case 'comment_on_post':
            // 评论动态
            const commentResult = await commentOnPost(characterId, aiMessage.postId, aiMessage.content);
            baseEvent.actorId = 'system';
            baseEvent.content = {
                type: 'system',
                content: `评论了一条动态：${aiMessage.content}`,
                isVisible: true,
                systemType: 'post_commented',
                relatedPostId: aiMessage.postId,
                commentContent: aiMessage.content
            };
            break;

        // 通话相关
        case 'initiate_voice_call':
        case 'initiate_video_call':
            const callType = aiMessage.type === 'initiate_voice_call' ? '语音' : '视频';
            baseEvent.content = {
                type: 'system',
                content: `正在发起${callType}通话...`,
                isVisible: true,
                systemType: 'call_initiate'
            };
            break;

        case 'respond_to_call':
            const decision = aiMessage.decision === 'accept' ? '接受' : '拒绝';
            const reason = aiMessage.reason ? ` (${aiMessage.reason})` : '';
            baseEvent.content = {
                type: 'system',
                content: `已${decision}通话邀请${reason}`,
                isVisible: true,
                systemType: 'call_response'
            };
            break;

        // 记忆创建
        case 'create_memory':
            try {
                const memoryData = {
                    type: aiMessage.memoryType || 'fact',
                    content: aiMessage.content,
                    keywords: aiMessage.keywords || [],
                    targetDate: aiMessage.targetDate || null
                };
                
                const memoryId = await saveAIMemory(characterId, memoryData);
                if (memoryId) {
                    baseEvent.actorId = 'system';
                    baseEvent.content = {
                        type: 'system',
                        content: `为你创建了新的记忆：${aiMessage.content}`,
                        isVisible: true,
                        systemType: 'memory_created'
                    };
                } else {
                    return null; // 创建失败，不发送消息
                }
            } catch (error) {
                console.error('AI创建记忆失败:', error);
                return null;
            }
            break;

        default:
            // 对于不识别的类型，使用showToast显示错误，不发送消息
            if (aiMessage.isInvalidType) {
                showToast(`AI尝试使用了无效的操作类型: ${aiMessage.originalType}`, 'error');
                console.warn('AI使用了无效的消息类型:', aiMessage.originalType, aiMessage);
            } else {
                showToast(`AI使用了未知的消息类型: ${aiMessage.type}`, 'error');
                console.warn('未识别的AI消息类型:', aiMessage.type, aiMessage);
            }
            
            // 返回null表示不发送此消息
            return null;
    }

    return baseEvent;
}

/**
 * 处理一起听邀请
 */
async function processListenTogetherInvite(aiMessage, baseEvent) {
    if (!spotifyService.isLoggedIn()) {
        return createErrorEvent(baseEvent, '抱歉，需要连接Spotify才能使用一起听功能');
    }

    try {
        const userPlaylists = await spotifyService.getUserPlaylists(50);
        const targetPlaylist = userPlaylists.items?.find(playlist => 
            playlist.name.toLowerCase().includes(aiMessage.playlistName?.toLowerCase() || '')
        );

        if (targetPlaylist) {
            baseEvent.content = {
                type: 'listen-together-invite',
                playlist: {
                    id: targetPlaylist.id,
                    name: targetPlaylist.name,
                    images: targetPlaylist.images,
                    tracks: { total: targetPlaylist.tracks.total },
                    uri: targetPlaylist.uri
                },
                message: aiMessage.message || `邀请你一起听「${targetPlaylist.name}」`
            };
        } else {
            return createErrorEvent(baseEvent, '抱歉，没找到匹配的播放列表');
        }
    } catch (error) {
        console.error('获取播放列表失败:', error);
        return createErrorEvent(baseEvent, '抱歉，获取播放列表时出现问题');
    }
    
    return baseEvent;
}

/**
 * 处理音乐分享
 */
async function processMusicShare(aiMessage, baseEvent) {
    if (!spotifyService.isLoggedIn()) {
        return createErrorEvent(baseEvent, '抱歉，需要连接Spotify才能分享真实的音乐');
    }

    try {
        const searchQuery = `${aiMessage.songName} ${aiMessage.artistName}`;
        const searchResults = await spotifyService.apiRequest(
            `/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=1`
        );
        
        if (searchResults.tracks?.items?.length > 0) {
            const track = searchResults.tracks.items[0];
            baseEvent.content = {
                type: 'music-card',
                song: {
                    id: track.id,
                    name: track.name,
                    artists: track.artists,
                    album: track.album,
                    duration_ms: track.duration_ms,
                    external_urls: track.external_urls,
                    uri: track.uri
                },
                message: aiMessage.message || '分享一首好听的歌给你'
            };
        } else {
            return createErrorEvent(baseEvent, '抱歉，没找到这首歌，可能名字不太准确');
        }
    } catch (error) {
        console.error('搜索音乐失败:', error);
        return createErrorEvent(baseEvent, '抱歉，音乐搜索出现问题');
    }
    
    return baseEvent;
}

/**
 * 创建错误事件
 */
function createErrorEvent(baseEvent, message) {
    showToast(message, 'error');
    baseEvent.content = {
        type: 'system',
        content: message,
        isVisible: true,
        systemType: 'error'
    };
    return baseEvent;
}

/**
 * 更新角色状态
 */
async function updateCharacterStatus(characterId, statusText, statusColor, mood, location, outfit, innerThoughts) {
    try {
        // 获取当前状态，保持未更新的字段
        const currentActor = await db.actors.get(characterId);
        const currentStatus = currentActor?.status || {};
        
        const updatedStatus = {
            text: statusText !== undefined ? statusText : (currentStatus.text || '在线'),
            color: statusColor !== undefined ? statusColor : (currentStatus.color || '#4CAF50'),
            mood: mood !== undefined ? mood : currentStatus.mood,
            location: location !== undefined ? location : currentStatus.location,
            outfit: outfit !== undefined ? outfit : currentStatus.outfit,
            innerThoughts: innerThoughts !== undefined ? innerThoughts : currentStatus.innerThoughts
        };
        
        await db.actors.update(characterId, {
            status: updatedStatus
        });
        
        console.log('角色状态已更新:', {
            ...updatedStatus,
            innerThoughts: innerThoughts ? '[已更新]' : '[未更新]' // 不在日志中显示完整心声内容
        });
    } catch (error) {
        console.error('更新角色状态失败:', error);
    }
}

/**
 * 更新角色昵称
 */
async function updateCharacterName(characterId, newName) {
    try {
        await db.actors.update(characterId, { name: newName });
        console.log('角色昵称已更新:', newName);
    } catch (error) {
        console.error('更新角色昵称失败:', error);
    }
}

/**
 * 更新角色签名
 */
async function updateCharacterSignature(characterId, signature) {
    try {
        await db.actors.update(characterId, { signature });
        console.log('角色签名已更新:', signature);
    } catch (error) {
        console.error('更新角色签名失败:', error);
    }
}

/**
 * 更换角色头像
 */
async function updateCharacterAvatar(characterId, avatarName) {
    try {
        const character = await db.actors.get(characterId);
        if (character && character.avatarLibrary) {
            const avatar = character.avatarLibrary.find(av => 
                av.description?.includes(avatarName) || av.name === avatarName
            );
            if (avatar) {
                await db.actors.update(characterId, { 
                    currentAvatar: avatar.url 
                });
                console.log('角色头像已更新:', avatarName);
            }
        }
    } catch (error) {
        console.error('更换角色头像失败:', error);
    }
}

/**
 * 创建动态
 */
async function createPost(characterId, postData) {
    try {
        await createMomentPost(characterId, postData);
    } catch (error) {
        console.error('AI创建动态失败:', error);
        throw error;
    }
}

/**
 * 点赞动态
 */
async function likePost(characterId, postId) {
    try {
        await likeMomentPost(characterId, postId);
    } catch (error) {
        console.error('AI点赞动态失败:', error);
        throw error;
    }
}

/**
 * 评论动态
 */
async function commentOnPost(characterId, postId, commentContent) {
    try {
        await commentOnMomentPost(characterId, postId, commentContent);
    } catch (error) {
        console.error('AI评论动态失败:', error);
        throw error;
    }
}

/**
 * 设置角色背景
 */
async function updateCharacterBackground(characterId, description) {
    try {
        // 从全局相册中查找符合描述的图片
        const albums = await db.globalAlbum.toArray();
        let selectedImage = null;
        
        // 在全局相册中查找符合描述的图片
        const photo = albums.find(p => 
            p.description && p.description.includes(description)
        );
        
        if (photo) {
            selectedImage = photo.url;
        }
        
        if (selectedImage) {
            await db.actors.update(characterId, { 
                momentsHeaderImage: selectedImage 
            });
            console.log('角色背景已设置:', description);
        }
    } catch (error) {
        console.error('设置角色背景失败:', error);
    }
}

/** 后台活动 */
/**
 * 为后台活动构建一个轻量级的系统提示词
 * @param {Object} character - 角色信息
 * @returns {Promise<string>} 系统提示词
 */

/**
 * 触发一个或多个角色的后台活动
 * @returns {Promise<void>}
 */
export async function triggerBackgroundActivity() {
        const settings = (await db.globalSettings.get('global'))?.backgroundActivity;
        if (!settings || !settings.enabled) return;

        // 概率检测
        if (Math.random() * 100 > settings.probability) {
                console.log("Background activity check skipped by probability.");
                return;
        }

        // 修改此处的过滤逻辑，排除所有用户人格 
        const allChars = await db.actors.filter(actor =>
                !actor.isGroup &&
                !actor.id.startsWith('user_') &&
                actor.id !== '__USER__'
        ).toArray();

        if (allChars.length === 0) return;

        // 权重选择，特别关心的角色有更高概率被选中
        const weightedChars = allChars.flatMap(char => {
                const weight = char.specialCare ? 3 : 1; // 特别关心的权重是3倍
                return Array(weight).fill(char);
        });

        const charsToWakeUp = new Set();
        const maxChars = Math.min(settings.maxChars, allChars.length);

        while (charsToWakeUp.size < maxChars && weightedChars.length > 0) {
                const randomIndex = Math.floor(Math.random() * weightedChars.length);
                const selectedChar = weightedChars[randomIndex];
                charsToWakeUp.add(selectedChar);
        }

        console.log(`Waking up ${charsToWakeUp.size} characters for background activity...`);

        const apiProfile = await db.apiProfiles.get((await db.globalSettings.get('global')).activeApiProfileId);
        if (!apiProfile) {
                console.warn("No active AI API profile found for background activity.");
                return;
        }

        for (const char of charsToWakeUp) {
                const prompt = await promptBuilder.buildBackgroundActivityPrompt(char);
                const messages = [{ role: 'system', content: prompt }, { role: 'user', content: '开始你的后台活动。' }];
                console.log(`Triggering background activity for ${char.name}...`);
                try {
                        const aiResponse = await callAIAPI(apiProfile, messages, char, {});
                        const parsedResponse = JSON.parse(aiResponse.content.replace(/```json\n?|\n?```/g, ''));

                        if (parsedResponse.activityType === 'sendMessage') {
                                const messageEvent = await processAIMessage(parsedResponse.message, char.id);
                                if (messageEvent) {
                                        await db.events.add(messageEvent);
                                        // 更新会话和未读计数
                                        const conversation = await db.conversations.get(char.id) || { unreadCount: 0 };
                                        await db.conversations.put({
                                                id: char.id,
                                                lastEventTimestamp: messageEvent.timestamp,
                                                lastEventContent: messageEvent.content,
                                                unreadCount: (conversation.unreadCount || 0) + 1,
                                        });
                                        if (!isCurrentChatRoom(char.id)) {
                                                const notificationBody = messageEvent.content.content || '[新消息]';
                                                showLocalNotification(char.name, notificationBody, `/chatroom/${char.id}`);
                                            }
                                }
                        } else if (parsedResponse.activityType === 'createPost') {
                                const postEvent = {
                                        type: 'post',
                                        contextId: `post_${Date.now()}`,
                                        actorId: char.id,
                                        content: parsedResponse.post,
                                        timestamp: Date.now(),
                                        visibility: { mode: 'public', groups: [], friends: [] }
                                };
                                await db.events.add(postEvent);
                                if (document.hidden) {
                                        showLocalNotification(char.name, `发布了新动态: ${parsedResponse.post.text.substring(0, 50)}...`, '/chat/moments');
                                }
                        }
                } catch (error) {
                        console.error(`Error during background activity for ${char.name}:`, error);
                }
        }
}

/**
 * 生成AI回复（主函数）
 * @param {string} characterId - 角色ID
 * @param {string} userId - 用户ID
 * @param {string} userMessage - 用户消息
 * @returns {Promise<Object>} 包含AI回复和相关更新的对象
 */
export async function generateAIReply(characterId, userId, userMessage) {
    try {
        // 输入验证
        if (!characterId || !userId || !userMessage) {
            throw new Error('缺少必要的参数');
        }

        // 获取当前活跃的API配置
        const globalSettings = await db.globalSettings.get('global');
        if (!globalSettings || !globalSettings.activeApiProfileId) {
            throw new Error('未配置AI API，请前往设置页面配置');
        }

        const apiProfile = await db.apiProfiles.get(globalSettings.activeApiProfileId);
        if (!apiProfile) {
            throw new Error('API配置档案不存在');
        }

        // 验证API配置
        if (!apiProfile.apiKey || !apiProfile.model) {
            throw new Error('API配置不完整，请检查API密钥和模型设置');
        }

        if (apiProfile.connectionType === 'proxy' && !apiProfile.apiUrl) {
            throw new Error('反向代理模式下需要配置API地址');
        }

        // 构建消息历史
        const messages = await buildMessageHistory(characterId, userId, userMessage);

        // 获取角色信息用于上下文
        const character = await db.actors.get(characterId);
        if (!character) {
            throw new Error('角色不存在');
        }
        
        // 调用AI API
        console.log('调用AI API，消息数量:', messages.length);
        const aiResponse = await callAIAPI(apiProfile, messages, character, {});
        console.log('AI API 响应长度:', aiResponse.content?.length || 0);

        // 解析AI返回的JSON
        const parsedResponse = extractAndParseJson(aiResponse.content);
        console.log('解析的消息数量:', parsedResponse.messages?.length || 0);
        console.log('解析的消息内容:', parsedResponse.messages);

        // 处理每条AI消息，生成对应的事件
        const processedEvents = [];
        if (parsedResponse.messages && parsedResponse.messages.length > 0) {
            for (let i = 0; i < parsedResponse.messages.length; i++) {
                const aiMessage = parsedResponse.messages[i];
                console.log(`处理第 ${i + 1} 条消息:`, aiMessage);
                const processedEvent = await processAIMessage(aiMessage, characterId);
                console.log(`第 ${i + 1} 条消息处理结果:`, processedEvent ? '成功' : '失败');
                // 只添加有效的事件（过滤掉null）
                if (processedEvent) {
                    processedEvents.push(processedEvent);
                }
            }
        }
        console.log('最终处理的事件数量:', processedEvents.length);

        // 处理关系变化
        if (parsedResponse.relationship) {
            try {
                await updateRelationship(characterId, userId, parsedResponse.relationship);
                console.log('关系已更新:', parsedResponse.relationship);
            } catch (error) {
                console.error('更新关系失败:', error);
                // 关系更新失败不应该影响消息发送
            }
        }

        // 处理状态更新
        if (parsedResponse.status) {
            try {
                await updateCharacterStatus(
                    characterId, 
                    parsedResponse.status.text,
                    parsedResponse.status.color,
                    parsedResponse.status.mood,
                    parsedResponse.status.location,
                    parsedResponse.status.outfit,
                    parsedResponse.status.innerThoughts
                );
                console.log('角色状态已更新');
            } catch (error) {
                console.error('更新角色状态失败:', error);
                // 状态更新失败不应该影响消息发送
            }
        }

        // 成功生成回复后，增加对话轮数计数器
        if (processedEvents.length > 0) {
            try {
                const character = await db.actors.get(characterId);
                if (character) {
                    const newCount = (character.conversationRounds || 0) + 1;
                    await db.actors.update(characterId, { 
                        conversationRounds: newCount 
                    });
                    console.log(`角色 ${characterId} 对话轮数增加至: ${newCount}`);
                }
            } catch (error) {
                console.error('更新对话轮数失败:', error);
            }
        }

        return {
            success: true,
            messages: parsedResponse.messages,
            events: processedEvents,
            relationship: parsedResponse.relationship,
            status: parsedResponse.status
        };

    } catch (error) {
        console.error('生成AI回复失败:', error);
        
        // 根据错误类型返回不同的错误消息
        let errorMessage = '抱歉，我现在无法回复。';
        
        if (error.message.includes('API配置')) {
            errorMessage = '请先在设置中配置AI API。';
        } else if (error.message.includes('网络') || error.message.includes('HTTP')) {
            errorMessage = '网络连接出现问题，请稍后再试。';
        } else if (error.message.includes('JSON') || error.message.includes('解析')) {
            errorMessage = 'AI回复格式异常，请重试。';
        }

        return {
            success: false,
            error: error.message,
            messages: [{
                type: 'text',
                content: errorMessage,
                data: null
            }]
        };
    }
}

export default {
    callAIAPI,
    extractAndParseJson,
    buildMessageHistory,
    updateRelationship,
    saveAIMemory,
    processAIMessage,
    generateAIReply
};
