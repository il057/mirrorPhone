import db from './database';

const mockActors = [
        // Bill 只在特别关心分组
        { id: 'char_bill', name: 'Bill', isGroup: 0, groupIds: [], specialCare: 1 },
        { id: 'char_alex', name: 'Alex', isGroup: 0, groupIds: ['group_friends'], specialCare: 0 },
        { id: 'char_zhao', name: '赵四', isGroup: 0, groupIds: ['group_family'], specialCare: 0 },
        { id: 'char_qian', name: '钱二', isGroup: 0, groupIds: ['group_friends'], specialCare: 0 },
        // Sun Yi 既是特别关心，也在家人分组
        { id: 'char_sun', name: '孙一', isGroup: 0, groupIds: ['group_family'], specialCare: 1 },
        { id: 'char_li', name: '李三', isGroup: 0, groupIds: ['group_colleagues'], specialCare: 0 },
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

export async function populateMockData() {
        try {
                const actorCount = await db.actors.count();
                if (actorCount > 0) {
                        console.log('Database already has data. Skipping mock data population.');
                        return;
                }
                console.log('Populating database with mock data...');

                await db.transaction('rw', db.actors, db.groups, db.conversations, async () => {
                        // No need to process pinyin anymore
                        await db.actors.bulkPut(mockActors);
                        await db.groups.bulkPut(mockGroups);
                        await db.conversations.bulkPut(mockConversations);
                });

                console.log('Mock data populated successfully.');
        } catch (error) {
                console.error('Failed to populate mock data:', error);
        }
}