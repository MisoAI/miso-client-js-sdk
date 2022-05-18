import MisoClient from '.';
import { AlgoliaPlugin } from '@miso.ai/client-sdk-algolia';

MisoClient.plugins.use(AlgoliaPlugin);

export default MisoClient;
