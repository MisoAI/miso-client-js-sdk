import { AnalyticsPlugin } from '@miso.ai/client-sdk-core';
import MisoClient from './lite.js';
import { UiPlugin } from '@miso.ai/client-sdk-ui';

MisoClient.plugins.use(UiPlugin);
MisoClient.plugins.use(AnalyticsPlugin);

export default MisoClient;
