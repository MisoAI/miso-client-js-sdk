import { uuidv4 } from '@miso.ai/commons';
import * as fields from './fields.js';

export default class SessionMaker {

  constructor(hub) {
    this._hub = hub;
    this._sessionIndex = 0;
  }

  restart() {
    const session = Object.freeze({
      uuid: uuidv4(),
      index: this._sessionIndex++,
      meta: {},
    });
    this._hub.update(fields.session(), session);
  }

}
