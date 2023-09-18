import MisoClient from '@miso.ai/client-sdk/detached/index.js';
import { LoremPlugin } from '@miso.ai/client-sdk-dev-tool';
import { DemoPlugin } from '../plugin';

MisoClient.plugins.use(DemoPlugin);
MisoClient.plugins.register(LoremPlugin);

(() => {
  const ids = {};
  function display(name, id, { value, err }, options) {
    if (id !== ids[name]) {
      return;
    }
    const container = document.querySelector(`screen[name="${name}"]`);
    if (container) {
      container.innerHTML = 
        (value === undefined ? '' : `<p class="stdout"><code>${renderOutput(value, options)}</code></p>`) + 
        (err === undefined ? '' : `<p class="stderr"><code>${renderError(err, options)}</code></p>`);
    }
  }
  function renderOutput(value, { raw = false } = {}) {
    return raw ? `${value}` : JSON.stringify(value, undefined, 2);
  }
  function renderError(err) {
    return err.message;
  }
  window.show = async (name, fn, options) => {
    ids[name] || (ids[name] = 0);
    const id = ++ids[name];
    try {
      const value = await fn();
      display(name, id, { value }, options);
    } catch (err) {
      display(name, id, { err }, options);
    }
  };
})();

window.renderProductCard = product => `
  <a class="product-card row-4" href="${ product.url }">
    <div>
      <div class="title">${ product.title }</div>
      <div class="image">
        <img src="${ product.cover_image }">
      </div>
      <div class="footer">$${ product.sale_price }</div>
    </div>
  </a>
`;

if (Array.isArray(window._misocmd)) {
  for (const fn of window._misocmd) {
    try {
      fn(MisoClient);
    } catch (err) {
      console.error(err);
    }
  }
}
window._misocmd = Object.freeze({
  push: fn => fn(MisoClient),
});
