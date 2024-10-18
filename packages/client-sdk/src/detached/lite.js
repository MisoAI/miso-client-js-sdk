import { MisoClient, UserPlugin, PageInfoPlugin, AutoEventsPlugin, InteractionsPlugin, NativeFetchPlugin } from '@miso.ai/client-sdk-core';
import { DebugPlugin, DryRunPlugin } from '@miso.ai/client-sdk-dev-tool';

MisoClient.plugins.register(DebugPlugin, DryRunPlugin, NativeFetchPlugin);
MisoClient.plugins.use(UserPlugin);
MisoClient.plugins.use(PageInfoPlugin);
MisoClient.plugins.use(AutoEventsPlugin);
MisoClient.plugins.use(InteractionsPlugin);

export default MisoClient;
