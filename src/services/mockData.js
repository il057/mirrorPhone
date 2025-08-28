import db, { USER_ACTOR_ID } from './database';

const mockActors = [
        // Bill 只在特别关心分组
        { 
                id: 'char_bill', 
                name: 'Bill', 
                realName: '比尔·盖茨',
                signature: 'Focus on the future.',
                birthday: '1955-10-28',
                gender: '男',
                isGroup: 0, 
                groupIds: [], 
                specialCare: 1,
                status: { color: '#4CAF50', text: '在线' },
                avatarLibrary: [
                        { url: 'https://picsum.photos/200/200?random=1', description: '商务正装头像' },
                        { url: 'https://picsum.photos/200/200?random=2', description: '休闲微笑头像' },
                        { url: 'https://picsum.photos/200/200?random=3', description: '严肃思考头像' }
                ],
                currentAvatar: 'https://picsum.photos/200/200?random=1'
        },
        { 
                id: 'char_alex', 
                name: 'Alex', 
                realName: 'Alexander Smith',
                signature: 'The future is now.',
                birthday: '1990-05-15',
                gender: '男',
                isGroup: 0, 
                groupIds: ['group_friends'], 
                specialCare: 0,
                status: { color: '#FF9800', text: '离开' },
                avatarLibrary: [
                        { url: 'https://picsum.photos/200/200?random=4', description: '阳光帅气头像' },
                        { url: 'https://picsum.photos/200/200?random=5', description: '运动活力头像' }
                ],
                currentAvatar: 'https://picsum.photos/200/200?random=4'
        },
        { 
                id: 'char_zhao', 
                name: '赵四', 
                realName: '赵大民',
                signature: '未来可期。',
                birthday: '1985-08-20',
                gender: '男',
                isGroup: 0, 
                groupIds: ['group_family'], 
                specialCare: 0,
                status: { color: '#F44336', text: '忙碌' },
                avatarLibrary: [
                        { url: 'https://picsum.photos/200/200?random=6', description: '憨厚笑容头像' },
                        { url: 'https://picsum.photos/200/200?random=7', description: '严肃表情头像' }
                ],
                currentAvatar: 'https://picsum.photos/200/200?random=6'
        },
        { 
                id: 'char_qian', 
                name: '钱二', 
                realName: '钱小美',
                signature: '未来可期。',
                birthday: '1992-03-10',
                gender: '女',
                isGroup: 0, 
                groupIds: ['group_friends'], 
                specialCare: 0,
                avatarLibrary: [
                        { url: 'https://picsum.photos/200/200?random=8', description: '甜美微笑头像' },
                        { url: 'https://picsum.photos/200/200?random=9', description: '优雅气质头像' },
                        { url: 'https://picsum.photos/200/200?random=10', description: '可爱俏皮头像' }
                ],
                currentAvatar: 'https://picsum.photos/200/200?random=8'
        },
        // Sun Yi 既是特别关心，也在家人分组
        { 
                id: 'char_sun', 
                name: '孙一', 
                realName: '孙小红',
                signature: 'Carpe Diem.',
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
                signature: '未来可期。',
                birthday: '1987-07-18',
                gender: '男',
                isGroup: 0, 
                groupIds: ['group_colleagues'], 
                specialCare: 0,
                status: { color: '#607D8B', text: '离线' }
        },
        { id: 'group_family_chat', name: '相亲相爱一家人', isGroup: 1, createdAt: Date.now() - 200000, groupIds: [] },
        { id: 'group_work_chat', name: '镜华科技项目组', isGroup: 1, createdAt: Date.now() - 100000, groupIds: [] },
        
        // 默认用户人格预设
        {
                id: 'user_default',
                name: 'User',
                realName: '用户',
                aliases: [],
                gender: '',
                birthday: '',
                persona: '默认用户人格',
                avatar: '',
                groupIds: [],
                isDefault: true,
                type: 'user',
                isGroup: 0,
                specialCare: 0
        }
    ];
const mockGroups = [
        { id: 'group_special', name: '特别关心', order: 1, worldbookIds: [] },
        { id: 'group_friends', name: '朋友', order: 2, worldbookIds: [] },
        { id: 'group_family', name: '家人', order: 3, worldbookIds: [] },
        { id: 'group_colleagues', name: '同事', order: 4, worldbookIds: [] },
    ];

// 添加好感度关系数据
const mockRelationships = [
        { sourceId: 'char_bill', targetId: USER_ACTOR_ID, type: '朋友', score: 85 },
        { sourceId: 'char_alex', targetId: USER_ACTOR_ID, type: '好友', score: 72 },
        { sourceId: 'char_zhao', targetId: USER_ACTOR_ID, type: '家人', score: 95 },
        { sourceId: 'char_qian', targetId: USER_ACTOR_ID, type: '朋友', score: 68 },
        { sourceId: 'char_sun', targetId: USER_ACTOR_ID, type: '家人', score: 98 },
        { sourceId: 'char_li', targetId: USER_ACTOR_ID, type: '同事', score: 55 },
];

// 添加表情包数据
const mockStickers = [
        { id: 1, name: '开心', url: 'https://picsum.photos/100/100?random=101', order: 1 },
        { id: 2, name: '难过', url: 'https://picsum.photos/100/100?random=102', order: 2 },
        { id: 3, name: '生气', url: 'https://picsum.photos/100/100?random=103', order: 3 },
        { id: 4, name: '惊讶', url: 'https://picsum.photos/100/100?random=104', order: 4 },
        { id: 5, name: '爱心', url: 'https://picsum.photos/100/100?random=105', order: 5 },
        { id: 6, name: '点赞', url: 'https://picsum.photos/100/100?random=106', order: 6 },
        { id: 7, name: '哭泣', url: 'https://picsum.photos/100/100?random=107', order: 7 },
        { id: 8, name: '笑哭', url: 'https://picsum.photos/100/100?random=108', order: 8 },
        { id: 9, name: '睡觉', url: 'https://picsum.photos/100/100?random=109', order: 9 },
        { id: 10, name: '加油', url: 'https://picsum.photos/100/100?random=110', order: 10 },
];

// 添加全局相册数据
const mockGlobalAlbum = [
        { id: 1, url: 'https://picsum.photos/400/600?random=201', description: '美丽的日落海滩' },
        { id: 2, url: 'https://picsum.photos/400/600?random=202', description: '繁华的都市夜景' },
        { id: 3, url: 'https://picsum.photos/400/600?random=203', description: '宁静的山林小径' },
        { id: 4, url: 'https://picsum.photos/400/600?random=204', description: '温馨的咖啡厅角落' },
        { id: 5, url: 'https://picsum.photos/400/600?random=205', description: '梦幻的星空银河' },
        { id: 6, url: 'https://picsum.photos/400/600?random=206', description: '清新的春日花园' },
        { id: 7, url: 'https://picsum.photos/400/600?random=207', description: '古典的欧式建筑' },
        { id: 8, url: 'https://picsum.photos/400/600?random=208', description: '现代简约办公室' },
        { id: 9, url: 'https://picsum.photos/400/600?random=209', description: '浪漫的粉色樱花' },
        { id: 10, url: 'https://picsum.photos/400/600?random=210', description: '神秘的深海世界' }
];

// 添加一些示例消息事件
const mockEvents = [
        // 添加更多历史消息以测试懒加载
        {
                timestamp: Date.now() - 3600000, // 1小时前
                actorId: 'char_bill',
                contextId: 'char_bill',
                type: 'privateMessage',
                content: { content: '你好！最近怎么样？' }
        },
        {
                timestamp: Date.now() - 3500000,
                actorId: USER_ACTOR_ID, 
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
        },
        
        // AI发送表情包
        {
                timestamp: Date.now() - 1700000,
                actorId: 'char_bill',
                contextId: 'char_bill',
                type: 'privateMessage',
                content: { 
                        type: 'sticker',
                        url: 'https://picsum.photos/100/100?random=105',
                        name: '爱心'
                }
        },
        
        // AI发送图片描述
        {
                timestamp: Date.now() - 1600000,
                actorId: 'char_alex',
                contextId: 'char_alex',
                type: 'privateMessage',
                content: { 
                        type: 'image',
                        subtype: 'text',
                        description: '一只可爱的小猫咪正在阳光下懒洋洋地打盹，毛茸茸的身体蜷缩成一个完美的圆球'
                }
        },
        
        // AI发送语音消息
        {
                timestamp: Date.now() - 1500000,
                actorId: 'char_qian',
                contextId: 'char_qian',
                type: 'privateMessage',
                content: { 
                        type: 'voice',
                        text: '今天天气真好，我们一起出去走走吧！',
                        duration: 3500
                }
        },
        
        // AI发送转账
        {
                timestamp: Date.now() - 1400000,
                actorId: 'char_zhao',
                contextId: 'char_zhao',
                type: 'privateMessage',
                content: { 
                        type: 'payment',
                        subtype: 'transfer',
                        amount: 88.88,
                        message: '请你喝咖啡'
                        // 注意：没有status字段，表示未处理
                }
        },
        
        // AI发送一起听邀请
        {
                timestamp: Date.now() - 1300000,
                actorId: 'char_sun',
                contextId: 'char_sun',
                type: 'privateMessage',
                content: { 
                        type: 'listen-together-invite',
                        playlist: {
                                id: 'playlist_1',
                                name: '温柔的夜晚',
                                tracks: 25
                        },
                        status: 'pending',
                        message: '想和你一起听这个歌单，很适合现在的心情'
                }
        },
        
        // AI发送音乐卡片
        {
                timestamp: Date.now() - 1200000,
                actorId: 'char_alex',
                contextId: 'char_alex',
                type: 'privateMessage',
                content: { 
                        type: 'music-card',
                        song: {
                                id: 'song_1',
                                name: '夜空中最亮的星',
                                artists: [{ id: 'artist_1', name: '逃跑计划' }],
                                album: {
                                        id: 'album_1',
                                        name: '夜空中最亮的星'
                                },
                                duration_ms: 240000
                        },
                        message: '这首歌很适合现在的心情，分享给你'
                }
        },
        
        // AI发起通话
        {
                timestamp: Date.now() - 1100000,
                actorId: 'char_bill',
                contextId: 'char_bill',
                type: 'privateMessage',
                content: { 
                        type: 'call',
                        callType: 'voice',
                        message: '有个重要的事情想和你聊聊'
                }
        },
        
        // 用户发送表情包回复
        {
                timestamp: Date.now() - 1000000,
                actorId: USER_ACTOR_ID,
                contextId: 'char_bill',
                type: 'privateMessage',
                content: { 
                        type: 'sticker',
                        url: 'https://picsum.photos/100/100?random=106',
                        name: '点赞'
                }
        },
        
        // 用户发送语音回复
        {
                timestamp: Date.now() - 900000,
                actorId: USER_ACTOR_ID,
                contextId: 'char_qian',
                type: 'privateMessage',
                content: { 
                        type: 'voice',
                        text: '好的，我们下午三点见面吧',
                        duration: 2800
                }
        },
        
        // AI发起代付
        {
                timestamp: Date.now() - 800000,
                actorId: 'char_alex',
                contextId: 'char_alex',
                type: 'privateMessage',
                content: { 
                        type: 'payment',
                        subtype: 'pay',
                        amount: 35.5,
                        message: '帮我付一下外卖费',
                        productInfo: '麻辣香锅套餐'
                        // 注意：没有status字段，表示未处理
                }
        },
        
        // 动态相关事件
        // Bill 发布的动态
        {
                timestamp: Date.now() - 86400000, // 1天前
                actorId: 'char_bill',
                contextId: 'post_1',
                type: 'post',
                content: { 
                        text: '今天天气真不错，适合出去走走！',
                        images: ['https://picsum.photos/400/300?random=1']
                }
        },
        // 用户对Bill动态的点赞
        {
                timestamp: Date.now() - 86300000,
                actorId: '__USER__',
                contextId: 'post_1',
                type: 'like',
                content: {}
        },
        // Alex 对Bill动态的回复
        {
                timestamp: Date.now() - 86200000,
                actorId: 'char_alex',
                contextId: 'post_1',
                type: 'reply',
                content: { text: '确实，我也想出去走走' }
        },
        
        // 赵四发布的动态
        {
                timestamp: Date.now() - 172800000, // 2天前
                actorId: 'char_zhao',
                contextId: 'post_2',
                type: 'post',
                content: { 
                        text: '今天做了一顿大餐，色香味俱全！',
                        images: [
                                'https://picsum.photos/400/300?random=2',
                                'https://picsum.photos/400/300?random=3'
                        ]
                }
        },
        // 孙一对赵四动态的点赞
        {
                timestamp: Date.now() - 172700000,
                actorId: 'char_sun',
                contextId: 'post_2',
                type: 'like',
                content: {}
        },
        // 用户对赵四动态的回复
        {
                timestamp: Date.now() - 172600000,
                actorId: '__USER__',
                contextId: 'post_2',
                type: 'reply',
                content: { text: '看起来很好吃，下次教教我' }
        },
        // 赵四对用户的回复
        {
                timestamp: Date.now() - 172500000,
                actorId: 'char_zhao',
                contextId: 'post_2',
                type: 'reply',
                content: { text: '没问题，周末来我家' }
        },
        
        // 钱二发布的动态
        {
                timestamp: Date.now() - 259200000, // 3天前
                actorId: 'char_qian',
                contextId: 'post_3',
                type: 'post',
                content: { 
                        text: '工作虽然忙碌，但生活还是要有仪式感。今天给自己买了束花 🌸'
                }
        },
        // 多个人对钱二动态的点赞
        {
                timestamp: Date.now() - 259100000,
                actorId: 'char_sun',
                contextId: 'post_3',
                type: 'like',
                content: {}
        },
        {
                timestamp: Date.now() - 259000000,
                actorId: 'char_alex',
                contextId: 'post_3',
                type: 'like',
                content: {}
        },
        {
                timestamp: Date.now() - 258900000,
                actorId: '__USER__',
                contextId: 'post_3',
                type: 'like',
                content: {}
        },
        // 孙一的回复
        {
                timestamp: Date.now() - 258800000,
                actorId: 'char_sun',
                contextId: 'post_3',
                type: 'reply',
                content: { text: '女孩子就应该对自己好一点' }
        },
        
        // 用户发布的动态
        {
                timestamp: Date.now() - 432000000, // 5天前
                actorId: '__USER__',
                contextId: 'post_user_1',
                type: 'post',
                content: { 
                        text: '分享一些美好的瞬间 ✨',
                        images: ['https://picsum.photos/400/300?random=7']
                }
        },
        // 其他人对用户动态的点赞和回复
        {
                timestamp: Date.now() - 431900000,
                actorId: 'char_bill',
                contextId: 'post_user_1',
                type: 'like',
                content: {}
        },
        {
                timestamp: Date.now() - 431800000,
                actorId: 'char_zhao',
                contextId: 'post_user_1',
                type: 'reply',
                content: { text: '生活需要这样的美好记录' }
        },
        
        // Alex发布的动态
        {
                timestamp: Date.now() - 345600000, // 4天前
                actorId: 'char_alex',
                contextId: 'post_4',
                type: 'post',
                content: { 
                        text: '周末和朋友们一起去爬山，虽然累但很开心！',
                        images: [
                                'https://picsum.photos/400/300?random=4',
                                'https://picsum.photos/400/300?random=5',
                                'https://picsum.photos/400/300?random=6'
                        ]
                }
        },
        // Bill对Alex动态的回复
        {
                timestamp: Date.now() - 345500000,
                actorId: 'char_bill',
                contextId: 'post_4',
                type: 'reply',
                content: { text: '风景真美，下次叫上我一起' }
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

                await db.transaction('rw', db.actors, db.groups, db.conversations, db.relationships, db.events, db.stickers, db.globalAlbum, async () => {
                        await db.actors.bulkPut(mockActors);
                        await db.groups.bulkPut(mockGroups);
                        await db.relationships.bulkPut(mockRelationships);
                        await db.events.bulkPut(mockEvents);
                        await db.stickers.bulkPut(mockStickers);
                        await db.globalAlbum.bulkPut(mockGlobalAlbum);
                });

                console.log('Mock data populated successfully.');
        } catch (error) {
                console.error('Failed to populate mock data:', error);
        }
}