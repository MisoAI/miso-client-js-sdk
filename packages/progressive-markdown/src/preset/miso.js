import remarkGfm from 'remark-gfm';
import rehypeMinifyWhitespace from 'rehype-minify-whitespace';
import rehypeLinkClass from '../rehype-link-class.js';
import { mergeRendererOptions } from '../utils.js';

export default function miso({ onCitationLink, ...options } = {}) {
  return mergeRendererOptions({
    parser: {
      remark: [remarkGfm],
      rehype: [rehypeMinifyWhitespace, () => rehypeLinkClass(onCitationLink)],
    },
  }, options);
}
