// src/services/selectionService.js
import { ref, onUnmounted } from 'vue';

/**
 * 一个可复用的 Vue Composable，用于处理网格布局中的项目选择逻辑。
 * @param {Ref<HTMLElement>} containerRef - 对包含可选择项目的容器元素的引用。
 * @returns {object} 包含状态和方法的对象。
 */
export function useSelection(containerRef) {
        const isEditMode = ref(false);
        const selectedItems = ref(new Set());
        const isDragging = ref(false);

        let dragStartPos = { x: 0, y: 0 };
        let selectionRectEl = null;

        const getEventPosition = (e) => {
                if (e.touches && e.touches.length > 0) {
                        return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
                }
                return { clientX: e.clientX, clientY: e.clientY };
        };

        const handleInteractionStart = (e) => {
                if (!isEditMode.value) return;

                const pos = getEventPosition(e);
                dragStartPos = { x: pos.clientX, y: pos.clientY };

                // For mouse, we start dragging on the first significant move.
                // For touch, we assume it might be a click until moved.
                isDragging.value = false;

                window.addEventListener('mousemove', handleInteractionMove);
                window.addEventListener('touchmove', handleInteractionMove, { passive: false });
                window.addEventListener('mouseup', handleInteractionEnd);
                window.addEventListener('touchend', handleInteractionEnd);
        };

        const handleInteractionMove = (e) => {
                if (!isEditMode.value) return;

                const pos = getEventPosition(e);
                const distance = Math.hypot(pos.clientX - dragStartPos.x, pos.clientY - dragStartPos.y);

                if (distance > 10 && !isDragging.value) { // Start dragging only after 10px move
                        isDragging.value = true;
                        if (!selectionRectEl) {
                                selectionRectEl = document.createElement('div');
                                selectionRectEl.style.cssText = `position: fixed; border: 1px dashed white; background-color: rgba(255, 255, 255, 0.2); z-index: 9999; pointer-events: none;`;
                                document.body.appendChild(selectionRectEl);
                        }
                }

                if (!isDragging.value) return;
                e.preventDefault();

                const top = Math.min(pos.clientY, dragStartPos.y);
                const left = Math.min(pos.clientX, dragStartPos.x);
                const width = Math.abs(pos.clientX - dragStartPos.x);
                const height = Math.abs(pos.clientY - dragStartPos.y);

                selectionRectEl.style.top = `${top}px`;
                selectionRectEl.style.left = `${left}px`;
                selectionRectEl.style.width = `${width}px`;
                selectionRectEl.style.height = `${height}px`;

                const rectBounds = selectionRectEl.getBoundingClientRect();
                const items = containerRef.value.querySelectorAll('[data-id]');
                items.forEach(item => {
                        const itemBounds = item.getBoundingClientRect();
                        const isIntersecting = !(rectBounds.right < itemBounds.left || rectBounds.left > itemBounds.right || rectBounds.bottom < itemBounds.top || rectBounds.top > itemBounds.bottom);
                        item.classList.toggle('is-selecting', isIntersecting);
                });
        };

        const handleInteractionEnd = (e) => {
                if (!isEditMode.value) return;

                if (isDragging.value) {
                        const newSelected = new Set(selectedItems.value);
                        const items = containerRef.value.querySelectorAll('[data-id]');
                        items.forEach(item => {
                                if (item.classList.contains('is-selecting')) {
                                        const id = parseInt(item.dataset.id, 10);
                                        if (!newSelected.has(id)) newSelected.add(id);
                                        item.classList.remove('is-selecting');
                                }
                        });
                        selectedItems.value = newSelected;
                } else { // It's a click
                        const itemElement = e.target.closest('[data-id]');
                        if (itemElement) {
                                const id = parseInt(itemElement.dataset.id, 10);
                                const newSelected = new Set(selectedItems.value);
                                if (newSelected.has(id)) {
                                        newSelected.delete(id);
                                } else {
                                        newSelected.add(id);
                                }
                                selectedItems.value = newSelected;
                        }
                }

                cleanup();
        };

        const cleanup = () => {
                window.removeEventListener('mousemove', handleInteractionMove);
                window.removeEventListener('touchmove', handleInteractionMove);
                window.removeEventListener('mouseup', handleInteractionEnd);
                window.removeEventListener('touchend', handleInteractionEnd);
                if (selectionRectEl) {
                        selectionRectEl.remove();
                        selectionRectEl = null;
                }
                isDragging.value = false;
        };

        const toggleEditMode = () => {
                isEditMode.value = !isEditMode.value;
                if (!isEditMode.value) {
                        selectedItems.value.clear();
                        cleanup();
                }
        };

        const resetSelection = () => {
                selectedItems.value.clear();
        };

        onUnmounted(cleanup);

        return {
                isEditMode,
                selectedItems,
                toggleEditMode,
                handleInteractionStart,
                resetSelection,
        };
}