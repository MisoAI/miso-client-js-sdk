// [browser only]

/**
 * Observer for user activity detection.
 *
 * The callback is invoked when:
 * - A click event reaches the document
 * - A scroll event occurs on the body
 *
 * Options:
 * - throttle: minimum ms between callback invocations
 */
export default class UserActivityObserver {

  constructor(callback, { throttle } = {}) {
    this._callback = callback;
    this._throttle = throttle;
    this._lastCalledAt = 0;
    this._disconnected = false;

    // Bind event handlers
    this._handleClick = this._handleClick.bind(this);
    //this._handleScroll = this._handleScroll.bind(this);

    // Set up event listeners
    document.addEventListener('click', this._handleClick);
    //document.body.addEventListener('scroll', this._handleScroll);
  }

  /**
   * Disconnect the observer and clean up event listeners.
   */
  disconnect() {
    if (this._disconnected) {
      return;
    }
    this._disconnected = true;
    document.removeEventListener('click', this._handleClick);
    //document.body.removeEventListener('scroll', this._handleScroll);
  }

  _trigger(event) {
    if (this._disconnected) {
      return;
    }
    const now = Date.now();
    if (this._throttle !== undefined && now - this._lastCalledAt < this._throttle) {
      return;
    }
    this._lastCalledAt = now;
    this._callback(event);
  }

  _handleClick(domEvent) {
    this._trigger({ type: 'click', domEvent });
  }

  /*
  _handleScroll(domEvent) {
    this._trigger({ type: 'scroll', domEvent });
  }
  */

}
