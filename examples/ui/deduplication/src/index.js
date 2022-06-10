import MisoClient from '@miso.ai/client-sdk';
import { UiPlugin } from '@miso.ai/client-sdk-ui';
import apiKey from './key';

MisoClient.plugins.use(UiPlugin);

new MisoClient(apiKey);

const elements = document.querySelectorAll('miso-list');
const elementCount = elements.length;

const shownProductIds = new Set();

function transformData({ items, ...data }) {
  items = items.filter(item => !shownProductIds.has(item.product_id)).slice(0, 4);
  for (const item of items) {
    shownProductIds.add(item.product_id);
  }
  return { ...data, items };
}

function createModel() {
  return new MisoClient.ui.models.classes.MisoListModel({
    api: 'user_to_products',
    payload: {
      fl: ['*'],
      rows: 4 * elementCount
    },
    transform: transformData
  });
}

(async () => {
  await customElements.whenDefined('miso-list');
  for (const element of elements) {
    element.model = createModel();
  }
})();
