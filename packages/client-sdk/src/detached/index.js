import MisoClient from './lite';
import { UiPlugin } from '@miso.ai/client-sdk-ui';

MisoClient.plugins.register(UiPlugin);

export default MisoClient;
