// utilities //
(function () {
  window.onready = function (fn) {
    document.readyState !== 'loading' ? fn() : window.addEventListener('DOMContentLoaded', fn);
  };

  var templates = {};
  window.template = {
    render: function (name, data) {
      data = data || {};
      var template = templates[name] || (templates[name] = document.querySelector(`template[data-name="${name}"]`));
      return template.innerHTML.replace(/{{([\w.]+)}}/g, function (_, variable) {
        return data[variable] !== undefined ? data[variable] : '';
      });
    }
  };
})();



// demo app //
(function () {

  var COOKIE_NAME = 'miso_client_js_sdk_demo_dojo_env';

  const env = (() => {
    try {
      return _env = document.cookie
        .split('; ')
        .find(row => row.startsWith(COOKIE_NAME + '='))
        .split('=')[1];
    } catch (e) {
      return 'mock';
    }
  })();

  const envs = {
    mock: 'Mock',
    dev: 'Development',
    play: 'Playground'
  };

  class EventEmitter {
    constructor() {
      this._handlers = {};
    }
    _emit(name) {
      for (const handler of (this._handlers[name] || [])) {
        try {
          handler.apply(this, Array.prototype.slice.call(arguments, 1));
        } catch (e) {
          console.error(e);
        }
      }
    }
    on(name, handler) {
      return (this._handlers[name] || (this._handlers[name] = [])).push(handler), this;
    }
  }

  class Demo extends EventEmitter {
    constructor() {
      super();
      this.search = new Search(this);
      this.recommendation = new Recommendation(this);
      Object.defineProperties(this, {
        env: { value: env },
        envs: { value: envs }
      });
    }
    init() {
      this.search.init();
      this.recommendation.init();
      document.body.classList.add(this.env);
      document.querySelector('#navbarDarkDropdownMenuLink').innerHTML = this.envs[this.env];
    }
    set version(value) {
      var versionPrefix = ` (${value})`;
      document.title += versionPrefix;
      window.onready(() => {
        document.querySelector('#version').innerHTML = versionPrefix;
      });
    }
    reload(env) {
      document.cookie = COOKIE_NAME + '=' + env;
      window.location.reload();
    }
  }

  class Search extends EventEmitter {
    constructor(demo) {
      super();
      this._demo = demo;
    }
    init() {
      const input = document.querySelector('#search-control [data-ref="input"]');
      const submit = document.querySelector('#search-control [data-ref="submit"]');
      this.elements = {
        input: input,
        submit: submit,
        results: document.querySelector('#search-results')
      };
      const handleSubmit = this._handleSubmit.bind(this);
      input.addEventListener('keyup', (event) => (event.key === 'Enter') && handleSubmit(event));
      submit.addEventListener('click', handleSubmit);
    }
    _handleSubmit(event) {
      if (event.defaultPrevented) {
        return;
      }
      const value = this.elements.input.value.trim();
      value && this._emit('submit', value);
    }
    render(response) {
      this.elements.results.innerHTML = response.products.slice(0, 3)
        .reduce((acc, product) => acc + window.template.render('product', product), '');
    }
  }

  class Recommendation extends EventEmitter {
    constructor(demo) {
      super();
      this._demo = demo;
    }
    init() {
      this.elements = {
        results: document.querySelector('#recommendation-results')
      };
    }
    render(response) {
      this.elements.results.innerHTML = response.products.slice(0, 3)
        .reduce((acc, product) => acc + window.template.render('product', product), '');
    }

  }

  var demo = window.demo = new Demo();

  window.onready(demo.init.bind(demo));

})();



// miso integration //
(function () {

  var searchParams = new URLSearchParams(window.location.search);
  var apiKey = searchParams.get('api_key');
  var useMockService = !apiKey;

  var config = {
    apiKey: useMockService ? 'miso-client-sdk-demo-api-key' : apiKey
  };
  if (useMockService) {
    config.env = 'mock';
  }
  var user = {
    anonymousId: crypto.randomUUID()
  };
  if (!useMockService) {
    user.userId = 'TacoFranz';
    user.userHash = 'c657b6de0d2b99cf6b65ef0ea04711b353f7b8ea1f3c39f6cece40509527a29a';
  }

  var demo = window.demo;

  var misocmd = window.misocmd || (window.misocmd = []);
  misocmd.push(function () {

    var miso = window.createMiso(config);
    miso.context.setAnonymousId(user.anonymousId);
    miso.context.setUserId(user.userId, user.userHash);

    demo.version = miso.version;

    // recommendation //
    miso.api.recommendation.userToProducts({ fl: ['*'] })
      .then((response) => demo.recommendation.render(response))
      .catch(console.error.bind(console));

    // search //
    demo.search.on('submit', (value) => {
      miso.api.search.search({ q: value, fl: ['*'] })
        .then((response) => demo.search.render(response))
        .catch(console.error.bind(console));
    });

    // interactions //
    miso.api.interactions.upload({ type: 'home_page_view' })
      .then(console.log.bind(console))
      .catch(console.error.bind(console));

  });

})();
