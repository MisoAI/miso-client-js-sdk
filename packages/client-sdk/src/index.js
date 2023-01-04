import MisoClient from '@miso.ai/client-sdk-core';
import { UserPlugin, PageInfoPlugin, AutoEventsPlugin } from '@miso.ai/client-sdk-core/dist/es/plugin';
import { DebugPlugin, DryRunPlugin } from '@miso.ai/client-sdk-dev-tool';

MisoClient.plugins.register(DebugPlugin, DryRunPlugin);
MisoClient.plugins.use(UserPlugin);
MisoClient.plugins.use(PageInfoPlugin);
MisoClient.plugins.use(AutoEventsPlugin);

export default MisoClient;
