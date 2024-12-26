import * as fields from './fields.js';
import { EVENT_TYPE } from '../constants.js';

export default class FeedbackActor {

  constructor(hub) {
    this._hub = hub;
    this._unsubscribes = [
      hub.on(fields.feedback(), state => this._trigger(state)),
    ];
  }
  
  _trigger(state) {
    this._hub.trigger(fields.tracker(), {
      type: EVENT_TYPE.FEEDBACK,
      result_type: 'answer',
      value: state.unselected ? 'unselected' : state.value,
    });
  }

  _destroy() {
    for (const unsubscribe of this._unsubscribes) {
      unsubscribe();
    }
    this._unsubscribes = [];
  }

}
