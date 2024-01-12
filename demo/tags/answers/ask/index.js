const DEFAULT_API_KEY = btoa(atob('u4Qhcz3WeixHNAkq40LULp5005W8rvsxhNdlJ0R4').split('').reverse().join(''));
let {
  api_key: apiKey = DEFAULT_API_KEY,
  api_host: apiHost,
  user_id,
  user_hash,
  fq,
  yearly_decay: yearlyDecay,
  debug
} = Object.fromEntries(new URLSearchParams(window.location.search).entries());

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
    options.apiHost = `https://${apiHost}/v1`;
  }
  yearlyDecay = asYearlyDecayValue(yearlyDecay);
  if (fq || yearlyDecay !== undefined || user_id || user_hash) {
    const api = options.api = {};
    if (fq) {
      api.fq = fq;
    }
    if (yearlyDecay) {
      api.yearly_decay = yearlyDecay;
    }
    if (user_id) {
      api.user_id = user_id;
      api.anonymous_id = undefined;
    }
    if (user_hash) {
      api.user_hash = user_hash;
      api.anonymous_id = undefined;
    }
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

function asYearlyDecayValue(str) {
  const value = str && Number(str.trim());
  return !isNaN(value) && value >= 0 && value <= 1 ? value : undefined;
}
