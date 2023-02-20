import MisoClient from '@miso.ai/client-sdk';
import { DemoPlugin } from '../plugin';

MisoClient.plugins.use(DemoPlugin);

(() => {
  const ids = {};
  function display(name, id, { value, err }) {
    if (id !== ids[name]) {
      return;
    }
    const container = document.querySelector(`screen[name="${name}"]`);
    if (container) {
      container.innerHTML = 
        (value === undefined ? '' : `<p class="stdout"><code>${renderOutput(value)}</code></p>`) + 
        (err === undefined ? '' : `<p class="stderr"><code>${renderError(err)}</code></p>`);
    }
  }
  function renderOutput(value) {
    return JSON.stringify(value, undefined, 2);
  }
  function renderError(err) {
    return err.message;
  }
  window.show = async (name, fn) => {
    ids[name] || (ids[name] = 0);
    const id = ++ids[name];
    try {
      const value = await fn();
      display(name, id, { value });
    } catch (err) {
      display(name, id, { err });
    }
  };
})();

window.renderProductCard = product => `
  <div class="product-card row-4">
    <div>
      <div class="title">${ product.title }</div>
      <div class="image">
        <img src="${ product.cover_image }">
      </div>
      <div class="footer">$${ product.sale_price }</div>
    </div>
  </div>
`;
