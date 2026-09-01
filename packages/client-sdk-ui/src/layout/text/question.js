import { escapeHtml } from '@miso.ai/commons';
import { isUpdateMessage } from '@miso.ai/client-sdk-workflow';
import { LAYOUT_TYPE } from '../../constants.js';
import { setOrRemoveAttribute } from '../../util/dom.js';
import TextLayout from './text.js';

const TYPE = LAYOUT_TYPE.QUESTION;
const DEFAULT_CLASSNAME = 'miso-question';

// the author label: only a question written by the answer-updates monitor is
// labeled — the user's own questions carry none
function defaultAuthor(message) {
  return isUpdateMessage(message) ? 'Written by Miso' : undefined;
}

function content(layout, { value }) {
  const question = value && value.question;
  return question ? escapeHtml(question) : '';
}

/**
 * The question of a message: a text layout taking the whole message record —
 * the text is the `question` field, and the authorship is stamped as data
 * attributes on the host element (`data-author` drives the CSS label badge,
 * `data-generated-by` the bubble color), re-applied on every render, since
 * the metadata arrives with the answers response, after the stub render. The
 * host element hides while there is no question text to show. The author
 * label is configurable via the `author` option (message -> label text).
 */
export default class QuestionLayout extends TextLayout {

  static get type() {
    return TYPE;
  }

  static get defaultClassName() {
    return DEFAULT_CLASSNAME;
  }

  constructor({ className = DEFAULT_CLASSNAME, tag = 'div', author = defaultAuthor, templates, ...options } = {}) {
    super({
      className,
      tag,
      author,
      templates: { content, ...templates },
      ...options,
    });
  }

  _afterRender(element, state) {
    super._afterRender(element, state);
    const message = state.value || {};
    element.hidden = !message.question;
    setOrRemoveAttribute(element, 'data-author', this.options.author(message));
    setOrRemoveAttribute(element, 'data-generated-by', (message.metadata && message.metadata.miso_generated_by) || undefined);
  }

}
