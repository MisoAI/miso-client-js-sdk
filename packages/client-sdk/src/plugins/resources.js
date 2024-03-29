import version from '../version.js';

export function push(Plugin) {
  const symbol = Symbol.for('miso:resources');
  const request = document.currentScript && document.currentScript.dataset.request || `plugin:${Plugin.id}@${version}`;
  (window[symbol] || (window[symbol] = [])).push([request, Plugin]);
}
