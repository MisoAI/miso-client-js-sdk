import MisoClient from '@miso.ai/client-sdk-core';
import { UserPlugin, PageInfoPlugin } from '@miso.ai/client-sdk-core/dist/es/plugin';
import { DebugPlugin, DryRunPlugin } from '@miso.ai/client-sdk-dev-tool';

MisoClient.plugins.register(DebugPlugin, DryRunPlugin);
MisoClient.plugins.use(UserPlugin);
MisoClient.plugins.use(PageInfoPlugin);

export default MisoClient;
