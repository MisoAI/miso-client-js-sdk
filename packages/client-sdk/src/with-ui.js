import MisoClient from '.';
import { UiPlugin } from '@miso.ai/ui-elements';

// Turn on directly, so users don't need to put down a script tag to do so.
MisoClient.plugins.use(UiPlugin);

export default MisoClient;
