import { init as rootInit } from './root';
import MisoClient from './client';
import DebugPlugin from './plugin/debug';
import DryRunPlugin from './plugin/dry-run';
import { UiPlugin } from '@miso.ai/ui-elements';

export default function init() {
  rootInit(MisoClient);

  MisoClient.plugins.register(DebugPlugin, DryRunPlugin, UiPlugin);

  return MisoClient;
};
