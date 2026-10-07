import { Resolution, delegateProperties } from '@miso.ai/commons';

const PLUGIN_ID = 'std:api-recovery';

// a safety net against a callback that resends unconditionally
const MAX_RESENT = 10;

/**
 * Lets the application intercept failed API requests, per client:
 *
 * ```js
 * client.api.onError = async (error, { request, hold, resend }) => { ... };
 * ```
 *
 * The request settles with the outcome of the callback: the error it throws,
 * the value it returns (taken as the API result), or — by returning
 * `resend()` — the outcome of sending the request again.
 *
 * A resent request that fails is intercepted like any other, with
 * `error.resent` telling how many times the request has been resent so far
 * (0 for the original failure), so the callback can give up at some count.
 * As a safety net, a request resent 10 times fails for good, its error
 * thrown without reaching the callback.
 *
 * `hold()` holds the requests issued from then on (resent ones included)
 * until the unhold function it returns is called. Requests already in flight
 * are not affected, so several errors may reach the callback before a hold
 * takes effect: managing them in one go (e.g. sharing a single token renewal)
 * is up to the application.
 */
export default class ApiRecoveryPlugin {

  static get id() {
    return PLUGIN_ID;
  }

  constructor() {
    this._recoveries = new WeakMap();
  }

  install(MisoClient, context) {
    context.addApiMiddleware(this._middleware.bind(this));
    MisoClient.on('create', this._injectClient.bind(this));
  }

  _injectClient(client) {
    const recovery = new ApiRecovery();
    this._recoveries.set(client, recovery);
    delegateProperties(client.api, recovery, ['onError']);
  }

  async _middleware({ client, ...request }, next) {
    const recovery = this._recoveries.get(client);
    return recovery ? recovery.run(request, next) : next();
  }

}

class ApiRecovery {

  constructor() {
    this._callback = undefined;
    this._holds = new Set();
    this._gate = undefined;
  }

  get onError() {
    return this._callback;
  }

  // a single callback: setting it replaces the current one, and setting it
  // to undefined removes it
  set onError(callback) {
    if (callback != undefined && typeof callback !== 'function') {
      throw new Error(`Expect onError to be a function: ${callback}`);
    }
    this._callback = callback || undefined;
  }

  async run(request, next, resent = 0) {
    try {
      return await this._send(next);
    } catch (error) {
      const callback = this._callback;
      if (!callback || resent >= MAX_RESENT) {
        throw error;
      }
      if (error && typeof error === 'object') {
        error.resent = resent;
      }
      return callback(error, Object.freeze({
        request,
        hold: () => this._hold(),
        resend: () => this.run(request, next, resent + 1),
      }));
    }
  }

  async _send(next) {
    // loop: a new hold may be placed by the time the gate opens
    while (this._gate) {
      await this._gate.promise;
    }
    return next();
  }

  _hold() {
    const hold = {};
    this._holds.add(hold);
    if (!this._gate) {
      this._gate = new Resolution();
    }
    // holds overlap: the gate opens when the last one is released
    return () => {
      if (!this._holds.delete(hold) || this._holds.size) {
        return;
      }
      const gate = this._gate;
      this._gate = undefined;
      gate.resolve();
    };
  }

}
