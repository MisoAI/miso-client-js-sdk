import MisoClient from '@miso.ai/client-sdk';
import { UiPlugin } from '@miso.ai/client-sdk-ui';
import { DemoPlugin } from '../plugin';

MisoClient.plugins.use(DemoPlugin);
MisoClient.plugins.use(UiPlugin);
