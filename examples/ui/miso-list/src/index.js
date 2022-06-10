import MisoClient from '@miso.ai/client-sdk';
import { UiPlugin } from '@miso.ai/client-sdk-ui';
import apiKey from './key';

MisoClient.plugins.use(UiPlugin);

const client = new MisoClient(apiKey);
