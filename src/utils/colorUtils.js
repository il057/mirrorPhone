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
  const luminance = getLuminance(primaryColor);
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
 * 调整颜色亮度
 * @param {string} hexColor 十六进制颜色代码
 * @param {number} amount 调整量，正值增加亮度，负值减少亮度
 * @returns {string} 调整后的十六进制颜色代码
 */
export function adjustColorLuminance(hexColor, amount) {
  let hex = hexColor.replace('#', '');
  
  if (hex.length === 3) {
    hex = hex.charAt(0) + hex.charAt(0) + hex.charAt(1) + hex.charAt(1) + hex.charAt(2) + hex.charAt(2);
  }
  
  const num = parseInt(hex, 16);
  let r = (num >> 16) + amount * 255;
  let g = ((num >> 8) & 0x00FF) + amount * 255;
  let b = (num & 0x0000FF) + amount * 255;
  
  r = Math.min(255, Math.max(0, Math.round(r)));
  g = Math.min(255, Math.max(0, Math.round(g)));
  b = Math.min(255, Math.max(0, Math.round(b)));
  
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
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
