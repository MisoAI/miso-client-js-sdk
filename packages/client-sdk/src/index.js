import MisoClient from '@miso.ai/client-sdk-core';
import { UserPlugin, PageInfoPlugin, AutoEventsPlugin } from '@miso.ai/client-sdk-core/dist/es/plugin';
import { DebugPlugin, DryRunPlugin } from '@miso.ai/client-sdk-dev-tool';
import { UiPlugin } from '@miso.ai/client-sdk-ui';

MisoClient.plugins.register(DebugPlugin, DryRunPlugin, UiPlugin);
MisoClient.plugins.use(UserPlugin);
MisoClient.plugins.use(PageInfoPlugin);
MisoClient.plugins.use(AutoEventsPlugin);

export default MisoClient;
