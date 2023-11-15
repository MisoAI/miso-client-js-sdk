const DEFAULT_API_KEY = btoa(atob('u4Qhcz3WeixHNAkq40LULp5005W8rvsxhNdlJ0R4').split('').reverse().join(''));
const { api_key: apiKey = DEFAULT_API_KEY, api_host: apiHost, debug } = Object.fromEntries(new URLSearchParams(window.location.search).entries());

document.body.classList.add('propublica');

(window.misocmd || (window.misocmd = [])).push(async () => {

  const MisoClient = window.MisoClient;

  if (debug) {
    window.debug(MisoClient);
  }

  const options = { apiKey };
  if (apiKey.toLowerCase() === 'lorem') {
    options.lorem = true;
    delete options.apiKey;
  }
  if (apiHost) {
    options.apiHost = `https://${envParams.api_host}/v1`;
  }

  MisoClient.ui.combo.ask.config(options);

  displayVersionInfo(MisoClient);
});

function displayVersionInfo(MisoClient) {
  let version = MisoClient.version;
  const versionInfo = document.getElementById('sdk-version');
  if (versionInfo) {
    if (version !== 'dev') {
      version = `v${version}`;
    }
    versionInfo.innerHTML = `SDK ${version}`;
  }
}
