/**
 * AI 聊天 API 服务
 * 专门处理聊天室的AI回复生成、关系管理和记忆更新
 */

import db from './database.js';

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
                candidateCount: 1
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
            stream: false
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

            // 如果所有JSON解析都失败，返回一个简单的文本消息
            console.warn('无法解析AI返回的JSON，将作为纯文本处理');
            return {
                messages: [{
                    type: 'text',
                    content: cleanContent
                }],
                relationship: {
                    scoreChange: 0,
                    typeChange: null,
                    newTags: [],
                    removeTags: []
                }
            };
        }
    } catch (error) {
        console.error('JSON解析完全失败:', error);
        return {
            messages: [{
                type: 'text',
                content: content.trim()
            }],
            relationship: {
                scoreChange: 0,
                typeChange: null,
                newTags: [],
                removeTags: []
            }
        };
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
        relationship: {
            scoreChange: 0,
            typeChange: null,
            newTags: [],
            removeTags: []
        }
    };

    // 验证并处理消息部分
    if (response.messages && Array.isArray(response.messages)) {
        normalized.messages = response.messages.map(msg => ({
            type: msg.type || 'text',
            content: msg.content || '',
            data: msg.data || null
        }));
    } else if (response.message) {
        // 兼容单条消息格式
        normalized.messages = [{
            type: response.message.type || 'text',
            content: response.message.content || response.message || '',
            data: response.message.data || null
        }];
    } else if (typeof response === 'string') {
        // 如果整个响应就是一个字符串
        normalized.messages = [{
            type: 'text',
            content: response,
            data: null
        }];
    }

    // 验证并处理关系变化
    if (response.relationship) {
        const rel = response.relationship;
        normalized.relationship = {
            scoreChange: Number(rel.scoreChange) || 0,
            typeChange: rel.typeChange || null,
            newTags: Array.isArray(rel.newTags) ? rel.newTags.slice(0, 10) : [],
            removeTags: Array.isArray(rel.removeTags) ? rel.removeTags : []
        };
    }

    return normalized;
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

        // 构建系统提示词
        const systemPrompt = await buildSystemPrompt(character, userId, contextSettings);

        // 获取最近的对话记录
        const recentEvents = await db.events
            .where('contextId').equals(characterId)
            .and(event => event.type === 'privateMessage')
            .reverse()
            .limit(contextSettings.privateChat)
            .toArray();

        // 构建消息历史
        const messages = [
            { role: 'system', content: systemPrompt }
        ];

        // 添加历史消息（按时间正序）
        recentEvents.reverse().forEach(event => {
            // 检查是否为用户消息：所有存储为 __USER__ 的消息都是用户消息
            const isUser = event.actorId === '__USER__';
            const content = event.content?.content || event.content || '';
            messages.push({
                role: isUser ? 'user' : 'assistant',
                content: content
            });
        });

        // 添加新的用户消息
        messages.push({
            role: 'user',
            content: newUserMessage
        });

        return messages;
    } catch (error) {
        console.error('构建消息历史失败:', error);
        throw error;
    }
}

/**
 * 构建系统提示词
 * @param {Object} character - 角色信息
 * @param {string} userId - 用户人格ID（不是 __USER__）
 * @param {Object} contextSettings - 上下文设置
 * @returns {Promise<string>} 系统提示词
 */
async function buildSystemPrompt(character, userId, contextSettings) {
    let prompt = `你是 ${character.name}`;
    
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

    // 添加输出格式要求
    prompt += `\n\n请以JSON格式回复，包含以下结构：
{
  "messages": [
    {
      "type": "text",
      "content": "回复内容",
      "data": "额外数据(可选)"
    }
  ],
  "relationship": {
    "scoreChange": 好感度变化(-10到+10),
    "typeChange": "关系类型变化(如有)",
    "newTags": [{"name": "新印象标签", "strength": 强度1-10}],
    "removeTags": ["要移除的标签名"]
  }
}

消息类型说明：
- "text": 普通文本消息
- "pat": 拍一拍消息
- "sticker": 表情包消息
- "transfer": 转账消息
- "redpacket": 红包消息
- "call": 通话请求
- "music": 音乐分享

注意：
1. 根据对话内容合理调整好感度变化
2. 印象标签最多保持10个，新增时考虑替换低强度标签
3. 回复要符合角色性格，自然流畅
4. 可以根据场景使用不同的消息类型
5. 拍一拍等互动通过系统消息实现，不是动作描述`;

    return prompt;
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

        // 更新关系
        if (parsedResponse.relationship && (
            parsedResponse.relationship.scoreChange !== 0 || 
            parsedResponse.relationship.newTags?.length > 0 ||
            parsedResponse.relationship.typeChange
        )) {
            await updateRelationship(characterId, userId, parsedResponse.relationship);
            console.log('关系已更新:', parsedResponse.relationship);
        }

        return {
            success: true,
            messages: parsedResponse.messages,
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
    generateAIReply
};
