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
    _emit(name, data) {
      for (const handler of (this._handlers[name] || [])) {
        try {
          handler(data);
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
      Object.defineProperties(this, {
        env: { value: env },
        envs: { value: envs }
      });
      this._ready = new Promise(resolve => {
        this._resolveReady = resolve;
      });
    }
    init() {
      document.body.classList.add(this.env);
      document.querySelector('#navbarDarkDropdownMenuLink').innerHTML = this.envs[this.env];
      this._init = true;
      this._resolveReady();
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
    whenReady() {
      return this._ready;
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
  var debug = searchParams.has('debug');

  var config = {
    apiKey: useMockService ? 'miso-client-sdk-demo-api-key' : apiKey
  };
  var user = {};
  if (useMockService) {
    config.apiHost = 'mock';
  } else {
    user.userId = 'TacoFranz';
    user.userHash = 'c657b6de0d2b99cf6b65ef0ea04711b353f7b8ea1f3c39f6cece40509527a29a';
  }

  var demo = window.demo;

  var misocmd = window.misocmd || (window.misocmd = []);
  misocmd.push(function () {

    debug && MisoClient.plugins.use('std:debug');
    MisoClient.plugins.use('std:ui');
    var miso = window.miso = new MisoClient(config);
    miso.context.user_id = user.userId;
    miso.context.user_hash = user.userHash;

    demo.version = miso.version;
  });

})();

(async function () {
  await customElements.whenDefined('miso-list');
  await window.demo.whenReady();

  const elements = document.querySelectorAll('miso-list.recommendation');
  const elementCount = elements.length;

  const usedProductIds = new Set();

  function transformData({ items, ...data }) {
    items = items.filter(item => !usedProductIds.has(item.product_id)).slice(0, 2);
    for (const item of items) {
      usedProductIds.add(item.product_id);
    }
    return { ...data, items };
  }

  function createModel() {
    return new MisoClient.ui.models.classes.MisoListModel({
      api: 'user_to_products',
      payload: {
        fl: ['*'],
        dedupe_product_group_id: true,
        rows: 2 * elementCount
      },
      transform: transformData
    });
  }

  for (const element of elements) {
    element.model = createModel();
  }
})();
