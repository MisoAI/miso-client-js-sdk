import MisoClient from '.';
import { UiPlugin } from '@miso.ai/client-sdk-ui';

// Turn on directly, so users don't need to put down a script tag to do so.
MisoClient.plugins.use(UiPlugin);

export default MisoClient;
