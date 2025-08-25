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
