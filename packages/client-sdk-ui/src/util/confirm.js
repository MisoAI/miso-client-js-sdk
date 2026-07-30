import { openModal } from './modal.js';

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
  return openModal({
    className,
    title,
    message,
    confirmText,
    cancelText,
    danger,
    result: () => true,
    cancelValue: false,
  });
}
