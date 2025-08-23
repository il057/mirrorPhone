// 因为我们通过 <script> 标签全局引入了 Dexie，所以可以直接使用 Dexie 这个全局变量。
// 如果未来你通过 npm 安装，这里就需要写 import Dexie from 'dexie';
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
         */
        actors: `
        &id,
        name,
        realName,
        *aliases,
        isGroup,
        *groupIds,
        specialCare
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
        [contextId+timestamp]
        `,

        /**
         * 表：relationships (动态关系)
         * 存储角色之间的动态关系和认知。
         * ++id: 自增主键
         * [sourceId+targetId]: 复合主键，确保 A->B 的关系唯一
         * type: 关系类型 (自由文本，如 "朋友", "欢喜冤家")
         * score: 好感度数值
         * tags: 印象标签数组, 格式: [{ name: "有趣", strength: 5 }]
         */
        relationships: `
        ++id,
        [sourceId+targetId],
        score
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
        // 你未来可以增加更多的表，例如 'gallery', 'musicPlaylists' 等。
});

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
                        // 更多全局设置可以在这里添加默认值
                });
        }
}

// 3. 导出数据库实例
// 我们导出这个 db 对象，这样应用的任何部分都可以导入它来与数据库通信。
export default db;