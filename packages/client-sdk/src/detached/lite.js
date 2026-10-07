import { MisoClient, ContextPlugin, PageInfoPlugin, AutoEventsPlugin, InteractionsPlugin, NativeFetchPlugin, HeaderApiKeyPlugin, ApiPatchPlugin, ApiRecoveryPlugin } from '@miso.ai/client-sdk-core';
import { DebugPlugin, DryRunPlugin } from '@miso.ai/client-sdk-dev-tool';

MisoClient.plugins.register(DebugPlugin, DryRunPlugin, NativeFetchPlugin, HeaderApiKeyPlugin);

MisoClient.plugins.use(ContextPlugin);
MisoClient.plugins.use(PageInfoPlugin);
MisoClient.plugins.use(AutoEventsPlugin);
MisoClient.plugins.use(InteractionsPlugin);
MisoClient.plugins.use(ApiRecoveryPlugin);

// this needs to come in last
MisoClient.plugins.use(ApiPatchPlugin);

export default MisoClient;
