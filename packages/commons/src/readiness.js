export function mixinReadinessInstance(target) {
  Object.assign(target, {
    _readiness: 'pending',
    _whenReady: new Promise((resolve, reject) => {
      target._resolveReady = resolve;
      target._rejectReady = reject;
    })
  });
}

export function mixinReadinessPrototype(prototype) {
  Object.assign(prototype, {
    get ready() {
      return this._readiness == 'successful';
    },
    get readiness() {
      return this._readiness;
    },
    whenReady() {
      return this._whenReady;
    },
    _setReady(value) {
      if (this._readiness !== 'pending') {
        return;
      }
      this._readiness = 'successful';
      this._resolveReady(value);
    },
    _failReady(e) {
      if (this._readiness !== 'pending') {
        return;
      }
      this._readiness = 'failed';
      this._rejectReady(e);
    }
  });
}
