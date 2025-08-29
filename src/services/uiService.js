import { createApp } from 'vue';
import db from './database';
import Toast from '../components/ui/Toast.vue';
import PersistentToast from '../components/ui/PersistentToast.vue';
import ConfirmModal from '../components/ui/ConfirmModal.vue';
import PromptModal from '../components/ui/PromptModal.vue';
import UploadChoiceModal from '../components/ui/UploadChoiceModal.vue';
import AlbumPickerModal from '../components/ui/AlbumPickerModal.vue';
import AvatarPickerModal from '../components/ui/AvatarPickerModal.vue';
import ManageGroupsModal from '../components/ui/ManageGroupsModal.vue';
import WorldbookEditModal from '../components/ui/WorldbookEditModal.vue';
import UserPersonaModal from '../components/ui/UserPersonaModal.vue';
import ActionChoiceModal from '../components/ui/ActionChoiceModal.vue';
import PaymentModal from '../components/ui/PaymentModal.vue';

// 跟踪活跃的Toast
let activeToasts = [];
let persistentToasts = new Map(); // 持久化Toast的映射，key为ID
const TOAST_HEIGHT = 60; // 每个Toast大约的高度(包括间隔)

// 确保有一个容器来挂载这些动态组件
function getModalsContainer() {
        let container = document.getElementById('modals-container');
        if (!container) {
                container = document.createElement('div');
                container.id = 'modals-container';
                document.body.appendChild(container);
        }
        return container;
}

/**
 * 显示一个短暂的、非阻塞的提示消息。
 * @param {string} message - 要显示的消息内容。
 * @param {'success' | 'error' | 'info'} [type='info'] - 提示的类型。
 */
export function showToast(message, type = 'info') {
        const container = getModalsContainer();
        const toastWrapper = document.createElement('div');
        container.appendChild(toastWrapper);

        // 计算当前Toast的垂直偏移量
        const topOffset = 20 + (activeToasts.length * TOAST_HEIGHT);
        
        // 创建Toast实例对象
        const toastInstance = {
                wrapper: toastWrapper,
                app: null,
                removed: false
        };

        // 添加到活跃列表
        activeToasts.push(toastInstance);

        const toastApp = createApp(Toast, {
                message,
                type,
                topOffset: topOffset,
                onClose: () => {
                        if (toastInstance.removed) return;
                        
                        // 标记为已移除
                        toastInstance.removed = true;
                        
                        // 从活跃列表中移除
                        const index = activeToasts.indexOf(toastInstance);
                        if (index > -1) {
                                activeToasts.splice(index, 1);
                        }
                        
                        toastApp.unmount();
                        if (container.contains(toastWrapper)) {
                                container.removeChild(toastWrapper);
                        }
                }
        });

        toastInstance.app = toastApp;
        toastApp.mount(toastWrapper);
}

/**
 * 显示持久化Toast，可以动态更新内容
 * @param {string} id - Toast的唯一标识符
 * @param {string} message - 要显示的消息内容
 * @param {'success' | 'error' | 'info' | 'warning' | 'loading'} [type='loading'] - Toast类型
 * @param {boolean} [showSpinner=true] - 是否显示加载动画
 * @param {boolean} [showCloseButton=false] - 是否显示关闭按钮
 * @returns {Object} Toast控制对象，包含update和close方法
 */
export function showPersistentToast(id, message, type = 'loading', showSpinner = true, showCloseButton = false) {
        const container = getModalsContainer();
        
        // 如果已存在相同ID的Toast，先移除
        if (persistentToasts.has(id)) {
                closePersistentToast(id);
        }
        
        const toastWrapper = document.createElement('div');
        container.appendChild(toastWrapper);

        // 计算当前Toast的垂直偏移量 (包括普通Toast和持久化Toast)
        const totalToasts = activeToasts.length + persistentToasts.size;
        const topOffset = 20 + (totalToasts * TOAST_HEIGHT);
        
        let currentMessage = message;
        
        const toastApp = createApp(PersistentToast, {
                message: currentMessage,
                type,
                topOffset: topOffset,
                persistent: true,
                showSpinner,
                showCloseButton,
                onClose: () => {
                        closePersistentToast(id);
                },
                onUpdate: (newMessage) => {
                        currentMessage = newMessage;
                }
        });

        const toastInstance = {
                wrapper: toastWrapper,
                app: toastApp,
                id: id
        };

        // 保存到持久化Toast映射
        persistentToasts.set(id, toastInstance);
        
        toastApp.mount(toastWrapper);
        
        // 返回控制对象
        return {
                update: (newMessage, newType) => {
                        updatePersistentToast(id, newMessage, newType);
                },
                close: () => {
                        closePersistentToast(id);
                }
        };
}

/**
 * 更新持久化Toast的内容
 * @param {string} id - Toast的ID
 * @param {string} message - 新的消息内容
 * @param {string} [type] - 新的类型 (可选)
 */
export function updatePersistentToast(id, message, type) {
        const toastInstance = persistentToasts.get(id);
        if (toastInstance && toastInstance.app._instance) {
                const props = toastInstance.app._instance.props;
                props.message = message;
                if (type) {
                        props.type = type;
                }
        }
}

/**
 * 关闭持久化Toast
 * @param {string} id - Toast的ID
 */
export function closePersistentToast(id) {
        const toastInstance = persistentToasts.get(id);
        if (toastInstance) {
                persistentToasts.delete(id);
                
                try {
                        toastInstance.app.unmount();
                        const container = getModalsContainer();
                        if (container.contains(toastInstance.wrapper)) {
                                container.removeChild(toastInstance.wrapper);
                        }
                } catch (error) {
                        console.error('关闭持久化Toast失败:', error);
                }
        }
}

/**
 * 显示一个确认对话框。
 * @param {string} title - 模态框的标题。
 * @param {string} message - 要向用户确认的信息。
 * @returns {Promise<boolean>} - 用户点击确认返回 true，取消返回 false。
 */
export function showConfirm(title, message) {
        return new Promise((resolve) => {
                const container = getModalsContainer();
                const modalWrapper = document.createElement('div');
                container.appendChild(modalWrapper);

                const confirmApp = createApp(ConfirmModal, {
                        title,
                        message,
                        onConfirm: () => {
                                cleanup();
                                resolve(true);
                        },
                        onCancel: () => {
                                cleanup();
                                resolve(false);
                        }
                });

                const cleanup = () => {
                        confirmApp.unmount();
                        container.removeChild(modalWrapper);
                };

                confirmApp.mount(modalWrapper);
        });
}

/**
 * 显示一个确认对话框（别名函数，为了兼容性）
 * @param {string} title - 模态框的标题。
 * @param {string} message - 要向用户确认的信息。
 * @returns {Promise<boolean>} - 用户点击确认返回 true，取消返回 false。
 */
export function showConfirmModal(title, message) {
        return showConfirm(title, message);
}

/**
 * 显示一个通用的、可自定义的输入框菜单。
 * @param {string} title - 菜单标题
 * @param {string} placeholder - 输入框的提示文字
 * @param {boolean} isTextarea - 是否使用多行文本框
 * @param {boolean} isOptional - 是否允许输入为空
 * @param {string} [initialValue=''] - 输入框的初始值
 * @returns {Promise<string|null>} - 用户确认则返回输入的字符串，取消则返回 null
 */
export function promptForInput(title, placeholder = '', isTextarea = false, isOptional = false, initialValue = '') {
        return new Promise((resolve) => {
                const container = getModalsContainer();
                const modalWrapper = document.createElement('div');
                container.appendChild(modalWrapper);

                const promptApp = createApp(PromptModal, {
                        title,
                        placeholder,
                        isTextarea,
                        isOptional,
                        initialValue,
                        onConfirm: (value) => {
                                cleanup();
                                resolve(value);
                        },
                        onCancel: () => {
                                cleanup();
                                resolve(null);
                        },
                });

                const cleanup = () => {
                        promptApp.unmount();
                        container.removeChild(modalWrapper);
                };

                promptApp.mount(modalWrapper);
        });
}

/**
 * 显示上传方式选择菜单 (本地上传 vs URL)。
 * @returns {Promise<{type: 'url'|'local', value: string|File}|null>}
 */
export function showUploadChoiceModal() {
        return new Promise((resolve) => {
                const container = getModalsContainer();
                const modalWrapper = document.createElement('div');
                container.appendChild(modalWrapper);

                const choiceApp = createApp(UploadChoiceModal, {
                        onSelect: (result) => {
                                cleanup();
                                resolve(result);
                        },
                        onCancel: () => {
                                cleanup();
                                resolve(null);
                        },
                });

                const cleanup = () => {
                        choiceApp.unmount();
                        container.removeChild(modalWrapper);
                };

                choiceApp.mount(modalWrapper);
        });
}

/**
 * 显示一个从相册选择图片的模态框。
 * @returns {Promise<string|null>} 用户选择则返回图片URL，否则返回null
 */
export function showAlbumPickerModal() {
        return new Promise(async (resolve) => {
                const container = getModalsContainer();
                const modalWrapper = document.createElement('div');
                container.appendChild(modalWrapper);

                // 从数据库异步加载相册图片
                const photos = await db.globalAlbum.toArray();

                const cleanup = () => {
                        pickerApp.unmount();
                        if (container.contains(modalWrapper)) {
                                container.removeChild(modalWrapper);
                        }
                };

                const pickerApp = createApp(AlbumPickerModal, {
                        photos, // 将加载的图片传递给组件
                        onSelect: (url) => {
                                cleanup();
                                resolve(url); // 用户选择图片后，Promise返回图片URL
                        },
                        onCancel: () => {
                                cleanup();
                                resolve(null); // 用户取消选择，Promise返回null
                        },
                });

                pickerApp.mount(modalWrapper);
        });
}

/**
 * 显示分组管理模态框
 * @param {string} groupTable - 要管理的数据库表名 ('groups' 或 'worldbookGroups')
 * @returns {void}
 */
export function showManageGroupsModal(groupTable) {
        const container = getModalsContainer();
        const modalWrapper = document.createElement('div');
        container.appendChild(modalWrapper);

        const cleanup = () => {
                modalApp.unmount();
                if (container.contains(modalWrapper)) {
                        container.removeChild(modalWrapper);
                }
        };

        const modalApp = createApp(ManageGroupsModal, {
                isOpen: true,
                groupTable: groupTable, // 传递表名
                onClose: cleanup       // 将清理函数作为 prop 传递
        });

        modalApp.mount(modalWrapper);
}

/**
 * 显示世界书编辑模态框
 * @param {Object} worldbook - 要编辑的世界书对象，新建时传null
 * @returns {Promise<boolean>} - 返回是否保存了更改
 */
export function showWorldbookEditModal(worldbook = null) {
        return new Promise((resolve) => {
                const container = getModalsContainer();
                const modalWrapper = document.createElement('div');
                container.appendChild(modalWrapper);

                const cleanup = () => {
                        modalApp.unmount();
                        if (container.contains(modalWrapper)) {
                                container.removeChild(modalWrapper);
                        }
                };

                const modalApp = createApp(WorldbookEditModal, {
                        isOpen: true,
                        worldbook: worldbook,
                        onClose: () => {
                                cleanup();
                                resolve(false);
                        },
                        onSave: () => {
                                cleanup();
                                resolve(true);
                        }
                });

                modalApp.mount(modalWrapper);
        });
}

/**
 * 显示用户人格预设管理模态框（已转换为页面）
 * @returns {Promise<void>}
 */
export function showUserPersonaModal() {
        return new Promise((resolve) => {
                // 重定向到人格管理页面
                window.location.href = '/user-persona';
                resolve();
        });
}

/**
 * 显示动作选择模态框
 * @param {string} title - 模态框标题
 * @param {Array} actions - 动作选项数组，每个对象包含 key、label、icon
 * @returns {Promise<string|null>} 用户选择则返回动作key，否则返回null
 */
export function showActionChoiceModal(title, actions) {
        return new Promise((resolve) => {
                const container = getModalsContainer();
                const modalWrapper = document.createElement('div');
                container.appendChild(modalWrapper);

                const cleanup = () => {
                        modalApp.unmount();
                        if (container.contains(modalWrapper)) {
                                container.removeChild(modalWrapper);
                        }
                };

                const modalApp = createApp(ActionChoiceModal, {
                        title,
                        actions,
                        onSelect: (actionKey) => {
                                cleanup();
                                resolve(actionKey);
                        },
                        onCancel: () => {
                                cleanup();
                                resolve(null);
                        }
                });

                modalApp.mount(modalWrapper);
        });
}

/**
 * 显示支付模态框（转账或代付）
 * @param {'transfer'|'pay'} type - 支付类型
 * @returns {Promise<Object|null>} 用户确认则返回支付信息对象，否则返回null
 */
export function showPaymentModal(type) {
        return new Promise((resolve) => {
                const container = getModalsContainer();
                const modalWrapper = document.createElement('div');
                container.appendChild(modalWrapper);

                const cleanup = () => {
                        modalApp.unmount();
                        if (container.contains(modalWrapper)) {
                                container.removeChild(modalWrapper);
                        }
                };

                const modalApp = createApp(PaymentModal, {
                        type,
                        onConfirm: (data) => {
                                cleanup();
                                resolve(data);
                        },
                        onCancel: () => {
                                cleanup();
                                resolve(null);
                        }
                });

                modalApp.mount(modalWrapper);
        });
}

/**
 * 显示头像选择器模态框（适用于用户人格和角色）
 * @param {string} actorId - 实体ID，用于加载特定的头像库
 * @param {string} [libraryId=null] - 头像库ID，如果为null则使用actorId
 * @returns {Promise<string|null>} 用户选择则返回图片URL，否则返回null
 */
export function showAvatarPickerModal(actorId, libraryId = null) {
        return new Promise(async (resolve) => {
                const container = getModalsContainer();
                const modalWrapper = document.createElement('div');
                container.appendChild(modalWrapper);

                // 确定实际的头像库ID
                const actualLibraryId = libraryId || actorId;
                
                // 从数据库异步加载头像
                const avatars = await getAvatarLibrary(actualLibraryId);

                const cleanup = () => {
                        pickerApp.unmount();
                        if (container.contains(modalWrapper)) {
                                container.removeChild(modalWrapper);
                        }
                };

                const pickerApp = createApp(AvatarPickerModal, {
                        avatars: avatars,
                        onSelect: (url) => {
                                cleanup();
                                resolve(url);
                        },
                        onCancel: () => {
                                cleanup();
                                resolve(null);
                        },
                        onUpload: async () => {
                                cleanup();
                                // 使用上传选择模态框
                                const uploadResult = await showUploadChoiceModal();
                                if (uploadResult) {
                                        // 检查是否是角色头像库（非用户头像库）
                                        const isCharacterLibrary = actualLibraryId !== '__USER__' && !actualLibraryId.startsWith('user_');
                                        
                                        // 要求用户输入对这个头像的描述
                                        const description = await promptForInput(
                                                '头像描述', 
                                                '请为这个头像添加描述', 
                                                true, 
                                                !isCharacterLibrary  // 角色头像库描述必填，用户头像库可选
                                        );
                                        
                                        // 如果是角色头像库且没有输入描述，则取消上传
                                        if (isCharacterLibrary && (!description || description.trim() === '')) {
                                                showToast('角色头像描述为必填项', 'error');
                                                resolve(null);
                                                return;
                                        }
                                        
                                        // 保存到头像库，包含描述信息
                                        await saveToAvatarLibrary(actualLibraryId, uploadResult.value, description || '');
                                        resolve(uploadResult.value);
                                } else {
                                        resolve(null);
                                }
                        },
                        onDelete: async (urlsToDelete) => {
                                try {
                                        await deleteFromAvatarLibrary(actualLibraryId, urlsToDelete);
                                        showToast(`已删除 ${urlsToDelete.length} 个头像`, 'success');
                                        // 重新加载头像
                                        const updatedAvatars = await getAvatarLibrary(actualLibraryId);
                                        pickerApp.$forceUpdate(); // 或者重新创建组件
                                } catch (error) {
                                        console.error('删除头像失败:', error);
                                        showToast('删除头像失败', 'error');
                                }
                        }
                });

                pickerApp.mount(modalWrapper);
        });
}

/**
 * 获取头像库
 * @param {string} libraryId - 头像库ID
 * @returns {Promise<Array>} 头像数组
 */
async function getAvatarLibrary(libraryId) {
        try {
                // 获取指定ID的头像库
                const entity = await db.actors
                        .filter(actor => actor.id === libraryId)
                        .first();
                
                if (entity && entity.avatarLibrary) {
                        return entity.avatarLibrary.map(item => {
                                if (typeof item === 'string') {
                                        // 旧格式：直接是URL字符串
                                        return { url: item, id: item, description: '' };
                                } else {
                                        // 新格式：包含描述的对象
                                        return { 
                                                url: item.url, 
                                                id: item.url, 
                                                description: item.description || '' 
                                        };
                                }
                        });
                }
                
                return [];
        } catch (error) {
                console.error('Failed to load avatar library:', error);
                return [];
        }
}

/**
 * 保存头像到头像库
 * @param {string} libraryId - 头像库ID
 * @param {string} avatarUrl - 头像URL
 * @param {string} description - 头像描述（可选）
 */
async function saveToAvatarLibrary(libraryId, avatarUrl, description = '') {
        try {
                // 确保__USER__实体存在
                if (libraryId === '__USER__') {
                        await ensureUserEntity();
                }
                
                // 获取或创建实体
                let entity = await db.actors.get(libraryId);
                if (!entity) {
                        // 如果实体不存在，创建一个临时实体（用于新角色的头像库）
                        entity = {
                                id: libraryId,
                                name: libraryId.startsWith('temp_') ? '临时头像库' : '头像库',
                                avatarLibrary: [],
                                isHidden: true
                        };
                        await db.actors.add(entity);
                }
                
                const avatarLibrary = entity.avatarLibrary || [];
                // 检查是否已存在相同URL的头像
                const existingIndex = avatarLibrary.findIndex(item => 
                        (typeof item === 'string' ? item : item.url) === avatarUrl
                );
                
                if (existingIndex === -1) {
                        // 新头像，添加到数组
                        const avatarData = description ? { url: avatarUrl, description } : avatarUrl;
                        avatarLibrary.push(avatarData);
                        await db.actors.update(libraryId, { avatarLibrary });
                        console.log('头像已保存到头像库:', { libraryId, avatarUrl, description });
                } else {
                        console.log('头像已存在于头像库中');
                }
        } catch (error) {
                console.error('Failed to save to avatar library:', error);
                throw error;
        }
}

/**
 * 从头像库删除头像
 * @param {string} libraryId - 头像库ID
 * @param {string[]} avatarUrls - 要删除的头像URL数组
 */
async function deleteFromAvatarLibrary(libraryId, avatarUrls) {
        try {
                const entity = await db.actors.get(libraryId);
                if (entity && entity.avatarLibrary) {
                        const avatarLibrary = entity.avatarLibrary.filter(item => {
                                const url = typeof item === 'string' ? item : item.url;
                                return !avatarUrls.includes(url);
                        });
                        await db.actors.update(libraryId, { avatarLibrary });
                }
        } catch (error) {
                console.error('Failed to delete from avatar library:', error);
                throw error;
        }
}

/**
 * 确保__USER__实体存在
 */
async function ensureUserEntity() {
        try {
                const userEntity = await db.actors.get('__USER__');
                if (!userEntity) {
                        await db.actors.put({
                                id: '__USER__',
                                name: '用户头像库',
                                realName: '',
                                aliases: [],
                                isGroup: 0,
                                groupIds: [],
                                avatarLibrary: [],
                                // 标记为隐藏实体，不在UI中显示
                                isHidden: true
                        });
                }
        } catch (error) {
                console.error('Failed to ensure user entity:', error);
        }
}