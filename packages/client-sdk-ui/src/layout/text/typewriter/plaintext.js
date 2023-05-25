export default class PlaintextRenderer {

  clear(element) {
    element.innerText = '';
    return { cursor: 0, done: false };
  }

  update(element, { value: prevValue, cursor: prevCursor }, { value, cursor, done: dataDone }) {
    const length = value.length;
    cursor = Math.min(cursor, length);
    const viewDone = !!dataDone && (cursor === length);

    // in case text already rendered were modified
    const prevRenderedText = prevValue.substring(0, prevCursor);
    const overwrite = !value.startsWith(prevRenderedText);

    // when done, also re-set the entire text so we don't have fragmental text nodes
    if (viewDone || overwrite) {
      element.innerText = value;
    } else {
      element.insertAdjacentText('beforeend', value.substring(prevCursor, cursor));
    }
    viewDone && element.classList.add('done');

    return { cursor, done: viewDone };
  }

}
