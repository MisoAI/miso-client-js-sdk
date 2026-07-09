import { AnalyticsPlugin } from '@miso.ai/client-sdk-core';
import MisoClient from './lite.js';
import { WorkflowPlugin } from '@miso.ai/client-sdk-workflow';
import { UiPlugin } from '@miso.ai/client-sdk-ui';

MisoClient.plugins.use(WorkflowPlugin);
MisoClient.plugins.use(UiPlugin);
MisoClient.plugins.use(AnalyticsPlugin);

export default MisoClient;
