import MisoClient from '@miso.ai/client-sdk';

// plugin //
function interceptLinks() {
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
    // TODO
    window.alert(`[Click] ${a.href}`);
  });
}

class SandboxPlugin {

  static get id() {
    return 'sandbox';
  }

  constructor() {
  }

  install(MisoClient, { addUrlPass, setCustomSendBeacon }) {
    addUrlPass(this._replaceUrl.bind(this));
    setCustomFetch(this._fetch.bind(this));
    setCustomSendBeacon(this._sendBeacon.bind(this));
    MisoClient.on('create', this._setupClient.bind(this));
    interceptLinks();
  }

  _replaceUrl({ apiGroup, apiName, url }) {
    // TODO
    return url;
  }

  _fetch(url, options) {
    // TODO
    return window.fetch(url, options);
  }

  _sendBeacon(url, data) {
    // omit all interactions except for feedback
    // TODO
    return true;
  }

  _setupClient(client) {
    const workflows = client.ui.asks;

    workflows.useApi({
      //fq: '...',
    });
    
    function processArticle({ url, cover_image, ...article }) {
      // TODO
      return {
        cover_image,
        url,
        ...article,
      };
    }

    workflows.useDataProcessor(({ value, ...data }) => {
      if (!value) {
        return data;
      }
      const { sources = [], related_resources = [] } = value;
      return {
        value: {
          ...value,
          sources: sources.map(processArticle),
          related_resources: related_resources.map(processArticle),
        },
        ...data,
      };
    });
    
  }

}

MisoClient.plugins.use(SandboxPlugin);
