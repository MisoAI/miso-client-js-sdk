import MisoClient from '.';
import { UiPlugin } from '@miso.ai/client-sdk-ui';

MisoClient.plugins.use(UiPlugin);

export default MisoClient;
