import MisoClient from '@miso.ai/client-sdk';
import { UiPlugin } from '@miso.ai/client-sdk-ui';
import apiKey from './key';

MisoClient.plugins.use(UiPlugin);

new MisoClient(apiKey);

function createModel() {
  return new MisoClient.ui.models.classes.MisoListModel({
    api: 'custom',
    fetch: async ({ client }) => {
      const [ searchResponse, recommendationResponse ] = await Promise.all([
        client.api.search.search({ q: 'shiba', fl: ['*'], rows: 4 }, { bulk: true }),
        client.api.recommendation.userToProducts({ fl: ['*'], rows: 4 }, { bulk: true }),
      ]);
      return {
        ...recommendationResponse,
        products: [
          ...searchResponse.products,
          ...recommendationResponse.products,
        ],
      };
    }
  });
}

(async () => {
  await customElements.whenDefined('miso-list');
  document.querySelector('miso-list').model = createModel();
})();
