/**
 * Observer for GA4-style user engagement detection.
 * 
 * User is considered "engaged" when:
 * - The document is visible (page is the active tab)
 * - The window has focus
 * 
 * The callback is invoked whenever the engagement status toggles.
 */
export default class UserEngagementObserver {

  constructor(callback) {
    this._callback = callback;
    this._engaged = false;
    this._disconnected = false;

    // Bind event handlers
    this._handleVisibilityChange = this._handleVisibilityChange.bind(this);
    this._handleFocus = this._handleFocus.bind(this);
    this._handleBlur = this._handleBlur.bind(this);

    // Set up event listeners
    document.addEventListener('visibilitychange', this._handleVisibilityChange);
    window.addEventListener('focus', this._handleFocus);
    window.addEventListener('blur', this._handleBlur);

    // Compute initial state and trigger callback if engaged
    this._update();
  }

  /**
   * Whether the user is currently engaged.
   */
  get engaged() {
    return this._engaged;
  }

  /**
   * Disconnect the observer and clean up event listeners.
   */
  disconnect() {
    if (this._disconnected) {
      return;
    }
    this._disconnected = true;
    document.removeEventListener('visibilitychange', this._handleVisibilityChange);
    window.removeEventListener('focus', this._handleFocus);
    window.removeEventListener('blur', this._handleBlur);
  }

  _handleVisibilityChange() {
    this._update();
  }

  _handleFocus() {
    this._update();
  }

  _handleBlur() {
    this._update();
  }

  _update() {
    if (this._disconnected) {
      return;
    }
    const engaged = this._computeEngaged();
    if (engaged !== this._engaged) {
      this._engaged = engaged;
      this._callback(engaged);
    }
  }

  _computeEngaged() {
    // User is engaged when document is visible AND window has focus
    return document.visibilityState === 'visible' && document.hasFocus();
  }

}
