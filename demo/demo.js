// demo site functions //
(function() {

  var COOKIE_NAME = 'miso_client_js_sdk_demo_dojo_env';

  var demo = window.demo = {};
  demo.goEnv = function(env) {
    document.cookie = COOKIE_NAME + '=' + env;
    window.location.reload();
  };
  demo.env = (function() {
    try {
      return _env = document.cookie
        .split('; ')
        .find(row => row.startsWith(COOKIE_NAME + '='))
        .split('=')[1];
    } catch(e) {
      return 'mock';
    }
  })();

  var envs = {
    mock: 'Mock',
    dev: 'Development',
    play: 'Playground'
  };

  function renderProduct(product) {
    return `<div class="product"><h6>${product.title}</h6><div><img height="200" src="${product.cover_image}"></div><h5>$${product.sale_price}</h5></div>`;
  }

  demo.renderProducts = function(data) {
    var container = document.querySelector('#products');
    document.querySelector('#products').innerHTML = data.products.reduce(function(acc, product) {
      return acc + renderProduct(product);
    }, '');
    for (var product of data.products) {
      console.log(product);
    }
  };

  window.addEventListener('DOMContentLoaded', function(event) {
    document.body.classList.add(demo.env);
    document.querySelector('#navbarDarkDropdownMenuLink').innerHTML = envs[demo.env];
  });

})();

// miso integration //
(function() {

  var demo = window.demo;
  var config = {
    mock: true,
    api_key: 'miso-client-sdk-demo-api-key',
    anonymous_id: 'miso-client-sdk-demo-anonymous',
    user_id: 'miso-client-sdk-demo-user',
    user_hash: 'miso-client-sdk-demo-user-hash',
  };

  var miso = window.miso || (window.miso = []);
  miso.push(function () {
    miso.config(config);

    miso.api.interactionsUpload({type: 'home_page_view'})
      .then(console.log.bind(console))
      .catch(console.error.bind(console));
    
    miso.api.recommendationUserToProducts({fl: ['*']})
      .then(demo.renderProducts)
      .catch(console.error.bind(console));
  });

})();
