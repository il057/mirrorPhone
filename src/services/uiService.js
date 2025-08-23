import { createApp } from 'vue';
import Toast from '../components/ui/Toast.vue';
import ConfirmModal from '../components/ui/ConfirmModal.vue';

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