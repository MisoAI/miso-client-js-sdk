import { toHtml } from 'hast-util-to-html';

export default class Compiler {

  constructor(options = {}) {
    // TODO: allowDangerousHtml = true?
    this._options = options;
  }

  stringify(node) {
    return toHtml(node, this._options);
  }

}
