import MisoClient from '@miso.ai/client-sdk-core';
import DebugPlugin from './plugin/debug';
import DryRunPlugin from './plugin/dry-run';
import { UiPlugin } from '@miso.ai/ui-elements';

MisoClient.plugins.register(DebugPlugin, DryRunPlugin, UiPlugin);

export default MisoClient;
