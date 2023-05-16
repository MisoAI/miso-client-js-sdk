export default class PlaintextRenderer {

  clear(element) {
    element.innerText = '';
    return { cursor: 0, done: false };
  }

  update(element, { input: prevInput, cursor: prevCursor }, { input, cursor }) {
    const { text } = input;
    const length = text.length;
    cursor = Math.min(cursor, length);
    const done = !!input.done && (cursor === length);

    // in case text already rendered were modified
    const prevRenderedText = prevInput.text.substring(0, prevCursor);
    const overwrite = !text.startsWith(prevRenderedText);

    // when done, also re-set the entire text so we don't have fragmental text nodes
    if (done || overwrite) {
      element.innerText = text;
    } else {
      element.insertAdjacentText('beforeend', text.substring(prevCursor, cursor));
    }
    done && element.classList.add('done');

    return { cursor, done };
  }

}
