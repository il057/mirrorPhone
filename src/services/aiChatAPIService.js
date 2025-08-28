/**
 * AI 聊天 API 服务
 * 专门处理聊天室的AI回复生成、关系管理和记忆更新
 */

import db from './database.js';
import { calculateVoiceDuration } from './personalSettingsService.js';
import spotifyService from './spotifyService.js';
import { showToast } from './uiService.js';

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
        relationship: null
    };

    // 处理多种可能的响应格式
    if (response.messages && Array.isArray(response.messages)) {
        // 格式1：新的多消息格式 {"messages": [...], "relationship": {...}}
        normalized.messages = response.messages;
        normalized.relationship = response.relationship || null;
    } else if (response.message && response.relationship !== undefined) {
        // 格式2：单消息格式 {"message": {...}, "relationship": {...}}
        normalized.messages = [response.message];
        normalized.relationship = response.relationship;
    } else if (response.message) {
        // 格式3：只有message字段
        normalized.messages = [response.message];
        normalized.relationship = null;
    } else if (response.type) {
        // 格式4：直接是消息对象（兼容旧格式）
        normalized.messages = [response];
        normalized.relationship = null;
    } else if (typeof response === 'string') {
        // 格式5：纯字符串回复
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
        if (validatedMsg.type === 'voice_message' && !validatedMsg.content) {
            console.warn(`第${index + 1}条语音消息缺少content字段`);
            validatedMsg.content = '语音消息内容为空';
        }
        
        return validatedMsg;
    });

    console.log('AI响应验证结果:', {
        originalFormat: Object.keys(response),
        messagesCount: normalized.messages.length,
        hasRelationship: !!normalized.relationship
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
        'text', 'send_sticker', 'voice_message', 'send_photo', 
        'transfer', 'payment', 'initiate_voice_call', 'initiate_video_call',
        'update_status', 'update_signature', 'change_avatar', 'update_name', 
        'set_background', 'create_listen_together_invite', 'share_music',
        'respond_to_transfer', 'payment_response', 'respond_to_call',
        'spotify_toggle_play', 'spotify_next_track', 'spotify_previous_track',
        'accept_listen_together', 'decline_listen_together', 'pat_user',
        'create_post', 'quote_reply'
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
        recentEvents.reverse().forEach(event => {
            // 检查是否为用户消息：所有存储为 __USER__ 的消息都是用户消息
            const isUser = event.actorId === '__USER__';
            const content = formatMessageForAI(event.content);
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
    let prompt = `你是 ${character.name}`;
    
    prompt += `\n\n# 核心规则\n你的所有回复都必须严格遵循指定的JSON格式。绝对不允许直接返回纯文本或任何JSON格式之外的内容。你的唯一输出就是一个完整的、可被解析的JSON对象。`;

    if (character.realName && character.realName !== character.name) {
        prompt += ` (${character.realName})`;
    }
    
    prompt += `。`;

    // 添加基本信息
    if (character.persona) {
        prompt += `\n\n角色设定：${character.persona}`;
    }

    if (character.birthday) {
        prompt += `\n生日：${character.birthday}`;
    }

    if (character.gender) {
        prompt += `\n性别：${character.gender}`;
    }

    // 获取用户人格信息
    let userPersona = null;
    if (userId !== '__USER__') {
        userPersona = await db.actors.get(userId);
        console.log('构建系统提示词 - 用户人格:', userPersona?.name || '未找到', '(ID:', userId, ')');
    } else {
        console.log('构建系统提示词 - 使用默认用户ID:', userId);
    }

    if (userPersona) {
        prompt += `\n\n用户人格信息：`;
        prompt += `\n- 名称：${userPersona.name}`;
        if (userPersona.realName && userPersona.realName !== userPersona.name) {
            prompt += `\n- 真实姓名：${userPersona.realName}`;
        }
        if (userPersona.persona) {
            prompt += `\n- 人格设定：${userPersona.persona}`;
        }
        if (userPersona.birthday) {
            prompt += `\n- 生日：${userPersona.birthday}`;
        }
        if (userPersona.gender) {
            prompt += `\n- 性别：${userPersona.gender}`;
        }
    }

    // 获取与用户的关系信息
    const relationship = await db.relationships
        .where('sourceId').equals(character.id)
        .and(rel => rel.targetId === userId)
        .first();

    if (relationship) {
        prompt += `\n\n与用户的关系：${relationship.type}`;
        prompt += `\n好感度：${relationship.score}/1000`;
        
        if (relationship.tags && relationship.tags.length > 0) {
            const tagStrings = relationship.tags.map(tag => 
                `${tag.name}(${tag.strength}/10)`
            ).join('、');
            prompt += `\n对用户的印象标签：${tagStrings}`;
        }
    }

    // 获取相关的世界书内容
    if (character.worldbookIds && character.worldbookIds.length > 0) {
        const worldbooks = await db.worldbooks
            .where('id').anyOf(character.worldbookIds)
            .toArray();
        
        if (worldbooks.length > 0) {
            prompt += `\n\n世界观设定：`;
            worldbooks.forEach(wb => {
                prompt += `\n- ${wb.name}: ${wb.content}`;
            });
        }
    }

    // 获取分组相关的世界书
    if (character.groupIds && character.groupIds.length > 0) {
        const groups = await db.groups
            .where('id').anyOf(character.groupIds)
            .toArray();
        
        for (const group of groups) {
            if (group.worldbookIds && group.worldbookIds.length > 0) {
                const groupWorldbooks = await db.worldbooks
                    .where('id').anyOf(group.worldbookIds)
                    .toArray();
                
                if (groupWorldbooks.length > 0) {
                    prompt += `\n\n${group.name}分组设定：`;
                    groupWorldbooks.forEach(wb => {
                        prompt += `\n- ${wb.name}: ${wb.content}`;
                    });
                }
            }
        }
    }

    // 获取记忆信息
    if (contextSettings.memory > 0) {
        const memories = await db.memories
            .where('actorId').equals(character.id)
            .reverse()
            .limit(contextSettings.memory)
            .toArray();
        
        if (memories.length > 0) {
            prompt += `\n\n相关记忆：`;
            memories.forEach(memory => {
                prompt += `\n- ${memory.content}`;
            });
        }
    }

    // 获取角色头像库信息
    if (character.avatarLibrary && character.avatarLibrary.length > 0) {
        prompt += `\n\n你的头像库：`;
        character.avatarLibrary.forEach((avatar, index) => {
            if (avatar.description) {
                prompt += `\n- 头像${index + 1}: ${avatar.description}`;
            }
        });
    }

    // 获取表情包列表供AI参考
    const availableStickers = await db.stickers.orderBy('order').toArray();
    const stickerList = availableStickers.map(s => `${s.name}(${s.id})`).slice(0, 20);

    // 构建功能列表
    const isSpotifyLoggedIn = spotifyService.isLoggedIn();
    const functionsList = buildFunctionsList(isSpotifyLoggedIn, stickerList);
    
    // 添加输出格式要求
    prompt += `\n\n你需要返回一个包含消息和关系变化的JSON对象：

## 🚨 重要：支持多条消息发送 🚨
你可以一次性发送多条消息！有两种格式：

### 格式1：单条消息（基础格式）
{
  "message": {
    "type": "消息类型",
    "content": "消息内容"
    // 其他必需字段...
  },
  "relationship": { /* 关系变化 */ }
}

### 格式2：多条消息（推荐使用！）
{
  "messages": [
    {"type": "text", "content": "第一条文字消息"},
    {"type": "voice_message", "content": "语音消息的文字内容"},
    {"type": "send_sticker", "name": "表情名称"}
    // 可以添加更多消息...
  ],
  "relationship": { /* 关系变化 */ }
}

## 可用功能列表：
${functionsList}

## 关系变化格式：
"relationship": {
  "scoreChange": 数字, // 好感度变化 (-100到+100)
  "typeChange": "字符串或null", // 关系类型变化，如"朋友"、"恋人"等
  "newTags": [{"name": "标签名", "strength": 1-10}], // 新增的印象标签
  "removeTags": ["要移除的标签名"] // 要移除的标签
}

## 重要注意事项：
1. 💡 **强烈建议使用多条消息格式**，让对话更生动自然！
   例如：先发文字回应，再发表情，最后发语音
2. 📱 语音消息格式：{"type": "voice_message", "content": "要转换为语音的文字内容"}
   （注意：AI的voice_message会被自动转换为系统的voice类型进行渲染）
3. 😀 表情包使用要符合情境，只能使用上述列表中的名称
4. 💰 支付功能请合理使用，金额建议在1-999元之间
5. 💗 好感度变化要合理：普通对话±1-5，特殊互动±5-20，重大事件±20-50
6. 🏷️ 标签要具体且有意义，强度1-10表示印象深度
${isSpotifyLoggedIn ? '7. 🎵 音乐功能仅在Spotify已登录时可用，所有音乐推荐必须是真实可播放的歌曲\n' : ''}${isSpotifyLoggedIn ? '8' : '7'}. 🎭 回复要符合角色性格，自然流畅
${isSpotifyLoggedIn ? '9' : '8'}. ✅ 每条消息都必须有完整且正确的字段，不要遗漏必需的属性
${isSpotifyLoggedIn ? '10' : '9'}. 📊 多条消息示例（这正是我们推荐的方式）：
   {
     "messages": [
       {"type": "text", "content": "哈哈，你说得对！"},
       {"type": "voice_message", "content": "这个想法真的很棒呢"},
       {"type": "send_sticker", "name": "开心"}
     ],
     "relationship": {"scoreChange": 3}
   }`;

    // 检查最近的用户消息是否包含需要特殊处理的功能
    const specialTasks = analyzeSpecialTasks(recentEvents, userId);
    if (specialTasks.length > 0) {
        prompt += `\n\n## 🚨 临时任务提醒 🚨\n`;
        specialTasks.forEach(task => {
            prompt += task + '\n';
        });
    }

    return prompt;
}

/**
 * 构建功能列表字符串
 */
function buildFunctionsList(isSpotifyLoggedIn, stickerList) {
    const functions = [
        {
            title: "基础交流",
            items: [
                '**发送文本**: {"type": "text", "content": "文本内容"}',
                '**引用回复**: {"type": "quote_reply", "target_timestamp": [要引用的消息时间戳], "reply_content": "你的回复内容"}'
            ]
        },
        {
            title: "丰富表达", 
            items: [
                `**发送表情**: {"type": "send_sticker", "name": "表情的描述文字"} 可用表情：${stickerList.length > 0 ? stickerList.join('、') : '暂无表情包'}`,
                '**发送语音**: {"type": "voice_message", "content": "语音的文字内容"}（注意：语音消息渲染为voice类型）',
                '**发送图片**: {"type": "send_photo", "description": "对你想发送的图片内容的详细描述"}'
            ]
        },
        {
            title: "个人状态",
            items: [
                '**更新状态**: {"type": "update_status", "text": "正在做的事...", "color": "#FF69B4"}',
                '**更新签名**: {"type": "update_signature", "signature": "新签名"}',
                '**更换头像**: {"type": "change_avatar", "name": "头像名"}',
                '**修改昵称**: {"type": "update_name", "name": "新昵称"}'
            ]
        },
        {
            title: "功能性交互",
            items: [
                '**发起语音通话**: {"type": "initiate_voice_call"}',
                '**发起视频通话**: {"type": "initiate_video_call"}',
                '**发起转账**: {"type": "transfer", "amount": 5.20, "note": "一点心意"}',
                '**发起代付**: {"type": "payment", "productInfo": "一杯咖啡", "amount": 25}',
                '**拍一拍用户**: {"type": "pat_user", "suffix": "(可选)后缀"}'
            ]
        }
    ];
    
    // 如果Spotify已登录，添加音乐功能
    if (isSpotifyLoggedIn) {
        functions.push({
            title: "音乐功能（Spotify已登录）",
            items: [
                '**邀请一起听**: {"type": "create_listen_together_invite", "playlistName": "歌单名", "message": "邀请文字"}',
                '**分享音乐**: {"type": "share_music", "songName": "歌名", "artistName": "歌手", "message": "分享文字"}',
                '**控制播放**: {"type": "spotify_toggle_play"}',
                '**下一首**: {"type": "spotify_next_track"}',
                '**上一首**: {"type": "spotify_previous_track"}'
            ]
        });
    }
    
    return functions.map((section, index) => 
        `## ${index + 1}. ${section.title}\n${section.items.map(item => `- ${item}`).join('\n')}`
    ).join('\n\n');
}

/**
 * 分析最近的消息，检测需要特殊处理的功能
 */
function analyzeSpecialTasks(recentEvents, userId) {
    const tasks = [];
    const recentUserEvents = getRecentUserEvents(recentEvents, userId);
    
    for (const event of recentUserEvents) {
        const taskHandler = getTaskHandler(event.content);
        if (taskHandler) {
            tasks.push(taskHandler(event));
        }
    }
    
    // 检测一起听模式
    if (isListeningTogether(recentEvents) && spotifyService.isLoggedIn()) {
        tasks.push(buildMusicControlTask());
    }
    
    return tasks;
}

/**
 * 获取最近的用户事件（基于对话轮数而非时间）
 */
function getRecentUserEvents(recentEvents, userId) {
    // 获取最近的10轮对话中的用户事件
    const recentLimit = 10;
    const userEvents = recentEvents
        .filter(event => event.actorId === userId)
        .slice(-recentLimit); // 获取最近的N条用户消息
    
    return userEvents;
}

/**
 * 获取任务处理器
 */
function getTaskHandler(content) {
    if (content?.type === 'payment' && content?.subtype === 'transfer') {
        return buildTransferTask;
    }
    if (content?.type === 'payment' && content?.subtype === 'pay') {
        return buildPaymentTask;
    }
    if (content?.type === 'call') {
        return buildCallTask;
    }
    if (content?.type === 'listen-together-invite') {
        return buildListenTogetherTask;
    }
    if (content?.type === 'forwarded_message') {
        return buildForwardedMessageTask;
    }
    return null;
}

/**
 * 构建转账任务
 */
function buildTransferTask(event) {
    return `
# 临时任务：如何回应用户的转账
你必须使用 respond_to_transfer 指令回应，并在后面跟上 text 消息解释。
- **接受转账**: {"type": "respond_to_transfer", "target_timestamp": ${event.timestamp}, "decision": "accept"}
- **拒绝转账**: {"type": "respond_to_transfer", "target_timestamp": ${event.timestamp}, "decision": "decline"}`;
}

/**
 * 构建代付任务
 */
function buildPaymentTask(event) {
    return `
# 临时任务：如何回应代付请求
用户希望你为他/她付钱。你必须使用 payment_response 指令回应。
- **接受代付**: {"type": "payment_response", "target_timestamp": ${event.timestamp}, "decision": "paid"}
- **拒绝代付**: {"type": "payment_response", "target_timestamp": ${event.timestamp}, "decision": "rejected"}`;
}

/**
 * 构建通话任务
 */
function buildCallTask(event) {
    return `
# 临时任务：如何回应用户的通话请求
用户正在向你发起通话。根据你的人设决定是否接受。
- **接受通话**: {"type": "respond_to_call", "decision": "accept"}
- **拒绝通话**: {"type": "respond_to_call", "decision": "reject", "reason": "原因"}`;
}

/**
 * 构建一起听任务
 */
function buildListenTogetherTask(event) {
    if (spotifyService.isLoggedIn()) {
        return `
# 临时任务：如何回应一起听邀请
用户邀请你一起听音乐。你可以：
- **接受邀请**: {"type": "accept_listen_together", "target_timestamp": ${event.timestamp}}
- **拒绝邀请**: {"type": "decline_listen_together", "target_timestamp": ${event.timestamp}, "reason": "理由"}`;
    } else {
        return `
# 临时任务：回应一起听邀请（Spotify未登录）
用户邀请你一起听音乐，但Spotify未登录。告诉用户需要先连接Spotify。`;
    }
}

/**
 * 构建转发消息任务
 */
function buildForwardedMessageTask(event) {
    const content = event.content;
    const fromCharName = content.fromCharName || '某个角色';
    const userPersonaName = content.userPersonaName || '用户';
    
    // 获取与来源角色的关系信息来调整回复语气
    let relationshipHint = '';
    if (content.fromCharId) {
        relationshipHint = `\n注意：你需要参考自己和${fromCharName}的好感度关系来调整回复的语气和态度。如果关系好可以更亲近，关系一般可以更中性。`;
    }
    
    return `
# 临时任务：回应转发消息
这是转发的${fromCharName}和${userPersonaName}的聊天内容。${relationshipHint}

转发的消息数量：${content.messages ? content.messages.length : 0} 条
你应该：
1. 对转发的内容表示已收到
2. 根据消息内容给出你的看法、评论或反应
3. 如果合适，可以询问相关问题或给出建议
4. 考虑你与${fromCharName}的关系来调整语气`;
}

/**
 * 检测是否正在一起听
 */
function isListeningTogether(recentEvents) {
    return recentEvents.some(event => 
        event.content?.type === 'accept_listen_together' ||
        (event.content?.type === 'listen-together-invite' && event.content?.accepted)
    );
}

/**
 * 构建音乐控制任务
 */
function buildMusicControlTask() {
    return `
# 一起听音乐模式已启用
你现在可以使用以下音乐控制功能：
- **暂停/播放**: {"type": "spotify_toggle_play"}
- **下一首**: {"type": "spotify_next_track"}
- **上一首**: {"type": "spotify_previous_track"}
当用户提到切歌、暂停、播放等需求时，请主动使用这些功能。`;
}

/**
 * 更新角色与用户的关系
 * @param {string} characterId - 角色ID
 * @param {string} userId - 用户ID
 * @param {Object} relationshipChange - 关系变化数据
 */
export async function updateRelationship(characterId, userId, relationshipChange) {
    try {
        const existing = await db.relationships
            .where('sourceId').equals(characterId)
            .and(rel => rel.targetId === userId)
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
                targetId: userId,
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
 * 保存AI记忆
 * @param {string} characterId - 角色ID
 * @param {Object} memoryData - 记忆数据
 * @param {Array} relatedEventIds - 相关事件ID数组
 */
export async function saveAIMemory(characterId, memoryData, relatedEventIds = []) {
    // 注意：此版本不包含记忆保存功能，因为已从响应格式中移除
    console.log('记忆保存功能已被移除');
    return;
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

        case 'voice_message':
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

        case 'update_status':
            // 更新数据库中的角色状态，并返回系统消息
            await updateCharacterStatus(characterId, aiMessage.text, aiMessage.color);
            baseEvent.actorId = 'system';
            baseEvent.content = {
                type: 'system',
                content: `更新了状态：${aiMessage.text}`,
                isVisible: true,
                systemType: 'status_update'
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
            // 这个需要特殊处理，创建动态而不是聊天消息
            await createPost(characterId, aiMessage);
            baseEvent.content = {
                type: 'system',
                content: `${characterId} 发布了一条新动态`,
                isVisible: true,
                systemType: 'post_created'
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
async function updateCharacterStatus(characterId, statusText, statusColor) {
    try {
        await db.actors.update(characterId, {
            status: {
                text: statusText,
                color: statusColor || '#4CAF50'
            }
        });
        console.log('角色状态已更新:', statusText);
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
        const postEvent = {
            timestamp: Date.now(),
            actorId: characterId,
            contextId: `post_${Date.now()}`,
            type: 'post',
            content: {
                text: postData.content || postData.publicText || '',
                images: postData.postType === 'image' ? [
                    `https://picsum.photos/400/300?random=${Math.floor(Math.random() * 1000)}`
                ] : [],
                imageDescription: postData.imageDescription || null
            }
        };

        await db.events.add(postEvent);
        console.log('动态已创建:', postEvent.contextId);
    } catch (error) {
        console.error('创建动态失败:', error);
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
            relationship: parsedResponse.relationship
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
