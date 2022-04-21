import MisoClient from '@miso.ai/client-sdk-core';
import DebugPlugin from './plugin/debug';
import DryRunPlugin from './plugin/dry-run';

MisoClient.plugins.register(DebugPlugin, DryRunPlugin);

export default MisoClient;
