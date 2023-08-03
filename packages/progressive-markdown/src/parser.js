import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeMinifyWhitespace from 'rehype-minify-whitespace';
import rehypeHast from './rehype-hast.js';

export default class Parser {
  
  constructor({ remark = [remarkGfm], rehype = [rehypeMinifyWhitespace], ...options } = {}) {
    let processer = unified().use(remarkParse);
    for (const plugin of remark) {
      processer = processer.use(plugin);
    }
    processer = processer.use(remarkRehype);
    for (const plugin of rehype) {
      processer = processer.use(plugin);
    }
    this._processer = processer.use(rehypeHast);
  }

  async parse(source) {
    // optimize:
    // 1. memoize source
    // 2. analyze safe bound in top level tree node and write down its source position
    // 3. if prev source is a prefix of new source, parse the incremental part and merge with prev tree
    // TODO
    return (await this._processer.process(source)).result;
  }

  parseSync(source) {
    return this._processer.processSync(source).result;
  }

}
