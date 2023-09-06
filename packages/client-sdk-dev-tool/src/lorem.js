import buildApi from '@miso.ai/doggoganger/src/api.js';
import fetch from '@miso.ai/doggoganger/src/fetch.js';

const PLUGIN_ID = 'std:lorem';

export default class LoremPlugin {

  static get id() {
    return PLUGIN_ID;
  }

  constructor() {
    this._api = buildApi();
  }

  config(options = {}) {
    this._api = buildApi(options);
  }

  get api() {
    return this._api;
  }

  install(MisoClient, { setCustomFetch }) {
    MisoClient.lorem = new Lorem(this);
    setCustomFetch(this._fetch.bind(this));
    interceptDummyLinkClick();
  }

  _fetch(url, options) {
    return fetch(this._api, url, options);
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
