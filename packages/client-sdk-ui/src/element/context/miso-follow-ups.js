import MisoContextElement from './miso-context.js';

const TAG_NAME = 'miso-follow-ups';

export default class MisoFollowUpsElement extends MisoContextElement {

  static get tagName() {
    return TAG_NAME;
  }

  static get observedAttributes() {
    return MisoContextElement.observedAttributes;
  }

  constructor() {
    super();
    this._unsubscribes = [];
  }

  _getContext(client) {
    return client.ui.asks;
  }

  _onContext(context, oldContext) {
    if (context === oldContext) {
      return;
    }
    this._unwire();
    this._wire(context);
  }

  _unwire() {
    for (const unsubscribe of this._unsubscribes || []) {
      unsubscribe();
    }
    this._unsubscribes = [];
  }

  _wire(context) {
    if (!context) {
      return;
    }

    // 1. when an answer is fully populated, insert a new section for the follow-up question
    this._unsubscribes.push(context.on('done', (event) => {
      const template = event.workflow._options.resolved.templates.followUp;
      if (!template) {
        return;
      }
      this.insertAdjacentHTML('beforeend', template({ parentQuestionId: event.workflow.questionId }));
    }));

    // 2. if user starts over, clean up existing follow-up questions
    this._unsubscribes.push(context.root.on('loading', () => {
      // clean up the entire follow-ups section
      this.innerHTML = '';
      // destroy all follow-up workflows
      context.reset({ root: false });
    }));
  }

}
