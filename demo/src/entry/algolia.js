import MisoClient from '@miso.ai/client-sdk';
import { AlgoliaPlugin } from '@miso.ai/client-sdk-algolia';
import { DemoPlugin } from '../plugin';

MisoClient.plugins.use(DemoPlugin);
MisoClient.plugins.use(AlgoliaPlugin);
