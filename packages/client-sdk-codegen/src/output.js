export default class Output {

  constructor(items) {
    this._items = items;
  }

  get items() {
    return this._items;
  }

  [Symbol.iterator]() {
    return this._items[Symbol.iterator]();
  }

  concat() {
    return this._items.filter(item => item).map(item => asHtml(item)).join('\n');
  }

}

function asHtml({ type, content } = {}) {
  // TODO: minify
  switch (type) {
    case 'html':
      return content;
    case 'js':
      return `<script async>\n${content}\n</script>`;
    case 'css':
      return `<style>\n${content}\n</style>`;
    default:
      throw new Error(`Unrecognized type: "${type}"`);
  }
}
