import MisoClient from '@miso.ai/client-sdk';
import { AlgoliaPlugin } from '@miso.ai/client-sdk-algolia';
import { DemoPlugin } from '../plugin';

const { autocomplete, getAlgoliaFacets, getAlgoliaResults } = window['@algolia/autocomplete-js'];
Object.assign(window, { autocomplete, getAlgoliaFacets, getAlgoliaResults });

MisoClient.plugins.use(DemoPlugin);
MisoClient.plugins.use(AlgoliaPlugin);
