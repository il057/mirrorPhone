import db from './database';

/**
 * 应用字体到文档或指定元素
 * @param {Object} font 字体对象
 * @param {HTMLElement} targetElement 可选，要应用字体的目标元素，默认为document.body
 */
export function applyFont(font, targetElement = document.body) {
        if (!font) return;

        // 创建style标签用于@font-face
        let styleTag = document.getElementById('dynamic-font-style');
        if (!styleTag) {
                styleTag = document.createElement('style');
                styleTag.id = 'dynamic-font-style';
                document.head.appendChild(styleTag);
        }

        // 检查URL类型并相应处理
        if (font.url) {
                if (font.url.includes('googleapis.com') || font.url.endsWith('.css')) {
                        // CSS链接，使用link标签
                        const linkId = `font-link-${font.id}`;
                        let linkTag = document.getElementById(linkId);

                        if (!linkTag) {
                                linkTag = document.createElement('link');
                                linkTag.id = linkId;
                                linkTag.rel = 'stylesheet';
                                linkTag.href = font.url;
                                document.head.appendChild(linkTag);
                        }
                } else {
                        // 直接字体文件，使用@font-face
                        const fontName = font.family || `custom-font-${font.id}`;
                        const format = getFontFormat(font.url);

                        const fontFaceRule = `
                @font-face {
                    font-family: "${fontName}";
                    src: url("${font.url}") format("${format}");
                    font-display: swap;
                }
            `;

                        // 只有在还没有添加过这个字体的情况下添加
                        if (!styleTag.textContent.includes(font.url)) {
                                styleTag.textContent += fontFaceRule;
                        }

                        // 如果字体没有family属性，设置它
                        if (!font.family) {
                                font.family = fontName;
                                // 异步保存到数据库，无需等待
                                db.fonts.update(font.id, { family: fontName }).catch(err => {
                                        console.error('Failed to update font family:', err);
                                });
                        }
                }
        }

        // 应用字体族
        const systemFont = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
        targetElement.style.fontFamily = font.family ? `${font.family}, ${systemFont}` : systemFont;
}

/**
 * 根据URL后缀确定字体格式
 * @param {string} url 字体URL
 * @returns {string} 字体格式
 */
export function getFontFormat(url) {
        if (url.endsWith('.otf')) return 'opentype';
        if (url.endsWith('.ttf')) return 'truetype';
        if (url.endsWith('.woff')) return 'woff';
        if (url.endsWith('.woff2')) return 'woff2';
        return 'opentype'; // 默认为opentype
}

/**
 * 加载并应用活跃字体
 */
export async function loadActiveFont() {
        try {
                const settings = await db.globalSettings.get('global');
                if (settings && settings.activeFontId) {
                        const font = await db.fonts.get(settings.activeFontId);
                        if (font) {
                                applyFont(font);
                                return font;
                        }
                }
        } catch (error) {
                console.error('Failed to load active font:', error);
        }
        return null;
}

export default {
        applyFont,
        getFontFormat,
        loadActiveFont
};
