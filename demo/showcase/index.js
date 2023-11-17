const DEFAULT_API_KEY = btoa(atob('u4Qhcz3WeixHNAkq40LULp5005W8rvsxhNdlJ0R4').split('').reverse().join(''));
const { api_key: apiKey = DEFAULT_API_KEY } = Object.fromEntries(new URLSearchParams(window.location.search).entries());

document.body.classList.add('propublica');

(window.misocmd || (window.misocmd = [])).push(async () => {

  const MisoClient = window.MisoClient;

  const options = { apiKey };
  if (apiKey.toLowerCase() === 'lorem') {
    options.lorem = true;
    delete options.apiKey;
  }

  MisoClient.ui.combo.ask.config(options);
});
