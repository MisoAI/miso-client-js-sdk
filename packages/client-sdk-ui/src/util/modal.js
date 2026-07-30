import { escapeHtml } from '@miso.ai/commons';

/**
 * The shared modal dialog core of confirm() and prompt(): a native <dialog>
 * with title, message, an optional body, and cancel/confirm actions. Resolves
 * with `result(dialog)` when confirmed; the cancel button, a backdrop click,
 * and the Escape key all resolve with `cancelValue`.
 */
export function openModal({
  className,
  title,
  message,
  body = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
  onOpen,
  result = () => true,
  cancelValue,
} = {}) {
  return new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.className = className;
    dialog.innerHTML = [
      title ? `<div class="${className}__title">${escapeHtml(title)}</div>` : '',
      message ? `<div class="${className}__message">${escapeHtml(message)}</div>` : '',
      body,
      `<div class="${className}__actions">`,
      `<button type="button" class="${className}__button ${className}__cancel-button" data-role="cancel">${escapeHtml(cancelText)}</button>`,
      `<button type="button" class="${className}__button ${className}__confirm-button${danger ? ` ${className}__confirm-button--danger` : ''}" data-role="confirm">${escapeHtml(confirmText)}</button>`,
      `</div>`,
    ].join('');
    dialog.addEventListener('click', (event) => {
      if (event.target.closest('[data-role="confirm"]')) {
        dialog.close('confirm');
      } else if (event.target.closest('[data-role="cancel"]') || event.target === dialog) {
        dialog.close(); // cancel button or backdrop click
      }
    });
    dialog.addEventListener('close', () => {
      const value = dialog.returnValue === 'confirm' ? result(dialog) : cancelValue;
      dialog.remove();
      resolve(value);
    }, { once: true });
    document.body.appendChild(dialog);
    dialog.showModal();
    onOpen && onOpen(dialog);
  });
}
