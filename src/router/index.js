import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/homeView.vue';

const setAppHeight = () => {
        document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
};
window.addEventListener('resize', setAppHeight);
window.addEventListener('orientationchange', setAppHeight);
setAppHeight();


const router = createRouter({
        history: createWebHistory(),
        routes: [
                {
                        path: '/',
                        name: 'home',
                        component: HomeView
                },
                {
                        path: '/settings',
                        name: 'settings',
                        component: () => import('../views/SettingsView.vue')
                },
                {
                        path: '/album',
                        name: 'album',
                        component: () => import('../views/AlbumView.vue')
                },
                {
                        path: '/personalization',
                        name: 'personalization',
                        component: () => import('../views/PersonalizationView.vue')
                },
                {
                        path: '/stickers',
                        name: 'stickers',
                        component: () => import('../views/StickersView.vue')
                },
                {
                        path: '/favorites',
                        name: 'favorites',
                        component: () => import('../views/FavoritesView.vue')
                },
                {
                        path: '/music',
                        name: 'music',
                        component: () => import('../views/MusicView.vue')
                },
                {
                        path: '/worldbook',
                        name: 'worldbook',
                        component: () => import('../views/WorldbookView.vue')
                },
                {
                        path: '/chat',
                        component: () => import('../views/ChatLayout.vue'),
                        redirect: '/chat/messages',
                        children: [
                                {
                                        path: 'messages',
                                        name: 'chat-messages',
                                        component: () => import('../views/chat/MessagesView.vue'),
                                        meta: { title: '' }
                                },
                                {
                                        path: 'contacts',
                                        name: 'chat-contacts',
                                        component: () => import('../views/chat/ContactsView.vue'),
                                        meta: { title: '' }
                                },
                                {
                                        path: 'moments',
                                        name: 'chat-moments',
                                        component: () => import('../views/chat/MomentsView.vue'),
                                        meta: { title: '' }
                                },
                                {
                                        path: 'me',
                                        name: 'chat-me',
                                        component: () => import('../views/chat/MeView.vue'),
                                        meta: { title: '' }
                                }
                        ]
                },
                // 个人设置页面
                {
                        path: '/personal-settings',
                        name: 'personal-settings',
                        component: () => import('../views/PersonalSettingsView.vue'),
                        meta: { title: '个人设置' }
                },
                // 回忆界面路由
                {
                        path: '/memories',
                        name: 'memories',
                        component: () => import('../views/MemoriesView.vue'),
                        meta: { title: '回忆' }
                },
                // 个人动态页面 - 移到ChatLayout外部，不在Footer控制范围内
                {
                        path: '/moments/:id',
                        name: 'personal-moments',
                        component: () => import('../views/chat/MomentsView.vue'),
                        meta: { title: '的动态' },
                        props: true
                },
                // 角色/群组详情页
                {
                        path: '/profile/:id',
                        name: 'char-profile',
                        component: () => import('../views/CharProfileView.vue'),
                        meta: { title: '详细资料' },
                        props: true // 关键！这会将 :id 作为 prop 传递给组件
                },

                // 聊天室页面
                {
                        path: '/chatroom/:id',
                        name: 'chatroom',
                        component: () => import('../views/ChatRoomView.vue'),
                        meta: { title: '聊天' },
                        props: true
                },

                // 新建/编辑 统一界面
                {
                        // :id? '?'表示id参数是可选的。没有id时，我们就认为是“新建”模式。
                        path: '/edit/:id?',
                        name: 'char-edit',
                        component: () => import('../views/charEditView.vue'),
                        meta: { title: '编辑资料' },
                        props: true // 同样，将 :id 作为 prop 传递
                }
                // 为其他App添加占位路由
                // { path: '/chat', component: () => import('../views/ChatAppView.vue') },
                // { path: '/settings', component: () => import('../views/SettingsView.vue') },
        ]
});

export default router;