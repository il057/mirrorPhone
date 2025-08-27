/**
 * 全局SVG图标库 - 可在任何JavaScript环境中使用
 * 包含chatRoom.js等传统JavaScript文件的SVG图标支持
 */

window.SvgIcons = {
        // 图标库
        icons: {
                // 图片相关
                'text-image': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
                  <rect x="3" y="4" width="18" height="14" rx="2" ry="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M9 9h6M9 12h4M9 15h6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`,
                
                'upload-image': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="8.5" cy="8.5" r="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M21 15l-5-5L5 21" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`,
                
                'photo': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="8.5" cy="8.5" r="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M21 15l-5-5L5 21" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`,
                
                'camera': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="12" cy="13" r="4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`,
                
                // 支付相关
                'transfer': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
                  <path d="M12 1v6M12 17v6M5 12h14M16 8l4 4-4 4M8 16l-4-4 4-4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`,
                
                'pay': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <line x1="1" y1="10" x2="23" y2="10" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`,
                
                'money': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
                  <line x1="12" y1="1" x2="12" y2="23" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`,
                
                // 通话相关
                'voice': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`,
                
                'video': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
                  <polygon points="23 7 16 12 23 17 23 7" stroke-linecap="round" stroke-linejoin="round"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`,
                
                'microphone': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`,
                
                // 红包和礼物
                'red-packet': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
                  <rect x="3" y="6" width="18" height="15" rx="2" ry="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="12" cy="13" r="3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`,
                
                'gift': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
                  <polyline points="20 12 20 22 4 22 4 12" stroke-linecap="round" stroke-linejoin="round"/>
                  <rect x="2" y="7" width="20" height="5" stroke-linecap="round" stroke-linejoin="round"/>
                  <line x1="12" y1="22" x2="12" y2="7" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`,
                
                // 娱乐和社交
                'sticker': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
                  <circle cx="12" cy="12" r="10" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke-linecap="round" stroke-linejoin="round"/>
                  <line x1="9" y1="9" x2="9.01" y2="9" stroke-linecap="round" stroke-linejoin="round"/>
                  <line x1="15" y1="9" x2="15.01" y2="9" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`,
                
                'music': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
                  <path d="M9 18V5l12-2v13" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="6" cy="18" r="3" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="18" cy="16" r="3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`,
                
                'game': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <line x1="8" y1="21" x2="16" y2="21" stroke-linecap="round" stroke-linejoin="round"/>
                  <line x1="12" y1="17" x2="12" y2="21" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`,
                
                // 位置和文件
                'location': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="12" cy="10" r="3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`,
                
                'file': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke-linecap="round" stroke-linejoin="round"/>
                  <polyline points="14,2 14,8 20,8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`,
                
                'folder': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`,
                
                // 系统和工具
                'settings': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
                  <circle cx="12" cy="12" r="3" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`,
                
                'search': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
                  <circle cx="11" cy="11" r="8" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M21 21l-4.35-4.35" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`,
                
                'add': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
                  <line x1="12" y1="5" x2="12" y2="19" stroke-linecap="round" stroke-linejoin="round"/>
                  <line x1="5" y1="12" x2="19" y2="12" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`,
                
                'close': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
                  <line x1="18" y1="6" x2="6" y2="18" stroke-linecap="round" stroke-linejoin="round"/>
                  <line x1="6" y1="6" x2="18" y2="18" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`,
                
                // 常用操作
                'copy': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`,
                
                'delete': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
                  <polyline points="3,6 5,6 21,6" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M10 11v6M14 11v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`,
                
                'edit': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`,
                
                'reply': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
                  <polyline points="9,17 4,12 9,7" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M20 18v-2a4 4 0 00-4-4H4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`,
                
                'forward': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
                  <polyline points="15,17 20,12 15,7" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M4 18v-2a4 4 0 014-4h12" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`,
                
                'heart': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`,
                
                // 默认占位符
                'default': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="36" height="36">
                  <rect x="3" y="3" width="18" height="18" rx="3" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M8 12h8M12 8v8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`
        },
        
        /**
         * 获取SVG图标
         * @param {string|object} iconKey - 图标key或包含图标信息的对象
         * @param {number} size - 图标大小，默认36
         * @returns {string} SVG字符串
         */
        get: function(iconKey, size = 36) {
                let key;
                
                if (typeof iconKey === 'string') {
                        key = iconKey;
                } else if (iconKey && typeof iconKey === 'object') {
                        // 如果传入的是action对象
                        if (iconKey.svg) {
                                return iconKey.svg;
                        }
                        key = iconKey.iconType || iconKey.key || iconKey.icon;
                }
                
                const svg = this.icons[key] || this.icons.default;
                
                // 如果指定了非默认尺寸，替换SVG中的width和height
                if (size !== 36) {
                        return svg.replace(/width="36" height="36"/, `width="${size}" height="${size}"`);
                }
                
                return svg;
        },
        
        /**
         * 检查图标是否存在
         * @param {string} iconKey - 图标key
         * @returns {boolean} 是否存在
         */
        has: function(iconKey) {
                return iconKey in this.icons;
        },
        
        /**
         * 获取所有可用的图标列表
         * @returns {string[]} 图标key的数组
         */
        list: function() {
                return Object.keys(this.icons);
        },
        
        /**
         * 创建一个包含SVG图标的DOM元素
         * @param {string|object} iconKey - 图标key或包含图标信息的对象
         * @param {number} size - 图标大小，默认36
         * @param {string} className - 额外的CSS类名
         * @returns {HTMLElement} 包含SVG的span元素
         */
        createElement: function(iconKey, size = 36, className = '') {
                const span = document.createElement('span');
                span.className = `svg-icon ${className}`.trim();
                span.innerHTML = this.get(iconKey, size);
                return span;
        }
};

// 为了向后兼容，提供简化的全局函数
window.getSvgIcon = function(iconKey, size = 36) {
        return window.SvgIcons.get(iconKey, size);
};

// 创建默认占位符的快捷方式
window.getDefaultSvg = function(size = 36) {
        return window.SvgIcons.get('default', size);
};
