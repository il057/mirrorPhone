/**
 * AI提示词构建工具模块
 * 提供可复用的提示词组件和构建函数
 */

import db from './database.js';
import { formatTimestamp, formatDate } from '../utils/datetime.js';
import { getDefaultUserPersona, getUserPersonaForGroup } from './userPersonaService.js';
import spotifyService from './spotifyService.js';

/**
 * 构建基础角色信息提示词
 * @param {Object} character - 角色信息
 * @returns {string} 基础角色信息提示词
 */
export function buildCharacterInfo(character) {
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

    return prompt;
}

/**
 * 构建用户人格信息提示词
 * @param {Object} userPersona - 用户人格对象
 * @returns {string} 用户人格信息提示词
 */
export function buildUserPersonaInfo(userPersona) {
    if (!userPersona) return '';
    
    let prompt = `\n\n用户人格信息：`;
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
    
    return prompt;
}

/**
 * 构建关系信息提示词
 * @param {Object} relationship - 关系对象
 * @returns {string} 关系信息提示词
 */
export function buildRelationshipInfo(relationship) {
    if (!relationship) return '';
    
    let prompt = `\n\n与用户的关系：${relationship.type}`;
    prompt += `\n好感度：${relationship.score}/1000`;
    
    if (relationship.tags && relationship.tags.length > 0) {
        prompt += `\n印象标签：${relationship.tags.map(tag => `${tag.name}(${tag.strength})`).join('、')}`;
    }
    
    return prompt;
}

/**
 * 构建世界书信息提示词
 * @param {Object} character - 角色信息
 * @returns {Promise<string>} 世界书信息提示词
 */
export async function buildWorldbookInfo(character) {
    let prompt = '';
    
    // 获取角色相关的世界书内容
    if (character.worldbookGroupIds && character.worldbookGroupIds.length > 0) {
        const worldbooks = await db.worldbooks
            .where('groupId').anyOf(character.worldbookGroupIds)
            .toArray();
            
        if (worldbooks.length > 0) {
            prompt += `\n\n相关世界书：`;
            worldbooks.forEach(wb => {
                prompt += `\n- ${wb.name}: ${wb.content}`;
            });
        }
    }

    // 获取分组相关的世界书
    if (character.groupIds && character.groupIds.length > 0) {
        for (const groupId of character.groupIds) {
            const group = await db.groups.get(groupId);
            if (group && group.worldbookIds && group.worldbookIds.length > 0) {
                const groupWorldbooks = await db.worldbooks
                    .where('id').anyOf(group.worldbookIds)
                    .toArray();
                    
                if (groupWorldbooks.length > 0) {
                    prompt += `\n\n分组"${group.name}"相关世界书：`;
                    groupWorldbooks.forEach(wb => {
                        prompt += `\n- ${wb.name}: ${wb.content}`;
                    });
                }
            }
        }
    }
    
    return prompt;
}

/**
 * 构建记忆信息提示词
 * @param {Object} character - 角色信息
 * @param {string} userMessage - 用户消息（用于关键词匹配）
 * @param {number} memoryLimit - 记忆数量限制
 * @returns {Promise<string>} 记忆信息提示词
 */
export async function buildMemoryInfo(character, userMessage = '', memoryLimit = 10) {
    let prompt = '';
    
    // 获取角色记忆
    const characterMemories = await db.memories
        .where('actorId').equals(character.id)
        .reverse()
        .limit(memoryLimit / 2)
        .toArray();
    
    // 获取用户相关记忆（通过关键词匹配）
    let userRelevantMemories = [];
    if (userMessage) {
        const keywords = userMessage.split(/\s+/).filter(word => word.length > 1);
        if (keywords.length > 0) {
            userRelevantMemories = await db.memories
                .where('actorId').equals('__USER__')
                .filter(memory => 
                    memory.keywords && 
                    memory.keywords.some(keyword => 
                        keywords.some(userWord => 
                            userWord.includes(keyword) || keyword.includes(userWord)
                        )
                    )
                )
                .limit(memoryLimit / 2)
                .toArray();
        }
    }
    
    // 合并记忆
    const allMemories = [...characterMemories, ...userRelevantMemories];
    
    if (allMemories.length > 0) {
        prompt += `\n\n相关记忆：`;
        allMemories.forEach(memory => {
            const date = new Date(memory.timestamp);
            const dateStr = formatDate(date);
            prompt += `\n[${dateStr}] ${memory.content}`;
        });
    }
    
    return prompt;
}

/**
 * 构建离线总结上下文信息提示词
 * @param {Object} character - 角色信息
 * @returns {Promise<string>} 离线总结上下文提示词
 */
export async function buildOfflineSummaryContext(character) {
    let prompt = '';
    
    if (!character.groupIds || character.groupIds.length === 0) {
        return prompt;
    }
    
    // 获取角色所在分组中未交付给AI的离线总结
    let undeliveredSummaries = [];
    if (character.groupIds && character.groupIds.length > 0) {
        undeliveredSummaries = await db.offlineSummaries
            .where('groupId').anyOf(character.groupIds)
            .toArray();
        // 只筛选未交付给AI的总结
        undeliveredSummaries = undeliveredSummaries.filter(summary => summary.isDeliveredToAI === 0);
        // 按时间戳排序
        undeliveredSummaries.sort((a, b) => a.timestamp - b.timestamp);
    }
    
    if (undeliveredSummaries.length > 0) {
        prompt += `\n\n## 📚 最近的离线总结\n`;
        prompt += `以下是你离线期间发生的重要事件总结，这些信息能帮助你了解最近错过的故事：\n\n`;
        
        for (const summary of undeliveredSummaries) {
            const group = await db.groups.get(summary.groupId);
            const summaryDate = formatDate(new Date(summary.timestamp));
            
            prompt += `**${group?.name || '未知分组'} - ${summaryDate}**\n`;
            
            if (summary.summaryContent?.story) {
                prompt += `${summary.summaryContent.story}\n\n`;
            }
            
            // 添加关系变化信息
            if (summary.relationshipChanges && summary.relationshipChanges.length > 0) {
                prompt += `关系变化：\n`;
                for (const change of summary.relationshipChanges) {
                    // 只显示与当前角色相关的关系变化
                    if (change.sourceId === character.id || change.targetId === character.id) {
                        prompt += `- ${change.changeDescription}\n`;
                    }
                }
                prompt += `\n`;
            }
        }
        
        prompt += `💡 请根据这些离线总结中的信息，自然地融入到对话中。你可以提及这些事件，或者基于这些经历来调整你的回应和态度。`;
    }
    
    return prompt;
}

/**
 * 构建日记信息提示词
 * @param {Object} character - 角色信息
 * @param {string} userMessage - 用户消息（用于关键词匹配）
 * @param {number} diaryLimit - 日记数量限制
 * @returns {Promise<string>} 日记信息提示词
 */
export async function buildDiaryInfo(character, userMessage = '', diaryLimit = 5) {
    let prompt = '';
    
    // 获取角色的日记
    const characterDiaries = await db.memories
        .where('actorId').equals(character.id)
        .and(memory => memory.type === 'diary')
        .reverse()
        .limit(diaryLimit)
        .toArray();
    
    if (characterDiaries.length > 0) {
        prompt += `\n\n## 📖 最近的日记片段
        
以下是${character.name}最近的日记内容，这些是ta最私密的想法和感受：`;
        
        characterDiaries.forEach(diary => {
            const date = new Date(diary.timestamp);
            const dateStr = formatDateTime(date, { 
                month: '2-digit', 
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // 处理日记内容格式化标记
            let content = diary.content;
            // 移除格式化标记但保留内容
            content = content
                .replace(/==([^=]+)==/g, '【$1】') // 重要内容用方括号
                .replace(/~~([^~]+)~~/g, '($1)') // 删除线内容用括号
                .replace(/__([^_]+)__/g, '『$1』') // 下划线内容用书名号
                .replace(/\|\|([^|]+)\|\|/g, '▣$1▣'); // 隐藏内容用特殊符号
            
            prompt += `\n\n**${dateStr}**\n${content}`;
            
            if (diary.keywords && diary.keywords.length > 0) {
                prompt += `\n关键词：${diary.keywords.join(', ')}`;
            }
        });
        
        prompt += `\n\n💡 这些日记内容可以帮助你更好地理解${character.name}的内心世界和最近的状态，请适当融入到对话中。`;
    }
    
    return prompt;
}

/**
 * 构建动态信息提示词
 * @param {Object} character - 角色信息
 * @param {number} momentsLimit - 动态数量限制
 * @returns {Promise<string>} 动态信息提示词
 */
export async function buildMomentsInfo(character, momentsLimit = 5) {
    let prompt = '';
    
    // 获取所有动态
    const allMoments = await db.events
        .where('type').equals('post')
        .reverse()
        .toArray();
    
    // 过滤动态：角色只能看到自己分组内其他角色的动态和用户的动态
    const visibleMoments = [];
    for (const moment of allMoments) {
        if (moment.actorId === '__USER__') {
            // 用户的动态总是可见
            visibleMoments.push(moment);
        } else if (moment.actorId !== character.id) {
            // 其他角色的动态，检查是否在同一分组
            const momentActor = await db.actors.get(moment.actorId);
            if (momentActor && momentActor.groupIds && character.groupIds) {
                const hasCommonGroup = momentActor.groupIds.some(groupId => 
                    character.groupIds.includes(groupId)
                );
                if (hasCommonGroup) {
                    visibleMoments.push(moment);
                }
            }
        }
    }
    
    // 限制数量并显示
    const recentMoments = visibleMoments.slice(0, momentsLimit);
    
    if (recentMoments.length > 0) {
        prompt += `\n\n最近动态：`;
        
        for (const moment of recentMoments) {
            const author = moment.actorId === '__USER__' ? '用户' : 
                (await db.actors.get(moment.actorId))?.name || '未知';
            
            const date = new Date(moment.timestamp);
            const timeStr = formatDateTime(date, { 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            const content = moment.content.text || moment.content.content || '[动态内容]';
            prompt += `\n[${timeStr}] ${author}: ${content}`;
        }
    }
    
    return prompt;
}

/**
 * 构建角色当前状态信息提示词
 * @param {Object} character - 角色信息
 * @returns {string} 状态信息提示词
 */
export function buildCharacterStatusInfo(character) {
    let prompt = '';
    
    if (character.status) {
        prompt += `\n\n你的当前状态：`;
        
        if (character.status.text) {
            prompt += `\n- 状态文本：${character.status.text}`;
        }
        
        if (character.status.mood) {
            prompt += `\n- 当前心情：${character.status.mood}`;
        }
        
        if (character.status.location) {
            prompt += `\n- 所在位置：${character.status.location}`;
        }
        
        if (character.status.outfit) {
            prompt += `\n- 当前穿着：${character.status.outfit}`;
        }
        
        if (character.status.color) {
            prompt += `\n- 状态颜色：${character.status.color}`;
        }
        
        if (character.status.innerThoughts) {
            prompt += `\n- 上次的心声：${character.status.innerThoughts}`;
        }
        
        prompt += `\n\n注意：状态信息（包括心声）对用户完全不可见，是你的内部状态记录。`;
    }
    
    return prompt;
}

/**
 * 构建头像库信息提示词
 * @param {Object} character - 角色信息
 * @returns {string} 头像库信息提示词
 */
export function buildAvatarLibraryInfo(character) {
    let prompt = '';
    
    if (character.avatarLibrary && character.avatarLibrary.length > 0) {
        prompt += `\n\n你的头像库：`;
        character.avatarLibrary.forEach((avatar, index) => {
            if (avatar.description) {
                prompt += `\n${index + 1}. ${avatar.description}`;
            }
        });
    }
    
    return prompt;
}

/**
 * 构建功能列表提示词
 * @param {boolean} isSpotifyLoggedIn - Spotify是否已登录
 * @param {Array} stickerList - 可用表情包列表
 * @returns {string} 功能列表提示词
 */
export function buildFunctionsList(isSpotifyLoggedIn = false, stickerList = []) {
    const functions = [
        {
            title: "基础交流",
            items: [
                '**发送文本**: {"type": "text", "content": "文本内容"}',
                '**引用回复**: {"type": "quote_reply", "quote_text": "要引用的消息中的几个关键字", "reply_content": "你的回复内容"}'
            ]
        },
        {
            title: "丰富表达", 
            items: [
                `**发送表情**: {"type": "send_sticker", "name": "表情的描述文字"} 可用表情：${stickerList.length > 0 ? stickerList.join('、') : '暂无表情包'}`,
                '**发送语音**: {"type": "voice", "content": "语音的文字内容"}（注意：语音消息渲染为voice类型）\n  💡 ElevenLabs v3语音增强技巧：在语音内容中使用情感标签来增强表现力！\n  可用标签：[笑] [叹气] [耳语] [兴奋] [惊讶] [失望] [温柔] [严肃] [调皮] [害羞] [生气] [悲伤] [开心] [紧张] [放松] [疑惑] [肯定] [否定] [思考] [赞同]\n  示例：{"type": "voice", "content": "[笑]哈哈，你说得真有趣！[兴奋]我们一起去玩吧！"}',
                '**发送图片**: {"type": "send_photo", "description": "对你想发送的图片内容的详细描述"}'
            ]
        },
        {
            title: "个人状态",
            items: [
                '**更新签名**: {"type": "update_signature", "signature": "新签名"}',
                '**更换头像**: {"type": "change_avatar", "name": "头像名"}',
                '**修改昵称**: {"type": "update_name", "name": "新昵称"}'
            ]
        },
        {
            title: "动态互动",
            items: [
                '**发布文字动态**: {"type": "create_post", "content": "动态文字内容", "postType": "text"}',
                '**发布图片描述动态**: {"type": "create_post", "content": "配图文字", "postType": "image", "imageDescription": "第一张图片的描述\\n第二张图片的描述\\n..."}',
                '**点赞动态**: {"type": "like_post", "postId": "动态ID"}',
                '**评论动态**: {"type": "comment_on_post", "postId": "动态ID", "content": "评论内容"}'
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
 * 构建时间信息提示词
 * @returns {string} 时间信息提示词
 */
export function buildTimeInfo() {
    return `\n\n## ⏰ 当前时间信息
当前时间：${new Date().toLocaleString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit',
    weekday: 'long'
})}
请根据当前时间来调整你的回复内容和语气。`;
}

/**
 * 构建JSON格式要求提示词
 * @returns {string} JSON格式要求提示词
 */
export function buildJsonFormatRequirements() {
    return `\n\n## 🚨 重要：支持多条消息发送 🚨
你可以一次性发送多条消息！有三种格式：

### 格式1：单条消息（基础格式）
{
  "message": {
    "type": "消息类型",
    "content": "消息内容"
    // 其他必需字段...
  },
  "relationship": { /* 关系变化 */ },
  "status": { /* 状态更新 */ }
}

### 格式2：多条消息（推荐使用！）
{
  "messages": [
    {"type": "text", "content": "第一条文字消息"},
    {"type": "voice", "content": "语音消息的文字内容"},
    {"type": "send_sticker", "name": "表情名称"}
    // 可以添加更多消息...
  ],
  "relationship": { /* 关系变化 */ },
  "status": { /* 状态更新 */ }
}

### 格式3：仅状态更新（无消息）
{
  "relationship": { /* 关系变化 */ },
  "status": { /* 状态更新 */ }
}

## 📱 状态更新格式（用户不可见）：
"status": {
  "text": "正在做的事...",
  "mood": "开心/难过/兴奋/平静/紧张/放松等",
  "location": "咖啡厅/家里/学校/公园等",
  "outfit": "休闲装/正装/睡衣/运动装等", 
  "color": "#FF69B4",
  "innerThoughts": "你内心最真实的想法，可以和说出的话不同"
}

**重要说明**：
- 状态信息对用户完全不可见，是你的内部状态
- "innerThoughts"（心声）是你内心最真实的想法，可以表达真实情感
- 即使表面上很开心，心声里可以表达真实的困扰或想法
- 根据当前时间、对话内容、心情变化等因素，适时更新你的状态`;
}

/**
 * 构建关系变化格式提示词
 * @returns {string} 关系变化格式提示词
 */
export function buildRelationshipChangeFormat() {
    return `\n\n## 关系变化格式：
"relationship": {
  "scoreChange": 数字, // 好感度变化 (-100到+100)
  "typeChange": "字符串或null", // 关系类型变化，如"朋友"、"恋人"等
  "newTags": [{"name": "标签名", "strength": 1-10}], // 新增的印象标签
  "removeTags": ["要移除的标签名"] // 要移除的标签
}`;
}

/**
 * 构建记忆创建说明提示词
 * @returns {string} 记忆创建说明提示词
 */
export function buildMemoryCreationInstructions() {
    return `\n\n## 📝 记忆创建功能
你可以根据对话内容为用户创建重要的记忆，这些记忆将帮助在未来的对话中提供更好的连贯性：

### 记忆类型：
- **事实记忆** (type: "fact"): 记录重要的事实信息、偏好、经历等
- **日期记忆** (type: "date"): 记录重要日期、纪念日、倒计时等

### 创建记忆格式：
{"type": "create_memory", "memoryType": "fact|date", "content": "记忆内容", "keywords": ["关键词1", "关键词2"], "targetDate": "YYYY-MM-DD"}

### 记忆创建时机：
- 用户分享重要的个人信息时
- 提到重要的日期、事件、计划时
- 表达喜好、兴趣、习惯时
- 关键词应选择便于日后匹配的词汇
- targetDate 仅在 memoryType="date" 时需要

## 📖 日记创建功能
在特定情况下，你可以主动创建日记来记录重要的内心感受和体验：

### 日记创建格式：
{"type": "create_diary", "content": "详细的日记内容", "keywords": ["关键词1", "关键词2"]}

### 日记内容要求：
- **内容与长度**: 日记应该是一段【结构完整、内容详实】的段落，至少包含**150-300字**。
- 请详细描述事件的【起因、经过】，以及你【最真实、最具体】的心理活动和思考。不要只做简单的陈述，要展现你的情感变化和内心矛盾。

### 格式化标记（请谨慎、少量地使用）：
- \`== 文字 ==\`: 用于标记让你【开心、重要或需要强调】的核心语句。
- \`~~ 文字 ~~\`: 用于标记你【希望忘记、但又忍不住想起】的矛盾内容。
- \`__ 文字 __\`: 用于标记你【暗下决心或默默记在心里】的内容。
- \`|| 文字 ||\`: 用于标记你【不敢直面或隐藏起来】的秘密想法。

### 日记创建时机：
- 经历了重要的情感事件后
- 内心有强烈感受需要记录时
- 发生了值得深度反思的事情
- 与用户有重要互动或关系变化时
- 关键词应提炼出3-5个核心词汇`;
}

/**
 * 获取有效的用户人格ID
 * @param {Object} character - 角色信息
 * @returns {Promise<string>} 有效的用户人格ID
 */
export async function getEffectiveUserPersona(character) {
    let userPersona = null;
    
    if (character.groupIds && character.groupIds.length > 0) {
        // 有分组，尝试获取分组绑定的用户人格
        userPersona = await getUserPersonaForGroup(character.groupIds[0]);
    }
    
    // 如果没有分组绑定的人格，使用默认人格
    if (!userPersona) {
        userPersona = await getDefaultUserPersona();
    }
    
    return userPersona;
}

/**
 * 构建完整的聊天系统提示词
 * @param {Object} character - 角色信息
 * @param {string} userId - 用户人格ID（不是 __USER__）
 * @param {Object} contextSettings - 上下文设置
 * @param {Array} recentEvents - 最近的事件列表
 * @param {string} newUserMessage - 新用户消息（用于记忆匹配）
 * @returns {Promise<string>} 完整的系统提示词
 */
export async function buildChatSystemPrompt(character, userId, contextSettings, recentEvents = [], newUserMessage = '') {
    // 获取用户人格信息
    let userPersona = null;
    if (userId !== '__USER__') {
        // 如果提供了具体的用户人格ID，直接获取
        userPersona = await db.actors.get(userId);
        console.log('构建系统提示词 - 使用指定用户人格:', userPersona?.name || '未找到', '(ID:', userId, ')');
    } else {
        // 如果是__USER__，获取默认用户人格
        userPersona = await getDefaultUserPersona();
        console.log('构建系统提示词 - 使用默认用户人格:', userPersona?.name || '未找到');
    }
    
    let prompt = buildCharacterInfo(character);
    
    // 核心规则
    prompt += `\n\n# 核心规则\n你的所有回复都必须严格遵循指定的JSON格式。绝对不允许直接返回纯文本或任何JSON格式之外的内容。你的唯一输出就是一个完整的、可被解析的JSON对象。`;
    
    // 用户人格信息
    prompt += buildUserPersonaInfo(userPersona);
    
    // 关系信息
    const relationship = await db.relationships
        .where('sourceId').equals(character.id)
        .and(rel => rel.targetId === '__USER__')
        .first();
    prompt += buildRelationshipInfo(relationship);
    
    // 世界书信息
    prompt += await buildWorldbookInfo(character);
    
    // 记忆信息
    if (contextSettings.memory > 0) {
        prompt += await buildMemoryInfo(character, newUserMessage, contextSettings.memory);
    }

    // 离线总结信息（如果角色所在分组有未交付的离线总结）
    prompt += await buildOfflineSummaryContext(character);
    
    // 日记信息
    if (contextSettings.diary > 0) {
        prompt += await buildDiaryInfo(character, newUserMessage, contextSettings.diary);
    }
    
    // 动态信息
    if (contextSettings.moments > 0) {
        prompt += await buildMomentsInfo(character, contextSettings.moments);
    }
    
    // 头像库信息
    prompt += buildAvatarLibraryInfo(character);
    
    // 角色当前状态信息
    prompt += buildCharacterStatusInfo(character);
    
    // 时间信息
    prompt += buildTimeInfo();
    
    // JSON格式要求
    prompt += buildJsonFormatRequirements();
    
    // 功能列表
    const availableStickers = await db.stickers.orderBy('order').toArray();
    const stickerList = availableStickers.map(s => `${s.name}(${s.id})`).slice(0, 20);
    const isSpotifyLoggedIn = spotifyService.isLoggedIn();
    prompt += `\n\n## 可用功能列表：\n${buildFunctionsList(isSpotifyLoggedIn, stickerList)}`;
    
    // 关系变化格式
    prompt += buildRelationshipChangeFormat();
    
    // 重要注意事项
    prompt += `\n\n## 重要注意事项：
1. 💡 **强烈建议使用多条消息格式**，让对话更生动自然！
   例如：先发文字回应，再发表情，最后发语音
2. 📱 **状态更新指南**：根据当前时间、对话内容、心情变化等因素，适时更新你的状态
   - 早上可能更新为"刚起床"、"准备上班"等
   - 晚上可能更新为"准备睡觉"、"在看书"等
   - 对话中情绪变化时更新心情和心声
   - 心声要真实反映内心想法，可以和表面话语不同
3. 😀 表情包使用要符合情境，只能使用上述列表中的名称
4. 💰 支付功能请合理使用，金额建议在1-999元之间
5. 💗 好感度变化要合理：普通对话±1-5，特殊互动±5-20，重大事件±20-50
6. 🏷️ 标签要具体且有意义，强度1-10表示印象深度
7. 📝 **回忆创建规则**：当对话中出现特别有意义、有纪念价值或值得记住的重要信息时，你可以通过关系变化机制提示用户。但不要过度使用，只有真正重要的时刻才值得记录。
${isSpotifyLoggedIn ? '8. 🎵 音乐功能仅在Spotify已登录时可用，所有音乐推荐必须是真实可播放的歌曲\n' : ''}${isSpotifyLoggedIn ? '9' : '8'}. 🎭 回复要符合角色性格，自然流畅
${isSpotifyLoggedIn ? '10' : '9'}. ✅ 每条消息都必须有完整且正确的字段，不要遗漏必需的属性
${isSpotifyLoggedIn ? '11' : '10'}. 📊 多条消息示例（这正是我们推荐的方式）：
   {
     "messages": [
       {"type": "text", "content": "哈哈，你说得对！"},
       {"type": "voice", "content": "这个想法真的很棒呢"},
       {"type": "send_sticker", "name": "开心"}
     ],
     "relationship": {"scoreChange": 3},
     "status": {
       "mood": "开心",
       "innerThoughts": "今天和用户聊天真的很愉快，感觉关系更近了"
     }
   }`;
   
    // 记忆创建说明
    prompt += buildMemoryCreationInstructions();
    
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
 * 构建后台活动提示词
 * @param {Object} character - 角色信息
 * @returns {Promise<string>} 后台活动系统提示词
 */
export async function buildBackgroundActivityPrompt(character) {
    // 获取用户人格信息
    const userPersona = await getEffectiveUserPersona(character);
    
    // 获取更多的上下文信息
    const recentMessages = await db.events
        .where('contextId').equals(character.id)
        .and(event => event.type === 'privateMessage')
        .reverse()
        .limit(8)
        .toArray();
    recentMessages.reverse();

    // 获取角色最近的所有活动
    const recentActivities = await db.events
        .where('actorId').equals(character.id)
        .reverse()
        .limit(5)
        .toArray();

    // 获取最近的动态（包含完整的postId信息）
    const recentPosts = await db.events
        .where('type').equals('post')
        .reverse()
        .limit(10)
        .toArray();

    // 获取其他角色和指定人员的动态（可以点赞评论的内容）
    const otherActorsPosts = recentPosts.filter(post => 
        post.actorId !== character.id
    ).slice(0, 5);

    // 获取角色的关系信息
    const relationships = await db.relationships
        .where('sourceId').equals(character.id)
        .toArray();

    let prompt = `你正在扮演 ${character.name}。这是你的后台活动时间，你可以选择主动做一些事情。`;

    // 核心规则
    prompt += `\n\n# 核心规则
1. 你的回复必须是严格的JSON格式
2. **明确对话对象**：你正在与 ${userPersona?.name || '一个朋友'} 互动，所有私聊消息都是发给ta的
3. **严禁重复**：避免与最近的活动内容相似
4. **可以执行多个动作**：你可以一次性发送多条消息、发布动态并评论其他人的动态等
5. **可以选择跳过**：如果你觉得现在没有合适的事情要做，可以返回 {} 跳过本次活动
6. **要符合角色设定**：所有行为都应该符合你的性格和当前情况`;

    if (character.persona) {
        prompt += `\n\n# 你的角色设定：\n${character.persona}`;
    }

    if (userPersona) {
        prompt += `\n\n# 你的对话伙伴 ${userPersona.name} 的信息：\n${userPersona.persona || '这个人没有设定特别的人格。'}`;
        prompt += `\n注意：当你主动发起对话时，是在与 ${userPersona.name} 交流，不是与其他朋友。`;
    }

    // 注入当前时间和情境
    prompt += buildTimeInfo();
    prompt += `\n\n# 当前情境分析
- 现在是后台活动时间，${userPersona?.name || '对方'} 可能在忙其他事情
- 你可以选择主动联系 ${userPersona?.name || '对方'}、发布动态、或与其他内容互动
- 也可以选择什么都不做，安静地等待`;

    // 注入最近聊天记录
    if (recentMessages.length > 0) {
        prompt += `\n\n# 与 ${userPersona?.name || '对方'} 的最近聊天记录 (用于了解当前关系状态和避免重复):`;
        for (const msg of recentMessages) {
            const author = msg.actorId === character.id ? character.name : (userPersona?.name || '对方');
            const content = msg.content?.content || '[非文本消息]';
            const time = formatDateTime(new Date(msg.timestamp));
            prompt += `\n- [${time}] ${author}: ${content.substring(0, 60)}${content.length > 60 ? '...' : ''}`;
        }
    }

    // 注入角色最近的活动
    if (recentActivities.length > 0) {
        prompt += `\n\n# 你最近的活动记录 (避免重复):`;
        for (const activity of recentActivities) {
            const content = activity.content?.text || activity.content?.content || '[非文本活动]';
            const time = formatDateTime(new Date(activity.timestamp));
            const type = activity.type === 'post' ? '发布动态' : activity.type === 'privateMessage' ? '发送消息' : '其他活动';
            prompt += `\n- [${time}] ${type}: ${content.substring(0, 60)}${content.length > 60 ? '...' : ''}`;
        }
    }

    // 注入可互动的动态（包含正确的postId）
    if (otherActorsPosts.length > 0) {
        prompt += `\n\n# 最近的动态 (你可以点赞或评论):`;
        for (const post of otherActorsPosts) {
            const authorName = post.actorId === '__USER__' ? (userPersona?.name || '对方') :
                               (await db.actors.get(post.actorId))?.name || '未知';
            const content = post.content?.text || post.content?.content || '[动态内容]';
            const time = formatDateTime(new Date(post.timestamp));
            
            // 获取已有的点赞和评论数量
            const likes = await db.events.where('contextId').equals(post.contextId).and(e => e.type === 'like').count();
            const comments = await db.events.where('contextId').equals(post.contextId).and(e => e.type === 'comment').count();
            
            prompt += `\n- [${time}] ${authorName}: ${content.substring(0, 80)}${content.length > 80 ? '...' : ''}`;
            prompt += `\n  动态ID: ${post.contextId}, 点赞数: ${likes}, 评论数: ${comments}`;
        }
    }

    // 注入关系信息
    if (relationships.length > 0) {
        prompt += `\n\n# 你的人际关系状态:`;
        for (const rel of relationships) {
            const target = await db.actors.get(rel.targetId);
            if (target && target.id !== '__USER__') {
                prompt += `\n- 与${target.name}: ${rel.type || '朋友'} (好感度: ${rel.score || 0})`;
                if (rel.tags && rel.tags.length > 0) {
                    const tagNames = rel.tags.map(tag => tag.name || tag).join('、');
                    prompt += ` - 印象: ${tagNames}`;
                }
            }
        }
    }

    // 添加世界书内容
    prompt += await buildWorldbookInfo(character);

    // 输出格式要求
    prompt += `\n\n# 🚨 重要：输出格式要求 🚨
你的回复必须是严格的JSON格式，只能返回以下格式之一，不要包含任何额外的文字、解释或markdown标记：

## 格式1：跳过本次活动
{}

## 格式2：执行单个动作
{"actions": [{"type": "动作类型", "相关参数": "参数值"}]}

## 格式3：执行多个动作
{"actions": [
  {"type": "动作类型1", "相关参数1": "参数值1"},
  {"type": "动作类型2", "相关参数2": "参数值2"}
]}

## 支持的动作类型：
- **发送消息**：{"type": "sendMessage", "message": {"type": "text", "content": "消息内容"}}
- **发布动态**：{"type": "createPost", "post": {"text": "动态内容"}}
- **更新状态**：{"type": "updateStatus", "status": {"text": "状态文本", "color": "#颜色", "mood": "心情"}}
- **点赞动态**：{"type": "likePost", "postId": "动态的contextId（如：post_1234567890_abc123）"}
- **评论动态**：{"type": "commentPost", "postId": "动态的contextId（如：post_1234567890_abc123）", "comment": "评论内容"}

## 重要提醒：
1. 只返回JSON对象，不要有其他内容
2. 不要使用markdown代码块包装
3. 确保JSON格式正确
4. 如果不想做任何事，返回 {}
5. 动态ID必须是完整的contextId字符串，不要使用数字ID`;

    return prompt;
}

/**
 * 构建离线故事生成提示词
 * @param {Object} group - 分组信息
 * @param {Array} members - 分组成员
 * @param {number} offlineStartTime - 离线开始时间戳
 * @param {number} currentTime - 当前时间戳
 * @returns {Promise<string>}
 */
export async function buildOfflineStoryPrompt(group, members, offlineStartTime, currentTime) {
        const timeSpan = currentTime - offlineStartTime;
        const hours = Math.floor(timeSpan / (1000 * 60 * 60));
        const currentTimeStr = new Date(currentTime).toLocaleString('zh-CN');
        const startTimeStr = new Date(offlineStartTime).toLocaleString('zh-CN');
        
        let prompt = `# 任务：离线故事创作\n`;
        prompt += `你是一个创意故事作家，需要基于角色的性格和关系，为分组 "${group.name}" 创作一个发生在用户离线期间的故事。\n\n`;

        // 时间信息
        prompt += `## 时间设定\n`;
        prompt += `- 故事发生时间: ${startTimeStr} - ${currentTimeStr}\n`;
        prompt += `- 时间跨度: 约${hours}小时\n\n`;

        // 获取用户人格信息
        const userPersona = await db.actors.filter(actor => 
                actor.id && actor.id.startsWith('user_') && actor.isDefault
        ).first();

        // 分组信息
        prompt += `## 角色信息\n`;
        prompt += `分组名称: ${group.name}\n`;
        prompt += `角色成员:\n`;
        for (const member of members) {
                prompt += `- **${member.name}**: ${member.persona || '无详细设定'}\n`;
                if (member.realName && member.realName !== member.name) {
                        prompt += `  (真名: ${member.realName})\n`;
                }
                if (member.birthday) {
                        prompt += `  生日: ${member.birthday}\n`;
                }
                if (member.gender) {
                        prompt += `  性别: ${member.gender}\n`;
                }
        }

        // 用户信息
        if (userPersona) {
                prompt += `\n用户信息:\n`;
                prompt += `- **${userPersona.name}** (用户本人，目前不在线)\n`;
                if (userPersona.persona) {
                        prompt += `  设定: ${userPersona.persona}\n`;
                }
                prompt += `注意：角色们都认识用户，可以在故事中提及用户，但用户不会直接参与对话。\n`;
        }

        // 当前角色间关系状态
        prompt += `\n## 当前关系状态\n`;
        for (let i = 0; i < members.length; i++) {
                for (let j = i + 1; j < members.length; j++) {
                        const memberA = members[i];
                        const memberB = members[j];
                        
                        // 获取双向关系
                        const relationshipAB = await db.relationships
                                .where('[sourceId+targetId]').equals([memberA.id, memberB.id])
                                .first();
                        const relationshipBA = await db.relationships
                                .where('[sourceId+targetId]').equals([memberB.id, memberA.id])
                                .first();

                        prompt += `**${memberA.name} 与 ${memberB.name} 的关系:**\n`;
                        prompt += `- ${memberA.name} → ${memberB.name}: `;
                        if (relationshipAB) {
                                prompt += `${relationshipAB.type || '普通关系'} (好感度: ${relationshipAB.score || 0})`;
                                if (relationshipAB.tags && relationshipAB.tags.length > 0) {
                                        prompt += `, 印象: ${relationshipAB.tags.map(tag => tag.name).join('、')}`;
                                }
                        } else {
                                prompt += `尚未建立关系`;
                        }
                        prompt += `\n`;

                        prompt += `- ${memberB.name} → ${memberA.name}: `;
                        if (relationshipBA) {
                                prompt += `${relationshipBA.type || '普通关系'} (好感度: ${relationshipBA.score || 0})`;
                                if (relationshipBA.tags && relationshipBA.tags.length > 0) {
                                        prompt += `, 印象: ${relationshipBA.tags.map(tag => tag.name).join('、')}`;
                                }
                        } else {
                                prompt += `尚未建立关系`;
                        }
                        prompt += `\n\n`;
                }
        }

        // 故事创作要求
        prompt += `## 创作要求\n`;
        
        if (members.length === 1) {
                prompt += `由于分组内只有 **${members[0].name}** 一人，请创作一个关于他/她个人经历的故事。\n`;
                prompt += `故事应该体现角色的性格特点，可以包括：\n`;
                prompt += `- 个人思考和感悟\n`;
                prompt += `- 日常生活片段\n`;
                prompt += `- 对用户的想念或关心\n`;
                prompt += `- 个人成长或变化\n\n`;
        } else {
                prompt += `请创作一个角色间互动的故事，要求：\n`;
                prompt += `1. **基于现有关系**: 故事应该符合角色间的当前关系状态\n`;
                prompt += `2. **性格一致**: 每个角色的行为应该符合其性格设定\n`;
                prompt += `3. **自然发展**: 故事情节应该自然流畅，不要过于戏剧化\n`;
                prompt += `4. **关系变化**: 故事可以推动角色关系的发展，但变化要合理\n`;
                prompt += `5. **时间合理**: 故事内容要符合${hours}小时的时间跨度\n\n`;
                
                prompt += `故事可以包括但不限于：\n`;
                prompt += `- 日常对话和互动\n`;
                prompt += `- 共同活动或经历\n`;
                prompt += `- 情感交流和理解\n`;
                prompt += `- 小的冲突和解决\n`;
                prompt += `- 对用户的讨论或关心\n\n`;
        }

        // 输出格式
        if (members.length === 1) {
                prompt += `## 输出格式 (单人模式)\n`;
                prompt += `{
  "story": "以${members[0].name}的视角，描述他/她的个人经历、思考和感受...",
  "relationshipChanges": []
}`;
        } else {
                prompt += `## 输出格式 (多人模式)\n`;
                prompt += `{
  "story": "完整的故事内容，包含角色对话和行为描述...",
  "relationshipChanges": [
    {
      "sourceId": "角色A的ID",
      "targetId": "角色B的ID",
      "changeDescription": "关系变化的原因和描述",
      "scoreChange": "好感度变化值 (-20到+20范围内)",
      "typeChange": "新的关系类型（如果有变化）",
      "newTags": [{"name": "新印象标签", "strength": "1-10"}],
      "removeTags": ["要移除的印象标签"]
    }
  ]
}`;
        }

        prompt += `\n\n**请严格按照以上JSON格式输出，创作一个有趣且符合角色设定的故事。**`;
        return prompt;
}

/**
 * 构建基于事件的离线总结提示词 (原版本，保留备用)
 * @param {Object} group - 分组信息
 * @param {Array} members - 分组成员
 * @param {Array} events - 相关事件
 * @returns {Promise<string>}
 */
export async function buildOfflineSummaryPrompt(group, members, events, sinceTimestamp) {
        const now = Date.now();
        const timeSpan = now - sinceTimestamp;
        const hours = Math.floor(timeSpan / (1000 * 60 * 60));
        const currentTime = new Date().toLocaleString('zh-CN');
        const startTime = new Date(sinceTimestamp).toLocaleString('zh-CN');
        
        let prompt = `# 任务：离线总结生成器\n`;
        prompt += `你是一个故事讲述者，需要根据以下信息，为用户总结在他/她离线期间，角色分组 "${group.name}" 内发生的事情。\n\n`;

        // 时间信息
        prompt += `## 时间信息\n`;
        prompt += `- 当前时间: ${currentTime}\n`;
        prompt += `- 离线开始时间: ${startTime}\n`;
        prompt += `- 时间跨度: 约${hours}小时\n`;
        prompt += `- 事件总数: ${events.length}个\n\n`;

        // 获取用户人格信息
        const userPersona = await db.actors.filter(actor => 
                actor.id && actor.id.startsWith('user_') && actor.isDefault
        ).first();

        // 分组信息
        prompt += `## 分组信息\n- 分组名称: ${group.name}\n- 成员: ${members.map(m => m.name).join('、')}\n\n`;

        // 用户人格信息（让角色知道用户的存在，但不用更新关系）
        if (userPersona) {
                prompt += `## 用户信息\n`;
                prompt += `- 用户名: ${userPersona.name}\n`;
                if (userPersona.persona) {
                        prompt += `- 用户设定: ${userPersona.persona}\n`;
                }
                prompt += `注意：用户是这个世界中的重要存在，角色们都认识并了解用户。但离线总结不需要更新角色与用户的关系。\n\n`;
        }

        // 角色信息和当前关系状态
        prompt += `## 角色设定\n`;
        for (const member of members) {
                prompt += `- **${member.name}**: ${member.persona || '无详细设定'}\n`;
        }

        // 当前角色间关系状态
        prompt += `\n## 当前角色间关系状态\n`;
        for (let i = 0; i < members.length; i++) {
                for (let j = i + 1; j < members.length; j++) {
                        const memberA = members[i];
                        const memberB = members[j];
                        
                        // 获取双向关系
                        const relationshipAB = await db.relationships
                                .where('[sourceId+targetId]').equals([memberA.id, memberB.id])
                                .first();
                        const relationshipBA = await db.relationships
                                .where('[sourceId+targetId]').equals([memberB.id, memberA.id])
                                .first();

                        prompt += `- **${memberA.name} → ${memberB.name}**: `;
                        if (relationshipAB) {
                                prompt += `关系类型: ${relationshipAB.type || '未定义'}, 好感度: ${relationshipAB.score || 0}`;
                                if (relationshipAB.tags && relationshipAB.tags.length > 0) {
                                        prompt += `, 印象标签: ${relationshipAB.tags.map(tag => `${tag.name}(${tag.strength})`).join('、')}`;
                                }
                        } else {
                                prompt += `关系未建立`;
                        }
                        prompt += `\n`;

                        prompt += `- **${memberB.name} → ${memberA.name}**: `;
                        if (relationshipBA) {
                                prompt += `关系类型: ${relationshipBA.type || '未定义'}, 好感度: ${relationshipBA.score || 0}`;
                                if (relationshipBA.tags && relationshipBA.tags.length > 0) {
                                        prompt += `, 印象标签: ${relationshipBA.tags.map(tag => `${tag.name}(${tag.strength})`).join('、')}`;
                                }
                        } else {
                                prompt += `关系未建立`;
                        }
                        prompt += `\n`;
                }
        }

        // 离线期间发生的事件（可选）
        if (events.length > 0) {
                prompt += `\n## 离线期间的关键事件记录\n`;
                for (const event of events) {
                        const author = members.find(m => m.id === event.actorId)?.name || '未知';
                        const timestamp = new Date(event.timestamp).toLocaleString('zh-CN');
                        const content = event.content.content || event.content.text || '[非文本事件]';
                        prompt += `- [${timestamp}] ${author}: ${content}\n`;
                }
        }

        // 单人分组特殊处理
        if (members.length === 1) {
                prompt += `\n# 输出要求 (单人模式)\n`;
                prompt += `由于分组内只有 **${members[0].name}** 一人，请以他/她的口吻，写一封给用户的信，讲述他/她最近的个人经历、思考和感受。\n`;
                prompt += `格式如下：\n`;
                prompt += `{
  "story": "信件或日记风格的文本内容...",
  "relationshipChanges": []
}`;
        } else { // 多人分组处理
                prompt += `\n# 输出要求 (多人模式)\n`;
                prompt += `请根据以上信息，创作一段故事，描述成员之间发生的互动。然后，根据故事内容，总结角色之间的关系变化。\n`;
                prompt += `\n**关系变化规则：**\n`;
                prompt += `- 关系是双向的：如果A对B的印象改变，B对A的印象也可能相应改变\n`;
                prompt += `- 好感度变化范围：-50到+50（一次性变化不宜过大）\n`;
                prompt += `- 印象标签强度：1-10（数字越大印象越深刻）\n`;
                prompt += `- 只更新确实发生变化的关系，没有变化的关系不需要记录\n\n`;
                
                prompt += `格式如下：\n`;
                prompt += `{
  "story": "故事文本内容，描述角色间的互动和发生的事件...",
  "relationshipChanges": [
    {
      "sourceId": "角色A的ID",
      "targetId": "角色B的ID", 
      "changeDescription": "因为[具体事件]，角色A对角色B的印象发生了变化",
      "scoreChange": 15,
      "typeChange": "朋友",
      "newTags": [{"name": "可靠", "strength": 7}],
      "removeTags": ["陌生"]
    },
    {
      "sourceId": "角色B的ID",
      "targetId": "角色A的ID",
      "changeDescription": "相应地，角色B对角色A也产生了新的看法", 
      "scoreChange": 10,
      "typeChange": null,
      "newTags": [{"name": "温柔", "strength": 6}],
      "removeTags": []
    }
  ]
}`;
        }

        prompt += `\n\n**请严格按照以上JSON格式输出，不要添加任何额外的解释。**`;
        return prompt;
}

/**
 * 分析最近的消息，检测需要特殊处理的功能
 * @param {Array} recentEvents - 最近的事件列表
 * @param {string} userId - 用户ID
 * @returns {Array} 特殊任务列表
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
 * @param {Array} recentEvents - 最近的事件列表
 * @param {string} userId - 用户ID
 * @returns {Array} 最近的用户事件
 */
function getRecentUserEvents(recentEvents, userId) {
    // 获取最近的5轮对话中的用户事件
    const recentLimit = 5;
    const userEvents = recentEvents
        .filter(event => event.actorId === userId)
        .slice(-recentLimit); // 获取最近的N条用户消息
    
    return userEvents;
}

/**
 * 获取任务处理器
 * @param {Object} content - 消息内容
 * @returns {Function|null} 任务处理器函数
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
    if (content?.type === 'post') {
        return buildPostInteractionTask;
    }
    return null;
}

/**
 * 构建转账任务
 * @param {Object} event - 事件对象
 * @returns {string} 转账任务提示
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
 * @param {Object} event - 事件对象
 * @returns {string} 代付任务提示
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
 * @param {Object} event - 事件对象
 * @returns {string} 通话任务提示
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
 * @param {Object} event - 事件对象
 * @returns {string} 一起听任务提示
 */
function buildListenTogetherTask(event) {
    if (spotifyService.isLoggedIn()) {
        return `
# 临时任务：如何回应一起听邀请
用户邀请你一起听音乐。你可以：
- **接受邀请**: {"type": "accept_listen_together", "target_timestamp": ${event.timestamp}}
- **拒绝邀请**: {"type": "decline_listen_together", "target_timestamp": ${event.timestamp}, "reason": "原因"}`;
    } else {
        return `
# 临时任务：回应一起听邀请（Spotify未登录）
用户邀请你一起听音乐，但Spotify未登录。告诉用户需要先连接Spotify。`;
    }
}

/**
 * 构建转发消息任务
 * @param {Object} event - 事件对象
 * @returns {string} 转发消息任务提示
 */
function buildForwardedMessageTask(event) {
    const content = event.content;
    const fromCharName = content.fromCharName || '某个角色';
    const userPersonaName = content.userPersonaName || '用户';
    
    // 获取与来源角色的关系信息来调整回复语气
    let relationshipHint = '';
    if (content.fromCharId) {
        relationshipHint = `注意：你需要参考自己和${fromCharName}的好感度关系来调整回复的语气和态度。如果关系好可以更亲近，关系一般可以更中性。`;
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
 * 构建动态互动任务
 * @param {Object} event - 事件对象
 * @returns {string} 动态互动任务提示
 */
function buildPostInteractionTask(event) {
    const postId = event.contextId;
    const postContent = event.content?.text || '动态内容';
    
    return `
# 临时任务：可以与动态互动
刚刚有新的动态发布：${postContent}
你可以选择与这条动态互动：
- **点赞动态**: {"type": "like_post", "postId": "${postId}"}
- **评论动态**: {"type": "comment_on_post", "postId": "${postId}", "content": "你的评论内容"}
注意：动态ID为 ${postId}`;
}

/**
 * 检测是否正在一起听
 * @param {Array} recentEvents - 最近的事件列表
 * @returns {boolean} 是否正在一起听
 */
function isListeningTogether(recentEvents) {
    return recentEvents.some(event => 
        event.content?.type === 'accept_listen_together' ||
        (event.content?.type === 'listen-together-invite' && event.content?.accepted)
    );
}

/**
 * 构建音乐控制任务
 * @returns {string} 音乐控制任务提示
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
