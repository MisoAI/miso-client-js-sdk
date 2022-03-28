import { defineValues } from '@miso.ai/commons/dist/es/objects';
import Api from '../api';
import ApiBase from '../api/base';
import ApiHelpers from '../api/helpers';
import Interactions from '../api/interactions';
import Recommendation from '../api/recommendation';
import Search from '../api/search';
import Context from '../context';
import { DebugPlugin } from './debug';
import { DryRunPlugin } from './dry-run';

const classes = Object.freeze({
  api: Object.freeze({ Api, ApiBase, ApiHelpers, Interactions, Recommendation, Search }),
  context: Object.freeze({ Context }),
  plugin: Object.freeze({ DebugPlugin, DryRunPlugin }),
});

class PluginContext {

  constructor() {
    defineValues(this, { classes });
    this.installed = [];
  }

  contains(plugin) {
    const id = plugin.id;
    return id && this.installed.some((p) => p.id === id);
  }

}

export default Object.freeze(new PluginContext());
