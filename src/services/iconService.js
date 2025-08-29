// 图标管理服务
// 提供统一的图标数据和配置管理

import IconAlbum from '../components/icons/IconAlbum.vue';
import IconChat from '../components/icons/IconChat.vue';
import IconMusic from '../components/icons/IconMusic.vue';
import IconPersonalization from '../components/icons/IconPersonalization.vue';
import IconSettings from '../components/icons/IconSettings.vue';
import IconWorldbook from '../components/icons/IconWorldbook.vue';
import IconOfflineSummary from '../components/icons/IconOfflineSummary.vue';

// 主屏幕应用配置
export const homeScreenApps = [
  {
    id: 'chat',
    name: '聊天',
    component: IconChat,
    order: 1
  },
  {
    id: 'music',
    name: '音乐',
    component: IconMusic,
    order: 2
  },
  {
    id: 'album',
    name: '相册',
    component: IconAlbum,
    order: 3
  },
  {
    id: 'worldbook',
    name: '世界书',
    component: IconWorldbook,
    order: 4
  },
  {
    id: 'personalization',
    name: '个性化',
    component: IconPersonalization,
    order: 5
  },
  {
    id: 'offline-summary',
    name: '离线总结',
    component: IconOfflineSummary,
    order: 6
  },
  {
    id: 'settings',
    name: '设置',
    component: IconSettings,
    order: 7
  }
];

// 获取指定应用的图标组件
export function getAppIconComponent(appId) {
  const app = homeScreenApps.find(app => app.id === appId);
  return app ? app.component : null;
}

// 获取应用的显示名称
export function getAppDisplayName(appId) {
  const app = homeScreenApps.find(app => app.id === appId);
  return app ? app.name : appId;
}

// 检查应用是否有通知
export function shouldShowNotification(appId, hasUnreadMessages, hasNewOfflineSummaries) {
  return (appId === 'chat' && hasUnreadMessages) ||
         (appId === 'offline-summary' && hasNewOfflineSummaries);
}

// 按顺序排序应用
export function sortAppsByOrder(apps) {
  return [...apps].sort((a, b) => a.order - b.order);
}

// 获取应用的默认配置
export function getDefaultAppSettings() {
  return homeScreenApps.reduce((settings, app) => {
    settings[app.id] = null; // 默认没有自定义图标
    return settings;
  }, {});
}
