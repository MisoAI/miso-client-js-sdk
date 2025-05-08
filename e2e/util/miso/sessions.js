export default class Sessions {

  constructor(workflow) {
    this._miso = workflow._miso;
    this._workflow = workflow;
    this._sessions = [];
    this._current = undefined;
  }

  get current() {
    return this._current;
  }

  add(session) {
    this._sessions.push(this._current = new Session(session));
  }

  get(uuid) {
    for (const session of this._sessions) {
      if (session.uuid === uuid) {
        return session;
      }
    }
    return undefined;
  }

  [Symbol.iterator]() {
    return this._sessions[Symbol.iterator]();
  }

  _handleEvent(name, event) {
    if (name === 'session') {
      // TODO: make sure not redundant
      this._sessions.push(this._current = new Session(event));
      return true;
    }
    const session = event.session ? this.get(event.session.uuid) : this._current;
    if (!session) {
      // TODO: it's legit for silent event without session (to set default values)
      if (this._miso._options.verifyEvents) {
        throw new Error(event.session ?
          `Session "${event.session.uuid}" is not found in event "${name}" ${JSON.stringify(event)}` :
          `No current session when event "${name}" occurs: ${JSON.stringify(event)}`
        );
      }
      return false;
    }
    return session._handleEvent(name, event);
  }

}

class Session {

  constructor(data) {
    Object.assign(this, data);
    this._lifecycle = {};
  }

  get lifecycle() {
    return Object.freeze({ ...this._lifecycle });
  }

  // states
  // interactions

  _handleEvent(name, event) {
    // TODO
    return true;
  }

  _handleUnknownEvent(name, event) {
    // TODO: only when verbose
    console.log(`Unknown event "${name}" (session)`, event);
    return true;
  }

}
