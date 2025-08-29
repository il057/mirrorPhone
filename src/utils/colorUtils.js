/**
 * 计算颜色的相对亮度
 * @param {string} hexColor 十六进制颜色代码，如 #ffffff
 * @returns {number} 亮度值（0-1范围内）
 */
export function getLuminance(hexColor) {
        // 移除#号
        const hex = hexColor.replace('#', '');

        // 转换为RGB
        let r, g, b;
        if (hex.length === 3) {
                r = parseInt(hex.charAt(0) + hex.charAt(0), 16) / 255;
                g = parseInt(hex.charAt(1) + hex.charAt(1), 16) / 255;
                b = parseInt(hex.charAt(2) + hex.charAt(2), 16) / 255;
        } else {
                r = parseInt(hex.substring(0, 2), 16) / 255;
                g = parseInt(hex.substring(2, 4), 16) / 255;
                b = parseInt(hex.substring(4, 6), 16) / 255;
        }

        // 对RGB值进行伽马校正
        r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
        g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
        b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

        // 计算相对亮度
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * 根据背景色获取合适的文本颜色（黑或白）
 * @param {string} backgroundColor 背景颜色的十六进制代码
 * @returns {string} 合适的文本颜色的十六进制代码
 */
export function getContrastTextColor(backgroundColor) {
        const luminance = getLuminance(backgroundColor);
        return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * 生成一个与主题色协调的配色方案
 * @param {string} primaryColor 主色调十六进制代码
 * @returns {object} 包含各种衍生颜色的配色方案对象
 */
export function generateColorScheme(primaryColor) {
        const textColor = getContrastTextColor(primaryColor);

        // 创建一个稍浅的变体
        const lighterColor = adjustColorLuminance(primaryColor, 0.2);

        // 创建一个稍深的变体
        const darkerColor = adjustColorLuminance(primaryColor, -0.2);

        // 创建一个强调色（互补或类似色）
        const accentColor = getAccentColor(primaryColor);

        return {
                primary: primaryColor,
                lighter: lighterColor,
                darker: darkerColor,
                accent: accentColor,
                text: textColor
        };
}
/**
 * 调整颜色亮度 (基于HSL色彩空间，更精确)
 * @param {string} hexColor 十六进制颜色代码
 * @param {number} amount 调整量, -1到1之间。正值增加亮度，负值减少亮度
 * @returns {string} 调整后的十六进制颜色代码
 */
export function adjustColorLuminance(hexColor, amount) {
        let hex = hexColor.replace('#', '');

        if (hex.length === 3) {
                hex = hex.split('').map(char => char + char).join('');
        }

        // 1. 将Hex转换为RGB
        let r = parseInt(hex.substring(0, 2), 16);
        let g = parseInt(hex.substring(2, 4), 16);
        let b = parseInt(hex.substring(4, 6), 16);

        // 2. 将RGB转换为HSL
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                        case g: h = (b - r) / d + 2; break;
                        case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
        }

        // 3. 调整亮度值
        // 确保亮度值在 [0, 1] 范围内
        l = Math.max(0, Math.min(1, l + amount));

        // 4. 将调整后的HSL转换回RGB
        let r_new, g_new, b_new;
        if (s === 0) {
                r_new = g_new = b_new = l; // 无彩色 (灰色)
        } else {
                const hue2rgb = (p, q, t) => {
                        if (t < 0) t += 1;
                        if (t > 1) t -= 1;
                        if (t < 1 / 6) return p + (q - p) * 6 * t;
                        if (t < 1 / 2) return q;
                        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                        return p;
                };
                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;
                r_new = hue2rgb(p, q, h + 1 / 3);
                g_new = hue2rgb(p, q, h);
                b_new = hue2rgb(p, q, h - 1 / 3);
        }

        // 5. 将RGB值转换回Hex
        const toHex = x => {
                const hex_val = Math.round(x * 255).toString(16);
                return hex_val.length === 1 ? '0' + hex_val : hex_val;
        };

        return `#${toHex(r_new)}${toHex(g_new)}${toHex(b_new)}`;
}

/**
 * 获取一个与输入颜色协调的强调色
 * @param {string} hexColor 十六进制颜色代码
 * @returns {string} 强调色的十六进制代码
 */
export function getAccentColor(hexColor) {
        // 一个简单的方法是使用互补色
        let hex = hexColor.replace('#', '');

        if (hex.length === 3) {
                hex = hex.charAt(0) + hex.charAt(0) + hex.charAt(1) + hex.charAt(1) + hex.charAt(2) + hex.charAt(2);
        }

        // 计算互补色
        const num = parseInt(hex, 16);
        const complement = 0xFFFFFF - num;

        return `#${complement.toString(16).padStart(6, '0')}`;
}

/**
 * 将十六进制颜色转换为 RGB 格式（用于 CSS 变量）
 * @param {string} hexColor 十六进制颜色代码，如 #ffffff 或 #fff
 * @returns {string} RGB 值字符串，如 "255, 255, 255"
 */
export function hexToRgb(hexColor) {
        // 移除 # 号
        let hex = hexColor.replace('#', '');

        // 处理 3 位十六进制颜色
        if (hex.length === 3) {
                hex = hex.split('').map(char => char + char).join('');
        }

        // 确保是 6 位十六进制
        if (hex.length !== 6) {
                console.warn('Invalid hex color format:', hexColor);
                return '0, 0, 0'; // 返回默认值
        }

        // 转换为 RGB 值
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        return `${r}, ${g}, ${b}`;
}

/**
 * 将十六进制颜色转换为 RGBA 格式，用于发光效果
 * @param {string} hexColor 十六进制颜色代码，如 #ffffff 或 #fff
 * @param {number} alpha 透明度值，0-1之间，默认为 0.2
 * @returns {string} RGBA 颜色字符串，如 rgba(255, 255, 255, 0.2)
 */
export function hexToRgba(hexColor, alpha = 0.2) {
        // 移除 # 号
        let hex = hexColor.replace('#', '');

        // 处理 3 位十六进制颜色
        if (hex.length === 3) {
                hex = hex.split('').map(char => char + char).join('');
        }

        // 确保是 6 位十六进制
        if (hex.length !== 6) {
                console.warn('Invalid hex color format:', hexColor);
                return 'rgba(0, 0, 0, 0.2)'; // 返回默认值
        }

        // 转换为 RGB 值
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        // 确保 alpha 值在有效范围内
        const validAlpha = Math.max(0, Math.min(1, alpha));

        return `rgba(${r}, ${g}, ${b}, ${validAlpha})`;
}

/**
 * 获取用于 input 发光效果的 box-shadow 值
 * @param {string} accentColor accent-primary 颜色
 * @param {number} intensity 发光强度，默认为 0.2
 * @returns {string} CSS box-shadow 值
 */
export function getInputGlowShadow(accentColor, intensity = 0.2) {
        const rgbaColor = hexToRgba(accentColor, intensity);
        return `0 0 0 2px ${rgbaColor}`;
}

/**
 * 计算主题色的衍生颜色（用于主题系统）
 * @param {string} primaryColor 主色调十六进制代码
 * @returns {object} 包含所有主题色变量的对象
 */
export function calculateThemeColors(primaryColor) {
        try {
                // 计算衍生颜色
                const darkerColor = adjustColorLuminance(primaryColor, -0.2);
                const lighterColor = adjustColorLuminance(primaryColor, 0.2);

                // 计算文本颜色（基于主色调的对比度）
                const textColor = getContrastTextColor(primaryColor);

                // 计算用于发光效果的 RGBA 颜色
                const glowShadow = getInputGlowShadow(primaryColor, 0.2);

                return {
                        primary: primaryColor,
                        text: textColor,
                        darker: darkerColor,
                        lighter: lighterColor,
                        glowShadow: glowShadow,
                        // 额外的透明度变体
                        primaryRgba20: hexToRgba(primaryColor, 0.2),
                        primaryRgba30: hexToRgba(primaryColor, 0.3),
                        primaryRgba50: hexToRgba(primaryColor, 0.5)
                };
        } catch (error) {
                console.warn('Failed to calculate theme colors:', error);
                // 返回默认值
                return {
                        primary: primaryColor,
                        text: '#ffffff',
                        darker: primaryColor,
                        lighter: primaryColor,
                        glowShadow: '0 0 0 2px rgba(0, 0, 0, 0.2)',
                        primaryRgba20: 'rgba(0, 0, 0, 0.2)',
                        primaryRgba30: 'rgba(0, 0, 0, 0.3)',
                        primaryRgba50: 'rgba(0, 0, 0, 0.5)'
                };
        }
}

/**
 * 应用主题色到 CSS 变量
 * @param {object} themeColors calculateThemeColors 返回的主题色对象
 * @param {HTMLElement} root 根元素，默认为 document.documentElement
 */
export function applyThemeColors(themeColors, root = document.documentElement) {
        if (!themeColors || !root) return;

        // 应用基础主题色
        root.style.setProperty('--accent-primary', themeColors.primary);
        root.style.setProperty('--accent-primary-rgb', hexToRgb(themeColors.primary));
        root.style.setProperty('--accent-text', themeColors.text);
        root.style.setProperty('--accent-darker', themeColors.darker);
        root.style.setProperty('--accent-lighter', themeColors.lighter);

        // 应用发光效果
        root.style.setProperty('--accent-glow-shadow', themeColors.glowShadow);

        // 应用透明度变体
        root.style.setProperty('--accent-primary-rgba-20', themeColors.primaryRgba20);
        root.style.setProperty('--accent-primary-rgba-30', themeColors.primaryRgba30);
        root.style.setProperty('--accent-primary-rgba-50', themeColors.primaryRgba50);
}

/**
 * 从 CSS 变量获取当前主题色
 * @param {HTMLElement} root 根元素，默认为 document.documentElement
 * @returns {object} 当前主题色的对象
 */
export function getCurrentThemeColors(root = document.documentElement) {
        if (!root) return null;

        const styles = getComputedStyle(root);

        return {
                primary: styles.getPropertyValue('--accent-primary').trim(),
                primaryRgb: styles.getPropertyValue('--accent-primary-rgb').trim(),
                text: styles.getPropertyValue('--accent-text').trim(),
                darker: styles.getPropertyValue('--accent-darker').trim(),
                lighter: styles.getPropertyValue('--accent-lighter').trim(),
                glowShadow: styles.getPropertyValue('--accent-glow-shadow').trim(),
                primaryRgba20: styles.getPropertyValue('--accent-primary-rgba-20').trim(),
                primaryRgba30: styles.getPropertyValue('--accent-primary-rgba-30').trim(),
                primaryRgba50: styles.getPropertyValue('--accent-primary-rgba-50').trim()
        };
}

/**
 * 创建气泡样式的主题色配置
 * @param {object} bubbleStyle 气泡样式对象
 * @param {boolean} useUserBubble 是否使用用户气泡色
 * @returns {object} 主题色配置对象
 */
export function createBubbleThemeColors(bubbleStyle, useUserBubble = true) {
        if (!bubbleStyle) return null;

        const primaryColor = useUserBubble ? bubbleStyle.userBubbleBg : bubbleStyle.charBubbleBg;
        const textColor = useUserBubble ? bubbleStyle.userBubbleText : bubbleStyle.charBubbleText;

        const themeColors = calculateThemeColors(primaryColor);
        // 覆盖自动计算的文本颜色，使用气泡样式的文本颜色
        themeColors.text = textColor;

        return {
                ...themeColors,
                // 额外的气泡样式信息
                charBubbleBg: bubbleStyle.charBubbleBg,
                charBubbleText: bubbleStyle.charBubbleText,
                userBubbleBg: bubbleStyle.userBubbleBg,
                userBubbleText: bubbleStyle.userBubbleText,
                isUsingUserBubble: useUserBubble
        };
}
