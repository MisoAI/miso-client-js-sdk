import { STATUS } from '../../../constants.js';

export function containerElement(layout, element, { status }) {
  if (!element) {
    return undefined;
  }
  if (element.children.length === 0) {
    element.innerHTML = containerHtml(layout);
  }
  const container = element.children[0];
  container.setAttribute('data-status', status || STATUS.INITIAL);
  return container;
}

function containerHtml(layout) {
  let { className, role, options: { tag, format, builtInStyles = true } } = layout;
  if (tag === 'auto') {
    tag = format === 'markdown' ? 'div' : 'p';
  }
  const roleAttr = role ? `data-role="${role}"` : '';
  const classNames = [className, cursorClassName(className)];
  if (builtInStyles && format === 'markdown') {
    classNames.push('miso-markdown');
  }
  return `<${tag} class="${classNames.join(' ')}" ${roleAttr} data-format="${format}"></${tag}>`;
}

export function cursorClassName(className) {
  return `${className}__cursor`;
}

export function fromSameSession(a, b) {
  return a && b && a.session && b.session && a.session.uuid === b.session.uuid;
}

export function normalizeOnDebug(fn) {
  if (fn === true) {
    return defaultOnDebug();
  }
  if (!fn) {
    return undefined;
  }
  if (typeof fn === 'function') {
    return fn;
  }
  throw new Error('onDebug must be a function or a boolean');
}

function defaultOnDebug(start = performance.now()) {
  return function({ summary, timestamp, elapsed, ref, operation, conflict }) {
    MisoClient.debug('<progressive-markdown>', `[${formatTimeInSeconds(timestamp - start)}](${formatTimeInMilliseconds(elapsed[0])}, ${formatTimeInMilliseconds(elapsed[1])})`, summary, `${operation}`, ref, conflict);
  };
}

function formatTimeInSeconds(t) {
  return `${Math.floor(t) / 1000}s`;
}

function formatTimeInMilliseconds(t) {
  return `${Math.floor(t * 100) / 100}ms`;
}
