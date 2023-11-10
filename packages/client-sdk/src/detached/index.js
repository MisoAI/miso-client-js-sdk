import MisoClient from './lite.js';
import { UiPlugin } from '@miso.ai/client-sdk-ui';

MisoClient.plugins.use(UiPlugin);

export default MisoClient;
