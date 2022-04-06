export function onChildElement(element, callback) {
  for (const child of element.children) {
    callback(child);
  }
  const observer = new MutationObserver(mutations => {
    for (const { addedNodes } of mutations) {
      for (const child of addedNodes) {
        isElement(child) && callback(child);
      };
    }
  });
  return observer.observe(element, { childList: true });
}

export function parseDataFromElement(element) {
  const tagName = element.tagName.toLowerCase();
  const type = element.getAttribute('type');
  // TODO: support more
  switch (element.tagName.toLowerCase()) {
    case 'script':
      const content = element.textContent;
      switch (element.getAttribute('type')) {
        case 'application/json':
          return JSON.parse(content);
        case 'template/string':
          return new Function('data', `"use strict"; return \`${content}\`;`);
        case 'template/function':
          return new Function('data', `"use strict"; return (${content})(data);`);
      }
  }
  throw new Error(`Unsupported ${tagName} element type: ${type}`);
}

export function isElement(value) {
  return typeof value === 'object' && value.nodeType === Node.ELEMENT_NODE;
}

export function asElement(html) {
  if (isElement(html)) {
    return html;
  }
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  // TODO: validate
  return template.content.firstChild;
}

export function replaceChildren(element, children) {
  if (typeof children === 'string') {
    element.innerHTML = children;
  } else {
    element.replaceChildren(...children);
  }
}

export function isStandardScriptType(value) {
  if (!value || value === 'module') {
    return true;
  }
  const segments = value.split('/');
  if (segments.length != 2) {
    return false;
  }
  const type = segments[0];
  const subtype = segments[1];
  return (type === 'application' || type === 'text') && (subtype.indexOf('javascript') > -1 || subtype.indexOf('ecmascript') > -1);
}
