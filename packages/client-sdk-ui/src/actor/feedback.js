import * as fields from './fields.js';

export default class FeedbackActor {

  constructor(hub) {
    this._hub = hub;
    this._unsubscribes = [
      hub.on(fields.feedback(), state => this._trigger(state)),
    ];
  }
  
  _trigger(state) {
    const { [fields.data()]: data } = this._hub.states;
    const { question_id } = data && data.value || {};
    if (!question_id) {
      return;
    }
    // TODO: ad-hoc
    const { request } = data || {};
    const { payload } = request || {};
    const question_source = payload && payload._meta && payload._meta.question_source;
    this._hub.trigger(fields.interaction(), this._buildInteraction(state, { question_source }));
  }

  _buildInteraction({ value, unselected }, { question_source }) {
    return {
      type: 'feedback',
      context: {
        custom_context: {
          result_type: 'answer',
          question_source,
          value: unselected ? 'unselected' : value,
        },
      },
    };
  }

  _destroy() {
    for (const unsubscribe of this._unsubscribes) {
      unsubscribe();
    }
    this._unsubscribes = [];
  }

}
