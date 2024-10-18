const PLUGIN_ID = 'std:native-fetch';

function isNativeFunction(fn) {
  return fn.toString().indexOf("[native code]") > -1;
}

let _fetchSource;
let _fetchError;

const fetchFn = (() => {
  if (isNativeFunction(window.fetch)) {
    _fetchSource = 'original';
    return window.fetch;
  }
  try {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.head.appendChild(iframe); // in case body is not available yet
    // don't remove the iframe to keep the fetch function alive
    _fetchSource = 'borrowed';
    return iframe.contentWindow.fetch;
  } catch (e) {
    _fetchError = e;
  }
  return undefined;
})();

export default class NativeFetchPlugin {

  static get id() {
    return PLUGIN_ID;
  }

  install(MisoClient, context) {
    if (!fetchFn) {
      MisoClient.debug(`<plugin:${PLUGIN_ID}>`, '[error]', `Failed to obtain native fetch: ${_fetchError.message}`);
      return;
    }
    context.setCustomFetch(fetchFn);
    MisoClient.debug(`<plugin:${PLUGIN_ID}>`, '[info]', `Using ${_fetchSource} native fetch`);
  }

}
