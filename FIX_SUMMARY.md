# Bug Fixes Summary

## 已修复的问题

### 1. 聊天背景无法正确应用到ChatRoom
**问题**: CharEdit界面设置的聊天背景无法在ChatRoomView中显示
**修复**: 
- 简化了CharEditView中的背景设置逻辑，直接使用AlbumPickerModal
- 在ChatRoomView的onMounted中添加了聊天背景应用逻辑
- 背景图片会自动应用到`.messages-container`元素

### 2. 主题色切换时缺少accent-darker和accent-lighter计算
**问题**: 切换accentColor时没有计算衍生颜色变量
**修复**:
- 在themeService.js中导入colorUtils的adjustColorLuminance函数
- 修改applyActorTheme和toggleActorTheme函数，添加衍生颜色计算
- 保存和恢复原始主题时也包含衍生颜色

### 3. 聊天背景按钮逻辑过于复杂
**问题**: 背景设置流程包含多个确认框，用户体验差
**修复**:
- 简化changeChatBackground函数，直接打开AlbumPickerModal
- 用户选择图片后直接应用，取消则不做任何操作

### 4. Album和Stickers页面下拉菜单不可用
**问题**: 下拉菜单无法正确响应点击外部关闭
**修复**:
- ~~修改DropdownMenu组件，添加点击外部关闭功能~~
- ~~重构AlbumView和StickersView的下拉菜单结构~~
- **最终解决方案**: 将AlbumView和StickersView改为使用HeaderDropdownMenu
- 参考ChatLayout的实现方式，使用固定定位的下拉菜单
- 移除了普通DropdownMenu的使用，统一使用HeaderDropdownMenu

## 技术改进

### colorUtils.js 使用
- adjustColorLuminance函数用于计算颜色的深浅变体
- 确保主题色变化时所有相关CSS变量都能正确更新

### HeaderDropdownMenu统一使用
- AlbumView和StickersView现在使用HeaderDropdownMenu而不是普通DropdownMenu
- HeaderDropdownMenu使用固定定位，覆盖整个屏幕，点击外部自动关闭
- 与ChatLayout保持一致的下拉菜单体验

### 聊天背景应用
- 在ChatRoomView中直接操作DOM元素应用背景
- 使用CSS的background-attachment: fixed确保背景稳定
- 支持动态切换和清除背景

## 测试要点

1. **聊天背景**: 在CharEdit中设置背景后，进入ChatRoom应该能看到背景图片
2. **主题色**: 切换主题色时，所有使用accent-darker和accent-lighter的元素应该正确更新
3. **下拉菜单**: Album和Stickers页面的下拉菜单应该能正常打开和关闭（现在使用HeaderDropdownMenu）
4. **背景设置**: 点击背景设置按钮应该直接打开相册选择器，无需多次确认

## 最新更新 (2025-08-27)

### 下拉菜单问题最终解决
- 发现之前的DropdownMenu修复仍然有问题
- 改为使用HeaderDropdownMenu，这是一个更稳定的解决方案
- HeaderDropdownMenu使用全屏遮罩层，确保点击外部能正确关闭
- 现在AlbumView和StickersView的下拉菜单行为与ChatLayout完全一致
