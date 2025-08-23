import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/homeView.vue';
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
                        path: '/chat',
                        component: () => import('../views/ChatLayout.vue'),
                        redirect: '/chat/messages',
                        children: [
                                {
                                        path: 'messages',
                                        name: 'chat-messages',
                                        component: () => import('../views/chat/MessagesView.vue')
                                },
                                {
                                        path: 'contacts',
                                        name: 'chat-contacts',
                                        component: () => import('../views/chat/ContactsView.vue')
                                },
                                {
                                        path: 'moments',
                                        name: 'chat-moments',
                                        component: () => import('../views/chat/MomentsView.vue')
                                },
                                {
                                        path: 'me',
                                        name: 'chat-me',
                                        component: () => import('../views/chat/MeView.vue')
                                }
                        ]
                }
                // 为其他App添加占位路由
                // { path: '/chat', component: () => import('../views/ChatAppView.vue') },
                // { path: '/settings', component: () => import('../views/SettingsView.vue') },
        ]
});

export default router;