export function addOrRemoveClass(element, name, add) {
  if (add) {
    element.classList.add(name);
  } else {
    element.classList.remove(name);
  }
}
