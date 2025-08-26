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
         * &id: 主键，必须唯一 (例如: 'user_persona_1', 'char_abc', 'group_xyz')
         * name: 显示名称
         * realName: 真实姓名
         * aliases: 别名数组
         * isGroup: 是否为群组 (0,1)
         * groupIds: 关联的群组ID数组
         * contextMemorySettings: 上下文记忆条数设置
         * avatarLibrary: 头像库数组（用于用户人格和角色）
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
        *avatarLibrary
        `,

        /**
         * 表：groups (分组信息)
         * 存储所有分组的基本信息。
         * &id: 主键，必须唯一
         * name: 显示名称
         * worldbookIds: 关联的世界书ID数组
         */
        groups: `
        &id,
        name,
        worldbookIds,
        order
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
         * 存储 AI 对事件进行思考和总结后形成的高级记忆。
         * ++id: 自增主键
         * actorId: 记忆的拥有者ID
         * type: 记忆的类型 ('diary', 'fact', 'countdown', 'summary')
         * keywords: 用于未来回忆的触发关键词 (数组)
         * relatedEventIds: 关联的原始事件ID (数组)
         */
        memories: `
        ++id,
        actorId,
        type,
        *keywords`, // *keywords 表示这是一个多值索引，可以高效地按关键词搜索

        /**
         * 辅助与设置表
         */
        globalSettings: '&id, activeApiProfileId, activeTtsProfileId',
        apiProfiles: '++id, &profileName',
        ttsProfiles: '++id, &profileName',
        homeScreenLayout: '&id',
        fonts: '++id, &name, url, isDefault',
        /**
         * 表：globalAlbum (全局相册)
         * 存储用户上传的照片，不强制关联到某个角色
         * ++id: 自增主键
         * url: 图片URL
         */
        globalAlbum: '++id, url',

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
        worldbookGroups: '&id, name'
        // 你未来可以增加更多的表，例如 'gallery', 'musicPlaylists' 等。
});

export async function initializeDefaultFonts() {
        const defaultFonts = [
                // 默认字体的 family 留空，以便代码回退到系统字体
                { id: 1, name: '默认字体', family: '', url: '', isDefault: 1 },
                { id: 2, name: '思源宋体', family: "'Noto Serif SC'", url: 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap', isDefault: 1 },
                { id: 3, name: '思源黑体', family: "'Noto Sans SC'", url: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&display=swap', isDefault: 1 },
                { id: 4, name: '霞鹜文楷', family: "'LXGW WenKai'", url: 'https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.1.0/style.css', isDefault: 1 }
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

// 3. 导出数据库实例
// 我们导出这个 db 对象，这样应用的任何部分都可以导入它来与数据库通信。
export default db;

// 用户动态相关常量
export const USER_ACTOR_ID = '__USER__'; // 特殊标识符，表示用户操作

/**
 * 获取用户在指定上下文中应该使用的实际人格ID
 * @param {string} contextId - 上下文ID（如分组ID、聊天ID等）
 * @returns {Promise<string>} 实际的人格ID
 */
export async function resolveUserPersonaForContext(contextId) {
        try {
                // 首先尝试获取该上下文绑定的用户人格
                const boundPersona = await db.actors
                        .filter(actor => 
                                actor.id && 
                                actor.id.startsWith('user_persona_') && 
                                actor.groupIds && 
                                actor.groupIds.includes(contextId)
                        )
                        .first();
                
                if (boundPersona) {
                        return boundPersona.id;
                }
                
                // 如果没有绑定的人格，返回默认人格
                const defaultPersona = await db.actors
                        .filter(actor => actor.id && actor.id.startsWith('user_persona_') && actor.isDefault)
                        .first();
                
                return defaultPersona ? defaultPersona.id : 'user_persona_default';
        } catch (error) {
                console.error('Failed to resolve user persona for context:', error);
                return 'user_persona_default';
        }
}

/**
 * 获取用户在动态场景中使用的实际人格ID（始终使用默认人格）
 * @returns {Promise<string>} 默认人格ID
 */
export async function resolveUserPersonaForMoments() {
        try {
                const defaultPersona = await db.actors
                        .filter(actor => actor.id && actor.id.startsWith('user_persona_') && actor.isDefault)
                        .first();
                
                return defaultPersona ? defaultPersona.id : 'user_persona_default';
        } catch (error) {
                console.error('Failed to resolve user persona for moments:', error);
                return 'user_persona_default';
        }
}