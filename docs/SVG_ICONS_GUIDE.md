# SVG 图标使用指南

## 概述

本项目已完全支持SVG格式的图标，替代了原有的emoji图标。所有的SVG图标都是矢量格式，支持主题色彩自适应，并提供了统一的图标库。

## 在Vue组件中使用

### ActionChoiceModal.vue

ActionChoiceModal组件已内置SVG图标库，支持以下使用方式：

```javascript
// 方式1：使用iconType属性
const actions = [
  { key: 'text-image', label: '文字图片', iconType: 'text-image' },
  { key: 'upload-image', label: '上传图片', iconType: 'upload-image' }
];

// 方式2：直接提供SVG字符串
const actions = [
  { 
    key: 'custom', 
    label: '自定义', 
    svg: '<svg>...</svg>' 
  }
];

// 方式3：使用key自动匹配
const actions = [
  { key: 'voice', label: '语音通话' }, // 会自动匹配voice图标
  { key: 'video', label: '视频通话' }  // 会自动匹配video图标
];
```

### 在ChatRoomView.vue中的使用示例

```javascript
// 发送图片选项
const handleSendImage = async () => {
  const actions = [
    { key: 'text-image', label: '文字图片', iconType: 'text-image' },
    { key: 'upload-image', label: '上传图片', iconType: 'upload-image' }
  ];
  
  const choice = await showActionChoiceModal('发送图片', actions);
};

// 支付选项
const handlePayment = async () => {
  const actions = [
    { key: 'transfer', label: '转账', iconType: 'transfer' },
    { key: 'pay', label: '代付', iconType: 'pay' }
  ];
  
  const choice = await showActionChoiceModal('支付选项', actions);
};

// 更多功能
const handleMoreActions = async () => {
  const actions = [
    { key: 'red-packet', label: '发红包', iconType: 'red-packet' },
    { key: 'sticker', label: '表情包', iconType: 'sticker' },
    { key: 'music', label: '音乐分享', iconType: 'music' },
    { key: 'location', label: '位置分享', iconType: 'location' },
    { key: 'file', label: '文件分享', iconType: 'file' },
    { key: 'gift', label: '送礼物', iconType: 'gift' }
  ];
  
  const choice = await showActionChoiceModal('更多功能', actions);
};
```

## 在传统JavaScript文件中使用 (如chatRoom.js)

### 引入全局SVG图标库

在HTML文件中引入SVG图标库：

```html
<script src="/libs/svgIcons.js"></script>
```

### 使用全局函数

```javascript
// 获取SVG图标 (默认36px)
const iconSvg = getSvgIcon('voice');

// 获取指定尺寸的SVG图标
const smallIcon = getSvgIcon('voice', 24);
const largeIcon = getSvgIcon('voice', 48);

// 获取默认占位符图标
const defaultIcon = getDefaultSvg();

// 使用SvgIcons对象的方法
const icon = SvgIcons.get('video');
const hasIcon = SvgIcons.has('music');
const allIcons = SvgIcons.list();

// 创建包含SVG的DOM元素
const iconElement = SvgIcons.createElement('transfer', 36, 'custom-class');
document.body.appendChild(iconElement);
```

### 在chatRoom.js中的使用示例

```javascript
// 创建动作按钮时使用SVG图标
function createActionButton(actionType, label) {
  const button = document.createElement('button');
  button.className = 'action-button';
  
  const iconSpan = document.createElement('span');
  iconSpan.className = 'action-icon';
  iconSpan.innerHTML = getSvgIcon(actionType);
  
  const labelSpan = document.createElement('span');
  labelSpan.className = 'action-label';
  labelSpan.textContent = label;
  
  button.appendChild(iconSpan);
  button.appendChild(labelSpan);
  
  return button;
}

// 使用示例
const voiceButton = createActionButton('voice', '语音通话');
const videoButton = createActionButton('video', '视频通话');
const transferButton = createActionButton('transfer', '转账');
```

## 可用的图标列表

以下是所有内置的SVG图标：

### 图片相关
- `text-image` - 文字图片
- `upload-image` - 上传图片
- `photo` - 照片
- `camera` - 相机

### 支付相关
- `transfer` - 转账
- `pay` - 支付/代付
- `money` - 金钱

### 通话相关
- `voice` - 语音通话
- `video` - 视频通话
- `microphone` - 麦克风

### 红包和礼物
- `red-packet` - 红包
- `gift` - 礼物

### 娱乐和社交
- `sticker` - 表情包
- `music` - 音乐
- `game` - 游戏

### 位置和文件
- `location` - 位置
- `file` - 文件
- `folder` - 文件夹

### 系统和工具
- `settings` - 设置
- `search` - 搜索
- `add` - 添加
- `close` - 关闭

### 常用操作
- `copy` - 复制
- `delete` - 删除
- `edit` - 编辑
- `reply` - 回复
- `forward` - 转发
- `heart` - 喜欢

### 默认
- `default` - 默认占位符

## 样式说明

所有SVG图标都支持CSS样式自定义：

```css
.action-icon svg {
  width: 36px;
  height: 36px;
  color: var(--text-secondary);
  transition: color 0.2s;
}

.action-item:hover .action-icon svg {
  color: var(--accent-primary);
}
```

## 添加新图标

要添加新的SVG图标，需要在以下文件中同时添加：

1. `src/components/ui/ActionChoiceModal.vue` - Vue组件中的图标库
2. `src/utils/svgIcons.js` - Vue项目的图标库
3. `public/libs/svgIcons.js` - 全局JavaScript图标库

确保所有图标都使用相同的格式：
- 24x24 viewBox
- stroke="currentColor" 支持主题色
- stroke-width="1.6" 保持一致的线条粗细
- width="36" height="36" 默认尺寸

## 最佳实践

1. **优先使用iconType属性**：在创建actions时，使用iconType属性而不是直接的SVG字符串，便于维护。

2. **保持图标风格一致**：所有图标都采用线条风格，避免混合使用填充和线条图标。

3. **支持主题色**：使用 `stroke="currentColor"` 确保图标能适应不同主题。

4. **合理的尺寸**：默认36px适合大多数情况，小图标使用24px，大图标使用48px。

5. **向后兼容**：现有的emoji图标仍然可以工作，但建议逐步迁移到SVG图标。
