// 因为我们通过 <script> 标签全局引入了 Dexie，所以可以直接使用 Dexie 这个全局变量。
// 如果未来你通过 npm 安装，这里就需要写 import Dexie from 'dexie';

// 1. 创建数据库实例
// 'mirrorPhoneDB' 是数据库的名称
const db = new Dexie('mirrorPhoneDB');

// 2. 定义数据库结构（表和索引）
// db.version(1) 表示这是数据库的第一个版本。
// .stores({}) 里面定义了所有的表。
db.version(1).stores({
        globalSettings: '&id, activeApiProfileId, activeTtsProfileId',
        apiProfiles: '++id, &profileName',
        ttsProfiles: '++id, &profileName',

        // 'chatHistory' 表：为未来的聊天记录预先占位。
        // '++id' 是每条消息的唯一ID。
        // '[characterId+timestamp]' 是一个复合索引，可以高效地查询某个角色在某个时间段内的消息。
        // 'characterId' 是角色ID，'timestamp' 是消息时间戳。
        chatHistory: '++id, [characterId+timestamp], characterId',
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