/**
 * AI提示词构建工具模块
 * 提供可复用的提示词组件和构建函数
 */

import db from './database.js';
import { formatTimestamp } from '../utils/datetime.js';
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
            const dateStr = date.toLocaleDateString('zh-CN');
            prompt += `\n[${dateStr}] ${memory.content}`;
        });
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
            const timeStr = date.toLocaleString('zh-CN', { 
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
- targetDate 仅在 memoryType="date" 时需要`;
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
        .limit(8) // 增加聊天记录数量
        .toArray();
    recentMessages.reverse();

    // 获取角色最近的所有活动
    const recentActivities = await db.events
        .where('actorId').equals(character.id)
        .reverse()
        .limit(5)
        .toArray();

    // 获取最近的动态
    const recentPosts = await db.events
        .where('type').equals('post')
        .reverse()
        .limit(10)
        .toArray();

    // 获取其他角色的动态（可以点赞评论的内容）
    const otherActorsPosts = recentPosts.filter(post => 
        post.actorId !== character.id && 
        post.actorId !== '__USER__'
    ).slice(0, 5);

    // 获取角色的关系信息
    const relationships = await db.relationships
        .where('sourceId').equals(character.id)
        .toArray();

    let prompt = `你正在扮演 ${character.name}。这是你的后台活动时间，你可以选择主动做一些事情。`;

    // 核心规则
    prompt += `\n\n# 核心规则
1. 你的回复必须是严格的JSON格式
2. **严禁重复**：避免与最近的活动内容相似
3. **可以执行多个动作**：你可以一次性发送多条消息、发布动态并评论其他人的动态等
4. **可以选择跳过**：如果你觉得现在没有合适的事情要做，可以返回 {} 跳过本次活动
5. **要符合角色设定**：所有行为都应该符合你的性格和当前情况`;

    if (character.persona) {
        prompt += `\n\n# 你的角色设定：\n${character.persona}`;
    }

    if (userPersona) {
        prompt += `\n\n# 你正在互动的用户（${userPersona.name}）的信息：\n${userPersona.persona || '用户没有设定特别的人格。'}`;
    }

    // 注入当前时间和情境
    prompt += buildTimeInfo();
    prompt += `\n\n# 当前情境分析
- 现在是后台活动时间，用户可能在忙其他事情
- 你可以选择主动联系用户、发布动态、或与其他内容互动
- 也可以选择什么都不做，安静地等待`;

    // 注入最近聊天记录
    if (recentMessages.length > 0) {
        prompt += `\n\n# 最近聊天记录 (用于了解当前关系状态和避免重复):`;
        for (const msg of recentMessages) {
            const author = msg.actorId === character.id ? character.name : (userPersona?.name || '用户');
            const content = msg.content?.content || '[非文本消息]';
            const time = new Date(msg.timestamp).toLocaleString('zh-CN');
            prompt += `\n- [${time}] ${author}: ${content.substring(0, 60)}${content.length > 60 ? '...' : ''}`;
        }
    }

    // 注入角色最近的活动
    if (recentActivities.length > 0) {
        prompt += `\n\n# 你最近的活动记录 (避免重复):`;
        for (const activity of recentActivities) {
            const content = activity.content?.text || activity.content?.content || '[非文本活动]';
            const time = new Date(activity.timestamp).toLocaleString('zh-CN');
            const type = activity.type === 'post' ? '发布动态' : '发送消息';
            prompt += `\n- [${time}] ${type}: ${content.substring(0, 60)}${content.length > 60 ? '...' : ''}`;
        }
    }

    // 注入可互动的动态
    if (otherActorsPosts.length > 0) {
        prompt += `\n\n# 可以互动的动态 (你可以选择点赞或评论):`;
        for (const post of otherActorsPosts) {
            const author = await db.actors.get(post.actorId);
            const authorName = author ? author.name : '某人';
            const content = post.content?.text || '[动态内容]';
            const time = new Date(post.timestamp).toLocaleString('zh-CN');
            prompt += `\n- [${time}] ${authorName} 发布: ${content.substring(0, 80)}${content.length > 80 ? '...' : ''} (ID: ${post.id})`;
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
    prompt += `\n\n# 输出格式要求
你的回复必须是严格的JSON格式。你可以选择以下任意一种或组合多种行为：

1. **跳过本次活动**：
   {}

2. **发送消息（可发送多条）**：
   {"actions": [{"type": "sendMessage", "message": {"type": "text", "content": "消息内容"}}]}

3. **发布动态**：
   {"actions": [{"type": "createPost", "post": {"text": "动态内容"}}]}

4. **更新状态**：
   {"actions": [{"type": "updateStatus", "status": {"text": "状态文本", "color": "#颜色", "mood": "心情", "location": "位置", "outfit": "装扮"}}]}

5. **点赞动态**：
   {"actions": [{"type": "likePost", "postId": 动态ID}]}

6. **评论动态**：
   {"actions": [{"type": "commentPost", "postId": 动态ID, "comment": "评论内容"}]}

7. **组合多个行为**：
   {"actions": [
     {"type": "createPost", "post": {"text": "发布动态"}},
     {"type": "likePost", "postId": 123},
     {"type": "sendMessage", "message": {"type": "text", "content": "发送消息"}}
   ]}

请只返回JSON，不要包含任何额外的解释或标记。如果你觉得现在没有合适的事情要做，请返回 {}。`;

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
