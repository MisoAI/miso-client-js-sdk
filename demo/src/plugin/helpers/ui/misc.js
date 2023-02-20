export function toElement(html) {
  return _toNode(html, true);
}

export function toNodes(html) {
  return _toNodes(html, false);
}

function _toNodes(html, elementOnly) {
  const template = document.createElement('template');
  template.innerHTML = html;
  return elementOnly ? template.content.children : template.content.childNodes;
}

function _toNode(html, elementOnly) {
  const nodes = _toNodes(html, elementOnly);
  if (nodes.length !== 1) {
    throw new Error(`Expect exactly 1 ${elementOnly ? 'element' : 'node'} from html string: ${html}`);
  }
  return nodes[0];
}

let mainElement;

export function main() {
  return mainElement || (mainElement = document.getElementsByTagName('main')[0]);
}
