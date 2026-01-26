import { splitHtmlAtNthOfType } from '@miso.ai/commons';
import Operation from '../model/operation.js';

const DEFAULT_TEMPLATES = {
  root: options => options.templates.upper(options) + options.templates.slot(options) + options.templates.lower(options),
  upper: `<div class="miso-markdown-upper"></div>`,
  slot: options => `<div class="miso-markdown-slot">${options.templates.content(options)}</div>`,
  content: ``, // no default content
  lower: `<div class="miso-markdown-lower"></div>`,
};

function asFunction(fn) {
  return typeof fn === 'function' ? fn : () => fn;
}

function normalizeOptions(options = {}) {
  if (typeof options === 'string') {
    options = { content: options };
  }
  let { templates, tag = 'p', index = 1, content = '', ...rest } = options;
  return Object.freeze({
    templates: normalizeTemplates({ ...templates, content }),
    tag,
    index,
    ...rest,
  });
}

function normalizeTemplates(templates) {
  templates = { ...DEFAULT_TEMPLATES, ...templates };
  const normalized = {};
  for (const key in templates) {
    normalized[key] = asFunction(templates[key]);
  }
  return Object.freeze(normalized);
}


function proxy(element, options) {
  return new ProxyRootElement(element, options);
}

class ProxyRootElement {

  constructor(element, options = {}) {
    this._element = element;
    this._options = options;
  }

  get upper() {
    return this._element.firstElementChild;
  }

  get slot() {
    return this._element.children[1];
  }

  get lower() {
    return this._element.lastElementChild;
  }

  clear() {
    if (this._element.children.length === 0) {
      this._element.innerHTML = this._options.templates.root(this._options);
    }
    this._element._tags = 0;
    this._element.classList.add('miso-markdown-with-slot');
    this._setSlotVisibility(false);
  }

  setHtml(html) {
    const [upperHtml, lowerHtml, tags] = splitHtmlAtNthOfType(html, this._options.tag, this._options.index);
    this.upper.innerHTML = upperHtml;
    this.lower.innerHTML = lowerHtml;
    this._setSlotVisibility(!!lowerHtml);
    this._element._tags = tags;
  }

  appendHtml(html) {
    if (this.upper.children.length === 0) {
      this.setHtml(html);
      return;
    }
    if (this.lower.children.length !== 0) {
      html && this.lower.insertAdjacentHTML('beforeend', html);
      return;
    }
    const [upperHtml, lowerHtml, tags] = splitHtmlAtNthOfType(html, this._options.tag, this._options.index - this._element._tags);
    upperHtml && this.upper.insertAdjacentHTML('beforeend', upperHtml);
    this.lower.innerHTML = lowerHtml;
    this._setSlotVisibility(!!lowerHtml);
    this._element._tags += tags;
  }

  descend() {
    return this.lower.innerHTML ? this.lower : this.upper;
  }

  _setSlotVisibility(visible) {
    this._element.setAttribute('data-slot-status', visible ? 'ready' : 'hidden');
  }

}

export function applyOperationWithSlot(options = {}) {
  options = normalizeOptions(options);
  return (operation, element, ref) => {
    const { type, html } = operation;
    switch (type) {
      case Operation.TYPE.CLEAR:
        // we only need to concern this here
        proxy(element, options).clear();
        ref = element;
        break;
      case Operation.TYPE.APPEND:
        if (ref !== element) {
          operation.applyTo(element, ref);
        } else {
          proxy(element, options).appendHtml(html);
        }
        break;
      case Operation.TYPE.SET:
        proxy(element, options).setHtml(html);
        ref = element;
        break;
      case Operation.TYPE.ASCEND:
        ref = operation.applyTo(element, ref);
        // when resting at a container, additionally ascend one more level
        if (ref.parentElement === element) {
          ref = element;
        }
        break;
      case Operation.TYPE.DESCEND:
        // when starting at root level, additionally descend one more level
        if (ref === element) {
          ref = proxy(element, options).descend();
        }
        ref = operation.applyTo(element, ref);
        break;
      case Operation.TYPE.SOLIDIFY:
        if (ref !== element) {
          ref = operation.applyTo(element, ref);
        } else {
          // TODO
        }
        break;
    }
    return ref;
  };
}
