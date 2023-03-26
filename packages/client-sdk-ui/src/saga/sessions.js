import { uuidv4, delegateGetters } from '@miso.ai/commons';

export default class SessionMaker {

  constructor(saga) {
    this._saga = saga;
    this._sessionIndex = 0;
    delegateGetters(saga, this, ['active']);
  }

  get active() {
    const { session } = this._saga.states;
    return !!(session && session.active);
  }

  new({ force = false } = {}) {
    const currentSession = this._saga.states.session;
    if (currentSession && !currentSession.active && !force) {
      return;
    }
    const session = this._create();
    this._saga.update('session', session);
  }

  start() {
    const { session } = this._saga.states;
    if (session && session.active) {
      return;
    }
    this._saga.update('session', { ...session, active: true });
  }

  restart() {
    this.new({ force: true });
    this.start();
  }

  _create() {
    return Object.freeze({
      active: false,
      uuid: uuidv4(),
      index: this._sessionIndex++,
    });
  }

}
