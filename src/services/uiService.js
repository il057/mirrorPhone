import { createApp } from 'vue';
import db from './database';
import Toast from '../components/ui/Toast.vue';
import ConfirmModal from '../components/ui/ConfirmModal.vue';
import PromptModal from '../components/ui/PromptModal.vue';
import UploadChoiceModal from '../components/ui/UploadChoiceModal.vue';
import AlbumPickerModal from '../components/ui/AlbumPickerModal.vue';
import ManageGroupsModal from '../components/ui/ManageGroupsModal.vue';

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

        const toastApp = createApp(Toast, {
                message,
                type,
                onClose: () => {
                        toastApp.unmount();
                        container.removeChild(toastWrapper);
                }
        });

        toastApp.mount(toastWrapper);
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