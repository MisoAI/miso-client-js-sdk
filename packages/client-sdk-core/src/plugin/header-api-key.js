const PLUGIN_ID = 'std:header-api-key';

export default class HeaderApiKeyPlugin {

  static get id() {
    return PLUGIN_ID;
  }

  install(MisoClient, context) {
    context.addUrlPass(this._modifyUrl.bind(this));
    context.addHeadersPass(this._modifyHeaders.bind(this));
    MisoClient.debug(`<plugin:${PLUGIN_ID}>`, '[info]', `Send API key in header`);
  }

  _modifyUrl({ url }) {
    // remove api_key from url
    return url.replace(/[?&]api_key=[^&]*/g, '');
  }

  _modifyHeaders({ client, headers }) {
    const { apiKey } = client.options;
    return apiKey ? { ...headers, 'X-API-KEY': apiKey } : headers;
  }

}
