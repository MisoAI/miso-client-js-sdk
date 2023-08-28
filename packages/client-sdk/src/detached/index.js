import MisoClient from './lite.js';
import { UiPlugin } from '@miso.ai/client-sdk-ui';

MisoClient.plugins.register(UiPlugin);

export default MisoClient;
