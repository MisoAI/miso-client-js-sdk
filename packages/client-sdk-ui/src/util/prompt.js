import { escapeHtml } from '@miso.ai/commons';
import { openModal } from './modal.js';

const DEFAULT_CLASSNAME = 'miso-prompt';

/**
 * Show a modal input dialog (a native <dialog>), resolving to the entered
 * (trimmed) text when confirmed. Cancel button, backdrop click, and the
 * Escape key all resolve to undefined. The Enter key confirms. Exposed as
 * `MisoClient.ui.prompt()`.
 */
export default function prompt({
  title,
  message,
  value = '',
  placeholder,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  className = DEFAULT_CLASSNAME,
} = {}) {
  return openModal({
    className,
    title,
    message,
    body: `<input class="${className}__input" type="text" data-role="input" value="${escapeHtml(value)}"${placeholder ? ` placeholder="${escapeHtml(placeholder)}"` : ''}>`,
    confirmText,
    cancelText,
    onOpen: (dialog) => {
      const input = dialog.querySelector('[data-role="input"]');
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          dialog.close('confirm');
        }
      });
      input.focus();
      input.select();
    },
    result: dialog => dialog.querySelector('[data-role="input"]').value.trim(),
    cancelValue: undefined,
  });
}
