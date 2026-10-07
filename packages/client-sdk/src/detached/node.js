import { MisoClient, ContextPlugin, AutoEventsPlugin, InteractionsPlugin, HeaderApiKeyPlugin, ApiPatchPlugin, ApiRecoveryPlugin } from '@miso.ai/client-sdk-core';
import { WorkflowPlugin } from '@miso.ai/client-sdk-workflow';
import { DebugPlugin, DryRunPlugin } from '@miso.ai/client-sdk-dev-tool';

MisoClient.plugins.register(DebugPlugin, DryRunPlugin, HeaderApiKeyPlugin);

MisoClient.plugins.use(ContextPlugin);
MisoClient.plugins.use(AutoEventsPlugin);
MisoClient.plugins.use(InteractionsPlugin);
MisoClient.plugins.use(ApiRecoveryPlugin);

// this needs to come in last
MisoClient.plugins.use(ApiPatchPlugin);

MisoClient.plugins.use(WorkflowPlugin);

export default MisoClient;
