export function onChild(element, callback) {
  for (const child of element.children) {
    callback(child);
  }
  const observer = new MutationObserver(mutations => {
    for (const { addedNodes } of mutations) {
      for (const child of addedNodes) {
        callback(child);
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
        case 'template/text':
          return new Function('data', `return \`${content}\`;`);
        case 'template/function':
          return new Function('data', `return (${content})(data);`);
      }
  }
  throw new Error(`Unsupported ${tagName} element type: ${type}`);
}

export function htmlToElement(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstChild;
}

export function replaceChildren(element, children) {
  if (typeof children === 'string') {
    element.innerHTML = children;
  } else {
    element.replaceChildren(...children);
  }
}