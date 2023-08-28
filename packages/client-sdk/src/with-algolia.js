import MisoClient from './index.js';
import { AlgoliaPlugin } from '@miso.ai/client-sdk-algolia';

MisoClient.plugins.use(AlgoliaPlugin);

export default MisoClient;
