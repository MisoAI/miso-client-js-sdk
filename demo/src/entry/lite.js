import MisoClient from '@miso.ai/client-sdk/lite.js';
import { LoremPlugin } from '@miso.ai/client-sdk-dev-tool';
import { DemoPlugin } from '../plugin';

MisoClient.plugins.use(DemoPlugin);
MisoClient.plugins.register(LoremPlugin);

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
