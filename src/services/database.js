// 因为我们通过 <script> 标签全局引入了 Dexie，所以可以直接使用 Dexie 这个全局变量。
// 如果未来你通过         ort Dexie from 'dexie';
import Dexie from "dexie";

// 1. 创建数据库实例
// 'mirrorPhoneDB' 是数据库的名称
const db = new Dexie('mirrorPhoneDB');

// 2. 定义数据库结构（表和索引）
// db.version(1) 表示这是数据库的第一个版本。
// .stores({}) 里面定义了所有的表。
db.version(1).stores({
        /**
         * 表：actors (所有实体档案)
         * 存储所有角色、用户人格（Persona）以及群组的静态信息。
         * &id: 主键，必须唯一 (例如: 'user_1', 'char_abc', 'group_xyz')
         * name: 显示名称
         * realName: 真实姓名
         * aliases: 别名数组
         * isGroup: 是否为群组 (0,1)
         * specialCare: 特别关心设置
         * groupIds: 关联的群组ID数组
         * contextMemorySettings: 上下文记忆条数设置
         * status: 当前状态 (包含 text, color, mood, location, outfit)
         * avatarLibrary: 头像库数组（用于用户人格和角色）
         * currentAvatar: 当前使用的头像URL
         * chatBackground: 聊天背景URL
         * worldbookGroupIds: 关联的世界书分组ID数组
         * listenTogetherTotalDuration: 一起听歌总时长（毫秒）
         */
        actors: `
        &id,
        name,
        realName,
        *aliases,
        isGroup,
        *groupIds,
        specialCare,
        contextMemorySettings,
        status,
        *avatarLibrary,
        *worldbookGroupIds,
        currentAvatar,
        chatBackground,
        isHidden,
        listenTogetherTotalDuration,
        ttsProfileId,
        voiceId
        `,

        /**
         * 表：groups (分组信息)
         * 存储所有分组的基本信息。
         * &id: 主键，必须唯一
         * name: 显示名称
         * worldbookIds: 关联的世界书ID数组
         * order: 排序值
         * offlineSummaryEnabled: 是否启用离线总结 (0,1)
         */
        groups: `
        &id,
        name,
        worldbookIds,
        order,
        offlineSummaryEnabled
        `,

        /**
         * 表：conversations (对话状态)
         * 专门用于管理聊天列表的显示和状态，实现高性能加载。
         * &id: 对话ID (私聊时是对方actorId, 群聊时是群组actorId)
         * lastEventTimestamp: 最新可见事件的时间戳，用于排序
         * lastEventContent: 最新可见事件的内容 (JSON对象)
         * unreadCount: 未读消息数
         * summaryState: 摘要状态
         */
        conversations: `
        &id,
        lastEventTimestamp,
        lastEventContent,
        unreadCount,
        summaryState
        `,

        /**
         * 表：events (生命事件流)
         * 记录世界上发生的一切。这是所有角色记忆的唯一来源。
         * ++id: 自增主键
         * timestamp: 事件发生时间，用于全局排序
         * actorId: 事件发起者ID
         * contextId: 事件发生的“地点”ID (私聊/群聊/动态的ID)
         * type: 事件类型 (例如: privateMessage, createPost)
         */
        events: `
        ++id,
        timestamp,
        actorId,
        contextId,
        type,
        [contextId+type],
        [contextId+timestamp]
        `,

        /**
         * 表：relationships (动态关系)
         * 存储角色之间的动态关系和认知。
         * ++id: 自增主键
         * sourceId: 关系发起者ID
         * targetId: 关系目标者ID
         * type: 关系类型 (自由文本，如 "朋友", "欢喜冤家")
         * score: 好感度数值
         * tags: 印象标签数组 (包含 name 和 strength)
         */
        relationships: `
        ++id,
        sourceId,
        targetId,
        type,
        score,
        tags,
        [sourceId+targetId]
        `,

        /**
         * 表：memories (主观记忆库)
         * 存储 AI 对事件进行思考和总结后形成的高级记忆和用户的回忆。
         * ++id: 自增主键
         * actorId: 记忆的拥有者ID
         * type: 记忆的类型 ('diary', 'fact', 'countdown', 'anniversary', 'summary')
         * content: 记忆内容
         * keywords: 用于未来回忆的触发关键词 (数组)
         * timestamp: 记忆创建时间
         * targetDate: 目标日期（用于倒计时和纪念日）
         * relatedActorId: 相关角色ID（用于筛选特定角色的回忆）
         */
        memories: `
        ++id,
        actorId,
        type,
        content,
        *keywords,
        timestamp,
        targetDate,
        relatedActorId,
        [actorId+type],
        [actorId+relatedActorId]`, // *keywords 表示这是一个多值索引，可以高效地按关键词搜索

        /**
         * 表：offlineSummaries (离线总结)
         * 存储AI生成的离线期间的故事和关系变化。
         * ++id: 自增主键
         * timestamp: 总结生成的时间戳
         * groupId: 关联的分组ID
         * summaryContent: 总结的内容 (JSON对象，包含故事和关系变化)
         * relatedEvents: 总结所基于的事件ID数组
         * isDeliveredToAI: 是否已作为上下文注入给AI (0或1)
         * relationshipChanges: 角色间关系变化的详细记录 (JSON数组)
         */
        offlineSummaries: `
            ++id,
            timestamp,
            groupId,
            summaryContent,
            *relatedEvents,
            isDeliveredToAI,
            relationshipChanges,
            [groupId+timestamp]
        `,

        /**
         * 辅助与设置表
         */
        globalSettings: '&id', // 移除具体字段限制，支持动态字段
        apiProfiles: '++id, &profileName',
        ttsProfiles: '++id, &profileName',
        homeScreenLayout: '&id',
        fonts: '++id, &name, url, isDefault',
        /**
         * 表：globalAlbum (全局相册)
         * 存储用户上传的照片，不强制关联到某个角色
         * ++id: 自增主键
         * url: 图片URL
         * description: 图片描述
         */
        globalAlbum: '++id, url, description',

        /**
         * 表：listenTogetherSessions (一起听会话)
         * 存储一起听音乐的会话状态
         * &id: 主键，通常使用 actorId 作为ID
         * actorId: 参与一起听的角色ID
         * isActive: 是否正在进行一起听
         * startTime: 本次会话开始时间
         * lastUpdateTime: 最后更新时间
         */
        listenTogetherSessions: `
        &id,
        actorId,
        isActive,
        startTime,
        lastUpdateTime
        `,

        /**
         * 表：widgetSettings (小组件设置)
         * 存储各个小组件的个性化设置
         * &id: 小组件实例ID
         * type: 小组件类型
         * settings: 设置对象
         */
        widgetSettings: '&id, type, settings',
        stickers: '++id, &url, name, order',
        worldbooks: '&id, name, content, type, keywords, groupId, createTime, updateTime',
        worldbookGroups: '&id, name',
        /**
         * 表：favorites (收藏)
         * 存储用户收藏的动态、聊天记录等
         * ++id: 自增主键
         * eventId: 关联的事件ID
         * eventType: 事件类型
         * authorId: 作者ID
         * authorName: 作者名称
         * content: 收藏内容快照
         * createTime: 收藏时间
         */
        favorites: '++id, eventId, eventType, authorId, authorName, content, createTime, [authorId+eventType]',
        
        /**
         * 表：userSessions (用户会话状态)
         * 追踪用户的在线/离线状态，用于离线总结生成
         * ++id: 自增主键
         * sessionType: 会话类型 ('online', 'offline')
         * startTime: 开始时间戳
         * endTime: 结束时间戳 (null表示正在进行中)
         * duration: 持续时间(毫秒)
         */
        userSessions: '++id, sessionType, startTime, endTime, duration'
        // 你未来可以增加更多的表，例如 'gallery', 'musicPlaylists' 等。
});
export async function initializeDefaultFonts() {
        const defaultFonts = [
                // 默认字体的 family 留空，以便代码回退到系统字体
                { id: 1, name: '默认字体', family: '', url: '', isDefault: 1 },
                { id: 2, name: '思源宋体', family: "'Noto Serif SC'", url: 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap', isDefault: 1 },
                { id: 3, name: '思源黑体', family: "'Noto Sans SC'", url: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&display=swap', isDefault: 1 },
                { id: 4, name: '霞鹜文楷', family: "'LXGW WenKai'", url: 'https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.1.0/style.css', isDefault: 1 },
                { id: 5, name: '龙藏体', family: "'Long Cang'", url: 'https://fonts.googleapis.com/css2?family=Long+Cang&family=Noto+Serif+SC:wght@200..900&display=swap', isDefault: 1 }
        ];
        const count = await db.fonts.count();
        if (count === 0) {
                console.log('Initializing default fonts...');
                // bulkPut 无法正确处理自增主键，改为 bulkAdd
                await db.fonts.bulkAdd(defaultFonts.slice(1)); // 添加除默认字体外的字体
                await db.fonts.put(defaultFonts[0]); // 单独添加ID为1的默认字体
        }
}

export async function initializeGlobalSettings() {
        const settings = await db.globalSettings.get('global');
        if (!settings) {
                console.log('Initializing global settings...');
                await db.globalSettings.put({
                        id: 'global',
                        activeApiProfileId: null,
                        activeTtsProfileId: null,
                        cloudinaryCloudName: '',
                        cloudinaryUploadPreset: '',
                        githubGistId: '',
                        githubToken: '',
                        backgroundActivity: {
                                enabled: true,
                                interval: 100000, // 100秒
                                probability: 50,  // 50%
                                maxChars: 2,
                                personalSettings: {
                                        offlineSimulation: {
                                                enabled: false,
                                                intervalHours: 24 // 24小时生成一次离线总结
                                        }
                                }
                        },
                        // 使用统一的壁纸和主题设置
                        wallpaper: 'linear-gradient(to top, #2c3e50, #bdc3c7)', // 默认渐变壁纸
                        themeColor: '#778088', // 默认主题色
                        themeMode: 'auto', // 默认主题模式
                        activeFontId: 1,
                        appIconSettings: {},
                        // 分离moments头图设置
                        momentsHeaderImage: null, // moments独立头图设置
                        // 使用统一的、包含类型的预设数组
                        wallpaperPresets: [
                                { type: 'image', name: '天空', info: 'https://w.wallhaven.cc/full/og/wallhaven-og3d99.jpg', theme: '#3986ac', isDefault: true },
                                // 渐变类型
                                { "type": "gradient", "name": "黑白", "info": ["#000000", "#ffffff"], "theme": "#808080", "isDefault": true },
                                { "type": "gradient", "name": "红黑", "info": ["#ff0000", "#000000"], "theme": "#b22222", "isDefault": true },
                                { "type": "gradient", "name": "黄紫", "info": ["#ffff00", "#4b0082"], "theme": "#9400d3", "isDefault": true },
                                { "type": "gradient", "name": "青黑", "info": ["#00ffff", "#000000"], "theme": "#008b8b", "isDefault": true },
                                { "type": "gradient", "name": "橙蓝", "info": ["#ffa500", "#00008b"], "theme": "#ff8c00", "isDefault": true },
                                // 动态渐变类型
                                { "type": "animated", "name": "光与影", "info": ["#ffffff", "#000000", 45], "theme": "#808080", "isDefault": true },
                                { "type": "animated", "name": "赛博", "info": ["#ff00ff", "#00ffff", 60], "theme": "#ff00ff", "isDefault": true },
                                { "type": "animated", "name": "熔岩", "info": ["#ff4500", "#000000", 30], "theme": "#ff4500", "isDefault": true },
                                { "type": "animated", "name": "霓虹", "info": ["#39ff14", "#000000", 45], "theme": "#39ff14", "isDefault": true },
                                { "type": "animated", "name": "闪电", "info": ["#ffd700", "#191970", 60], "theme": "#ffd700", "isDefault": true }
                        ]
                });
        } else if (!settings.backgroundActivity) {
                // 如果已存在设置但没有后台活动字段，则添加它
                await db.globalSettings.update('global', {
                        backgroundActivity: {
                                enabled: true,
                                interval: 100000,
                                probability: 50,
                                maxChars: 2,
                                personalSettings: {
                                        offlineSimulation: {
                                                enabled: false,
                                                intervalHours: 24
                                        }
                                }
                        }
                });
        } else if (!settings.backgroundActivity.personalSettings) {
                // 如果存在backgroundActivity但没有personalSettings，则添加
                await db.globalSettings.update('global', {
                        'backgroundActivity.personalSettings': {
                                offlineSimulation: {
                                        enabled: false,
                                        intervalHours: 24
                                }
                        }
                });
        } else {
                // 如果设置已存在，检查并更新动态渐变预设的格式
                let needsUpdate = false;
                if (settings.wallpaperPresets) {
                        settings.wallpaperPresets = settings.wallpaperPresets.map(preset => {
                                if (preset.type === 'animated' && Array.isArray(preset.info) && preset.info.length === 2) {
                                        // 为没有角度的动态渐变预设添加默认角度
                                        needsUpdate = true;
                                        return { ...preset, info: [...preset.info, 45] };
                                }
                                return preset;
                        });

                        if (needsUpdate) {
                                await db.globalSettings.put(settings);
                        }
                }
        }
}

export async function initializeUserEntity() {
        try {
                const userEntity = await db.actors.get('__USER__');
                if (!userEntity) {
                        console.log('Initializing __USER__ entity...');
                        await db.actors.put({
                                id: '__USER__',
                                name: '用户头像库',
                                realName: '',
                                aliases: [],
                                isGroup: 0,
                                groupIds: [],
                                avatarLibrary: [],
                                // 标记为隐藏实体，不在UI中显示
                                isHidden: true
                        });
                }
        } catch (error) {
                console.error('Failed to initialize __USER__ entity:', error);
        }
}

// 3. 导出数据库实例
// 我们导出这个 db 对象，这样应用的任何部分都可以导入它来与数据库通信。
export default db;

// 用户动态相关常量
export const USER_ACTOR_ID = '__USER__'; // 特殊标识符，表示用户操作

/**
 * 获取用户在动态场景中使用的实际人格ID（始终使用默认人格）
 * @returns {Promise<string>} 默认人格ID
 */
export async function resolveUserPersonaForMoments() {
        try {
                const defaultPersona = await db.actors
                        .filter(actor => actor.id && actor.id.startsWith('user_') && actor.isDefault)
                        .first();

                return defaultPersona ? defaultPersona.id : 'user_default';
        } catch (error) {
                console.error('Failed to resolve user persona for moments:', error);
                return 'user_default';
        }
}

// ==================== 用户会话状态管理 ====================

/**
 * 记录用户上线
 */
export async function recordUserOnline() {
        try {
                const now = Date.now();
                
                // 结束之前可能未完成的离线会话
                await db.userSessions
                        .where('sessionType').equals('offline')
                        .and(session => session.endTime === null)
                        .modify(session => {
                                session.endTime = now;
                                session.duration = now - session.startTime;
                        });
                
                // 开始新的在线会话
                await db.userSessions.add({
                        sessionType: 'online',
                        startTime: now,
                        endTime: null,
                        duration: 0
                });
                
                console.log('用户上线记录已保存');
        } catch (error) {
                console.error('记录用户上线失败:', error);
        }
}

/**
 * 记录用户下线
 */
export async function recordUserOffline() {
        try {
                const now = Date.now();
                
                // 结束当前在线会话
                await db.userSessions
                        .where('sessionType').equals('online')
                        .and(session => session.endTime === null)
                        .modify(session => {
                                session.endTime = now;
                                session.duration = now - session.startTime;
                        });
                
                // 开始离线会话
                await db.userSessions.add({
                        sessionType: 'offline',
                        startTime: now,
                        endTime: null,
                        duration: 0
                });
                
                console.log('用户下线记录已保存');
        } catch (error) {
                console.error('记录用户下线失败:', error);
        }
}

/**
 * 获取最后一次离线时间
 * @returns {Promise<number|null>} 离线开始时间戳
 */
export async function getLastOfflineTime() {
        try {
                const lastOfflineSession = await db.userSessions
                        .where('sessionType').equals('offline')
                        .orderBy('startTime')
                        .last();
                
                return lastOfflineSession ? lastOfflineSession.startTime : null;
        } catch (error) {
                console.error('获取最后离线时间失败:', error);
                return null;
        }
}

/**
 * 获取最后一次上线时间
 * @returns {Promise<number|null>} 上线开始时间戳
 */
export async function getLastOnlineTime() {
        try {
                const lastOnlineSession = await db.userSessions
                        .where('sessionType').equals('online')
                        .orderBy('startTime')
                        .last();
                
                return lastOnlineSession ? lastOnlineSession.startTime : null;
        } catch (error) {
                console.error('获取最后上线时间失败:', error);
                return null;
        }
}

/**
 * 获取当前用户状态
 * @returns {Promise<'online'|'offline'>} 当前状态
 */
export async function getCurrentUserStatus() {
        try {
                const lastSession = await db.userSessions
                        .orderBy('startTime')
                        .last();
                
                if (!lastSession || lastSession.endTime !== null) {
                        return 'offline'; // 没有会话或最后会话已结束
                }
                
                return lastSession.sessionType;
        } catch (error) {
                console.error('获取当前用户状态失败:', error);
                return 'offline';
        }
}