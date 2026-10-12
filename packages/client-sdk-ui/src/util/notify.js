import { escapeHtml } from '@miso.ai/commons';

const DEFAULT_CLASSNAME = 'miso-notice';
const DEFAULT_DURATION = 5000;

/**
 * Show a transient notice (a toast) in a corner of the page, dismissed
 * after `duration` milliseconds (0 keeps it until closed), or by its close
 * button. A notice with the very text of one on display is not stacked:
 * the displayed one stays, its timer starting over. Returns a function
 * that dismisses the notice. Exposed as `MisoClient.ui.notify()`.
 */
export default function notify({
  message,
  type = 'info', // 'info' | 'error'
  duration = DEFAULT_DURATION,
  className = DEFAULT_CLASSNAME,
} = {}) {
  if (!message) {
    return () => {};
  }
  const container = getContainer(className);
  let notice = [...container.children].find(element => element._misoNotice && element._misoNotice.key === `${type}:${message}`);
  if (!notice) {
    notice = createNotice(className, type, message);
    container.appendChild(notice);
  }
  notice._misoNotice.schedule(duration);
  return notice._misoNotice.dismiss;
}

// the stack hosting the notices, created on demand and removed when empty
function getContainer(className) {
  let container = document.querySelector(`.${className}-stack`);
  if (!container) {
    container = document.createElement('div');
    container.className = `${className}-stack`;
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }
  return container;
}

function createNotice(className, type, message) {
  const notice = document.createElement('div');
  notice.className = `${className} ${className}--${type}`;
  notice.setAttribute('role', type === 'error' ? 'alert' : 'status');
  notice.innerHTML = [
    `<div class="${className}__message">${escapeHtml(message)}</div>`,
    `<button type="button" class="${className}__close-button" data-role="close" aria-label="Dismiss">&times;</button>`,
  ].join('');
  let timer;
  const dismiss = () => {
    clearTimeout(timer);
    const container = notice.parentElement;
    notice.remove();
    container && container.children.length === 0 && container.remove();
  };
  const schedule = (duration) => {
    clearTimeout(timer);
    timer = duration > 0 ? setTimeout(dismiss, duration) : undefined;
  };
  notice.addEventListener('click', (event) => {
    event.target.closest('[data-role="close"]') && dismiss();
  });
  notice._misoNotice = { key: `${type}:${message}`, dismiss, schedule };
  return notice;
}
