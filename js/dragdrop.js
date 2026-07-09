/**
 * Drag and drop module using SortableJS.
 * Manages card reordering and kanban column drag.
 */

import { updateTaskOrder, updateTaskStatus, saveKanbanOrder } from './tasks.js';

let cardSortable = null;
let kanbanSortables = [];

/** Coarse pointer devices need slightly more forgiving drag settings. */
function getSortableTouchOptions() {
  const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches;
  return {
    delay: coarsePointer ? 180 : 0,
    delayOnTouchOnly: true,
    touchStartThreshold: 5,
    fallbackOnBody: true,
    forceFallback: Boolean(coarsePointer),
    fallbackTolerance: coarsePointer ? 6 : 3,
    scroll: true,
    bubbleScroll: true,
  };
}

/**
 * Initialize drag and drop for task cards grid
 * @param {HTMLElement} container
 * @param {Function} onReorder
 */
export function initCardDragDrop(container, onReorder) {
  if (!container || typeof Sortable === 'undefined') return;

  destroyCardSortable();

  cardSortable = Sortable.create(container, {
    animation: 200,
    handle: '.task-card__drag-handle',
    ghostClass: 'task-card--ghost',
    chosenClass: 'task-card--chosen',
    dragClass: 'task-card--drag',
    ...getSortableTouchOptions(),
    onEnd(evt) {
      const orderedIds = [...container.querySelectorAll('.task-card')].map(
        (el) => el.dataset.taskId
      );
      updateTaskOrder(orderedIds);
      if (onReorder) onReorder(orderedIds);
    },
  });
}

/**
 * Initialize kanban board drag and drop
 * @param {Object} columns - { todo, inProgress, completed } element refs
 * @param {Function} onStatusChange
 */
export function initKanbanDragDrop(columns, onStatusChange) {
  if (typeof Sortable === 'undefined') return;

  destroyKanbanSortables();

  const statusMap = {
    'kanban-todo': 'todo',
    'kanban-in-progress': 'in-progress',
    'kanban-completed': 'completed',
  };

  Object.entries(columns).forEach(([key, el]) => {
    if (!el) return;

    const sortable = Sortable.create(el, {
      group: 'kanban',
      animation: 200,
      ghostClass: 'kanban-card--ghost',
      chosenClass: 'kanban-card--chosen',
      handle: '.kanban-card__drag',
      ...getSortableTouchOptions(),
      onEnd(evt) {
        const taskId = evt.item.dataset.taskId;
        const newColumn = evt.to.id;
        const newStatus = statusMap[newColumn];

        if (taskId && newStatus) {
          updateTaskStatus(taskId, newStatus);
          if (onStatusChange) onStatusChange(taskId, newStatus);
        }

        saveKanbanColumnOrders(columns);
      },
    });

    kanbanSortables.push(sortable);
  });
}

/** Save all kanban column orders */
function saveKanbanColumnOrders(columns) {
  const orders = {};
  Object.entries(columns).forEach(([key, el]) => {
    if (el) {
      orders[key] = [...el.querySelectorAll('.kanban-card')].map((c) => c.dataset.taskId);
    }
  });
  saveKanbanOrder(orders);
}

/** Destroy card sortable instance */
export function destroyCardSortable() {
  if (cardSortable) {
    cardSortable.destroy();
    cardSortable = null;
  }
}

/** Destroy kanban sortable instances */
export function destroyKanbanSortables() {
  kanbanSortables.forEach((s) => s.destroy());
  kanbanSortables = [];
}

/** Destroy all sortable instances */
export function destroyAllSortables() {
  destroyCardSortable();
  destroyKanbanSortables();
}
