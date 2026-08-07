import { isInBrowser } from '@miso.ai/commons';
import { lorem } from '@miso.ai/lorem';
import buildApi from '@miso.ai/doggoganger/src/api.js';
import fetch from '@miso.ai/doggoganger/src/fetch.js';
import { delay, rollLatency } from '@miso.ai/doggoganger/src/utils.js';

const PLUGIN_ID = 'std:lorem';

export default class LoremPlugin {

  static get id() {
    return PLUGIN_ID;
  }

  constructor() {
    this._lorem = lorem();
    this._api = buildApi();
  }

  /**
   * `latency` adds a mock request latency to every api call, in the manner
   * of the doggoganger server's latency middleware: a number of milliseconds
   * (e.g. 500), or `{ min, max }` for a randomized roll.
   */
  config({ seed, latency, ...options } = {}) {
    this._lorem = lorem({ seed });
    this._latency = latency;
    this._api = buildApi(options);
  }

  get api() {
    return this._api;
  }

  install(MisoClient, { setCustomFetch, setCustomSendBeacon }) {
    this._bypassApiKeyCheck(MisoClient);
    MisoClient.lorem = new Lorem(this);
    setCustomFetch(this._fetch.bind(this));
    setCustomSendBeacon(this._sendBeacon.bind(this));
    if (isInBrowser) {
      interceptDummyLinkClick();
    }
  }

  _bypassApiKeyCheck(MisoClient) {
    const _normalizeOptions = MisoClient.prototype._normalizeOptions;
    MisoClient.prototype._normalizeOptions = function(options) {
      if (typeof options === 'string') {
        options = {};
      }
      return _normalizeOptions.call(this, { ...options, apiKey: 'lorem' });
    };
  }

  async _fetch(url, options) {
    // the seed is captured before the delay, so the generated content stays
    // tied to the request order, not the completion order
    const seed = this._lorem.prng.seed();
    const latency = this._latency;
    if (latency) {
      await delay(typeof latency === 'number' ? latency : rollLatency(latency.min || 0, latency.max || 0));
    }
    return fetch(this._api, url, { seed, ...options });
  }

  _sendBeacon(/*url, data*/) {
    return true;
  }

}

class Lorem {

  constructor(plugin) {
    this._plugin = plugin;
  }

  get api() {
    return this._plugin.api;
  }

}

/**
 * [browser only]
 */
function interceptDummyLinkClick() {
  document.addEventListener('click', (e) => {
    if (e.isDefaultPrevented) {
      return;
    }
    const a = e.target.closest('a');
    if (!a) {
      return;
    }
    try {
      const url = new URL(a.href);
      if (url.host !== 'dummy.miso.ai') {
        return;
      }
    } catch (err) {
      return;
    }
    e.preventDefault();
    window.alert(`[Click] ${a.href}`);
  });
}
