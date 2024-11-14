import { uuidv4, delegateGetters } from '@miso.ai/commons';
import * as fields from './fields.js';

export default class SessionMaker {

  constructor(hub) {
    this._hub = hub;
    this._sessionIndex = 0;
    delegateGetters(hub, this, ['active']);
  }

  get active() {
    const { session } = this._hub.states;
    return !!(session && session.active);
  }

  new({ force = false } = {}) {
    const currentSession = this._hub.states.session;
    if (currentSession && !currentSession.active && !force) {
      return;
    }
    const session = this._create();
    this._hub.update(fields.session(), session);
  }

  start() {
    const session = this._hub.states.session || this._create();
    if (session.active) {
      return;
    }
    this._hub.update(fields.session(), { ...session, active: true });
  }

  restart() {
    this._hub.update(fields.session(), this._create(true));
  }

  _create(active = false) {
    return Object.freeze({
      active,
      uuid: uuidv4(),
      index: this._sessionIndex++,
      meta: {},
    });
  }

}
