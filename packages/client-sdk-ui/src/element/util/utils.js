export function triggerMisoAction(element, data) {
  element.dispatchEvent(new CustomEvent('miso:action', { bubbles: true, detail: data }));
}
