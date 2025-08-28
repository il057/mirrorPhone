/**
 * 当前状态服务
 * 管理用户当前的状态，如当前聊天室、活跃状态等
 */

let currentChatRoomId = null;

/**
 * 设置当前聊天室ID
 * @param {string} chatRoomId - 聊天室ID
 */
export function setCurrentChatRoom(chatRoomId) {
    console.log('设置当前聊天室:', chatRoomId);
    currentChatRoomId = chatRoomId;
}

/**
 * 获取当前聊天室ID
 * @returns {string|null} 当前聊天室ID
 */
export function getCurrentChatRoom() {
    return currentChatRoomId;
}

/**
 * 清除当前聊天室
 */
export function clearCurrentChatRoom() {
    console.log('清除当前聊天室:', currentChatRoomId);
    currentChatRoomId = null;
}

/**
 * 检查指定聊天室是否为当前活跃聊天室
 * @param {string} chatRoomId - 要检查的聊天室ID
 * @returns {boolean} 是否为当前活跃聊天室
 */
export function isCurrentChatRoom(chatRoomId) {
    return currentChatRoomId === chatRoomId;
}

export default {
    setCurrentChatRoom,
    getCurrentChatRoom,
    clearCurrentChatRoom,
    isCurrentChatRoom
};
