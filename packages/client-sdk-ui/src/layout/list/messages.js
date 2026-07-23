import { Resolution } from '@miso.ai/commons';
import { hasAnswer } from '@miso.ai/client-sdk-workflow';
import { LAYOUT_TYPE } from '../../constants.js';
import CollectionLayout from './collection.js';

const TYPE = LAYOUT_TYPE.MESSAGES;
const DEFAULT_CLASSNAME = 'miso-messages';

/**
 * The conversation panel of the chat history interface: a list of `message`
 * items (question bubble + answer body).
 *
 * The item template leaves the answer content blank; after each render, a
 * second pass (`_syncAnswers`) fills in the answer bodies, transforming the
 * markdown content into HTML through the `std:ui-markdown` plugin — without
 * the typewriting effect.
 */
export default class MessagesLayout extends CollectionLayout {

  static get type() {
    return TYPE;
  }

  static get defaultClassName() {
    return DEFAULT_CLASSNAME;
  }

  constructor({ className = DEFAULT_CLASSNAME, ...options } = {}) {
    super({ className, ...options });
    this._renderedAnswers = new WeakMap(); // answer element -> rendered markdown
    this._readiness = new Resolution();
    // kick off sooner
    MessagesLayout.MisoClient.plugins.install('std:ui-markdown');
  }

  initialize(view) {
    super.initialize(view);
    this._setup();
  }

  // setup //
  async _setup() {
    try {
      const plugin = await MessagesLayout.MisoClient.plugins.install('std:ui-markdown');
      if (!this._view) {
        return; // destroyed
      }
      this._markdown = plugin.getContext(this._view.workflow._client);
      this._readiness.resolve();
    } catch (e) {
      this._readiness.reject(e);
    }
  }

  async _ready() {
    return this._readiness.promise;
  }

  // render //
  _afterRender(element, state) {
    super._afterRender(element, state); // syncs bindings to the latest values
    this._syncAnswers(element).catch(error => console.error(error));
  }

  async _syncAnswers(element) {
    await this._ready();
    const markdown = this._markdown;
    for (const item of this._getItemElements(element)) {
      const binding = this._bindings.get(item);
      if (!binding || !hasAnswer(binding.value)) {
        continue;
      }
      const answerElement = item.querySelector('[data-role="answer"]');
      if (!answerElement) {
        continue;
      }
      const { answer, sources } = binding.value;
      if (this._renderedAnswers.get(answerElement) === answer) {
        continue; // already rendered
      }
      this._renderedAnswers.set(answerElement, answer);
      try {
        answerElement.innerHTML = await markdown.transform(answer, sources);
      } catch (error) {
        this._renderedAnswers.delete(answerElement);
        throw error;
      }
    }
  }

}
