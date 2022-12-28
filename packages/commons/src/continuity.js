export default class ContinuityObserver {

  constructor(callback, {
    duration = 0,
    onDuration,
    offDuration,
    state,
  } = {}) {
    if (typeof callback !== 'function') {
      throw new Error(`Callback must be a function: ${callback}`);
    }
    validateDuration(onDuration);
    validateDuration(offDuration);
    validateDuration(duration);

    this._callback = callback;
    Object.defineProperty(this, 'durations', {
      value: Object.freeze({
        on: onDuration !== undefined ? onDuration : duration,
        off: offDuration !== undefined ? offDuration : duration,
      }),
    });
      this._value = this._state = !!state;
    this._active = true;
  }

  get active() {
    return this._active;
  }

  get state() {
    return this._state;
  }

  get value() {
    return this._value;
  }

  set value(value) {
    value = !!value;
    if (this._value === value) {
      return;
    }

    // clear timeout for the opposite direction
    _clearTimeout(this);

    const duration = this.durations[value ? 'on' : 'off'];
    if (duration) {
      // countdown to switch state if positive duration
      this._timeout = setTimeout(() => _setState(this, value), duration);
    } else {
      // otherwise, switch state immediately
      _setState(this, value);
    }
    this._value = value;
  }

  disconnect() {
    this._active = false;
  }

}

function _clearTimeout(observer) {
  if (!observer._timeout) {
    return;
  }
  clearTimeout(observer._timeout);
  observer._timeout = undefined;
}

function _setState(observer, state) {
  if (observer._state === state) {
    return; // just in case
  }
  observer._state = state;
  if (observer._active) {
    observer._callback(state);
  }
}

function validateDuration(propName, value) {
  if (value !== undefined && (isNaN(value) || value < 0)) {
    throw new Error(`${propName} must be a non-negative number: ${value}`);
  }
}
