import * as fields from './fields';

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
    this._hub.trigger(fields.interaction(), this._buildInteraction(question_id, state));
  }

  _buildInteraction(question_id, { value, unselected }) {
    return {
      type: 'feedback',
      result_type: 'answer',
      question_id,
      value: unselected ? 'unselected' : value,
    };
  }

  _destroy() {
    for (const unsubscribe of this._unsubscribes) {
      unsubscribe();
    }
    this._unsubscribes = [];
  }

}