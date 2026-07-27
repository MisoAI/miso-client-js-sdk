import { escapeHtml } from '@miso.ai/commons';

const DEFAULT_CLASSNAME = 'miso-confirm';

/**
 * Show a modal confirmation dialog (a native <dialog>), resolving to whether
 * the user confirmed. Cancel button, backdrop click, and the Escape key all
 * resolve to false. Exposed as `MisoClient.ui.confirm()`.
 */
export default function confirm({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
  className = DEFAULT_CLASSNAME,
} = {}) {
  return new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.className = className;
    dialog.innerHTML = [
      title ? `<div class="${className}__title">${escapeHtml(title)}</div>` : '',
      message ? `<div class="${className}__message">${escapeHtml(message)}</div>` : '',
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
      dialog.remove();
      resolve(dialog.returnValue === 'confirm');
    }, { once: true });
    document.body.appendChild(dialog);
    dialog.showModal();
  });
}
