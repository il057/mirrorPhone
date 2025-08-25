import db from './database';

const mockActors = [
        // Bill 只在特别关心分组
        { 
                id: 'char_bill', 
                name: 'Bill', 
                realName: '比尔·盖茨',
                birthday: '1955-10-28',
                gender: '男',
                isGroup: 0, 
                groupIds: [], 
                specialCare: 1,
                status: { color: '#4CAF50', text: '在线' }
        },
        { 
                id: 'char_alex', 
                name: 'Alex', 
                realName: 'Alexander Smith',
                birthday: '1990-05-15',
                gender: '男',
                isGroup: 0, 
                groupIds: ['group_friends'], 
                specialCare: 0,
                status: { color: '#FF9800', text: '离开' }
        },
        { 
                id: 'char_zhao', 
                name: '赵四', 
                realName: '赵大民',
                birthday: '1985-08-20',
                gender: '男',
                isGroup: 0, 
                groupIds: ['group_family'], 
                specialCare: 0,
                status: { color: '#F44336', text: '忙碌' }
        },
        { 
                id: 'char_qian', 
                name: '钱二', 
                realName: '钱小美',
                birthday: '1992-03-10',
                gender: '女',
                isGroup: 0, 
                groupIds: ['group_friends'], 
                specialCare: 0,
                status: { color: '#4CAF50', text: '在线' }
        },
        // Sun Yi 既是特别关心，也在家人分组
        { 
                id: 'char_sun', 
                name: '孙一', 
                realName: '孙小红',
                birthday: '1988-12-05',
                gender: '女',
                isGroup: 0, 
                groupIds: ['group_family'], 
                specialCare: 1,
                status: { color: '#9C27B0', text: '睡觉' }
        },
        { 
                id: 'char_li', 
                name: '李三', 
                realName: '李明华',
                birthday: '1987-07-18',
                gender: '男',
                isGroup: 0, 
                groupIds: ['group_colleagues'], 
                specialCare: 0,
                status: { color: '#607D8B', text: '离线' }
        },
        { id: 'group_family_chat', name: '相亲相爱一家人', isGroup: 1, createdAt: Date.now() - 200000, groupIds: [] },
        { id: 'group_work_chat', name: '镜华科技项目组', isGroup: 1, createdAt: Date.now() - 100000, groupIds: [] },
    ];
const mockGroups = [
        { id: 'group_special', name: '特别关心', order: 1, worldbookIds: [] },
        { id: 'group_friends', name: '朋友', order: 2, worldbookIds: [] },
        { id: 'group_family', name: '家人', order: 3, worldbookIds: [] },
        { id: 'group_colleagues', name: '同事', order: 4, worldbookIds: [] },
    ];

const mockConversations = [
        { id: 'char_bill', lastEventTimestamp: Date.now(), lastEventContent: { type: 'text', content: '晚上吃什么？' }, unreadCount: 1 },
        { id: 'char_sun', lastEventTimestamp: Date.now() - 50000, lastEventContent: { type: 'text', content: '好的，没问题。' }, unreadCount: 0 },
        { id: 'group_family_chat', lastEventTimestamp: Date.now() - 100000, lastEventContent: { type: 'text', content: '【红包】恭喜发财' }, unreadCount: 5 },
        { id: 'group_work_chat', lastEventTimestamp: Date.now() - 86400000, lastEventContent: { type: 'text', content: '项目文档已更新，请查收。' }, unreadCount: 0 },
        { id: 'char_zhao', lastEventTimestamp: Date.now() - 2 * 86400000, lastEventContent: { type: 'text', content: 'OK' }, unreadCount: 2 },
];

// 添加好感度关系数据
const mockRelationships = [
        { sourceId: 'char_bill', targetId: 'user_main', type: '朋友', score: 85 },
        { sourceId: 'char_alex', targetId: 'user_main', type: '好友', score: 72 },
        { sourceId: 'char_zhao', targetId: 'user_main', type: '家人', score: 95 },
        { sourceId: 'char_qian', targetId: 'user_main', type: '朋友', score: 68 },
        { sourceId: 'char_sun', targetId: 'user_main', type: '家人', score: 98 },
        { sourceId: 'char_li', targetId: 'user_main', type: '同事', score: 55 },
];

// 添加一些示例消息事件
const mockEvents = [
        // 添加更多历史消息以测试懒加载
        ...Array.from({ length: 50 }, (_, i) => ({
                timestamp: Date.now() - (50 - i) * 300000, // 每5分钟一条消息
                actorId: i % 3 === 0 ? 'user_main' : 'char_bill',
                contextId: 'char_bill',
                type: 'privateMessage',
                content: { 
                        content: i % 3 === 0 
                                ? `这是用户发送的第${Math.floor(i/3) + 1}条消息` 
                                : `这是AI回复的第${Math.floor(i/3) + 1}条消息，内容是：${['你好！', '最近怎么样？', '工作顺利吗？', '今天天气不错', '有空聊聊吗？'][i % 5]}`
                }
        })),
        {
                timestamp: Date.now() - 3600000, // 1小时前
                actorId: 'char_bill',
                contextId: 'char_bill',
                type: 'privateMessage',
                content: { content: '你好！最近怎么样？' }
        },
        {
                timestamp: Date.now() - 3500000,
                actorId: 'user_main', 
                contextId: 'char_bill',
                type: 'privateMessage',
                content: { content: '还不错，工作有点忙' }
        },
        {
                timestamp: Date.now() - 1800000, // 30分钟前
                actorId: 'char_bill',
                contextId: 'char_bill',
                type: 'privateMessage',
                content: { content: '晚上吃什么？' }
        }
];

export async function populateMockData() {
        try {
                const actorCount = await db.actors.count();
                if (actorCount > 0) {
                        console.log('Database already has data. Skipping mock data population.');
                        return;
                }
                console.log('Populating database with mock data...');

                await db.transaction('rw', db.actors, db.groups, db.conversations, db.relationships, db.events, async () => {
                        await db.actors.bulkPut(mockActors);
                        await db.groups.bulkPut(mockGroups);
                        await db.conversations.bulkPut(mockConversations);
                        await db.relationships.bulkPut(mockRelationships);
                        await db.events.bulkPut(mockEvents);
                });

                console.log('Mock data populated successfully.');
        } catch (error) {
                console.error('Failed to populate mock data:', error);
        }
}