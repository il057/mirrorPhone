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
                // 角色/群组详情页
                {
                        path: '/profile/:id',
                        name: 'char-profile',
                        component: () => import('../views/CharProfileView.vue'),
                        meta: { title: '详细资料' },
                        props: true // 关键！这会将 :id 作为 prop 传递给组件
                },

                // 新建/编辑 统一界面
                {
                        // :id? '?'表示id参数是可选的。没有id时，我们就认为是“新建”模式。
                        path: '/edit/:id?',
                        name: 'char-edit',
                        component: () => import('../views/CharEditView.vue'),
                        meta: { title: '编辑资料' },
                        props: true // 同样，将 :id 作为 prop 传递
                }
                // 为其他App添加占位路由
                // { path: '/chat', component: () => import('../views/ChatAppView.vue') },
                // { path: '/settings', component: () => import('../views/SettingsView.vue') },
        ]
});

export default router;