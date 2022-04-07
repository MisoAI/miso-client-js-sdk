import { Component, delegateGetters } from '@miso.ai/commons';
import ModelRegistry from './model/registry';
import ElementRegistry from './element/registry';
import { PLUGIN_ID } from './constants';

class UiPluginRoot extends Component {

  constructor() {
    super(PLUGIN_ID);
    this._events._replays.add('client');
    this.models = new ModelRegistry(this);
    this.elements = new ElementRegistry(this);
    this.ui = new Ui(this);
  }

  config(options) {
    // TODO: diable client autobind
    // TODO: diable autoload
  }

  install(MisoClient, context) {
    context.addSubtree(this);
    // bind the first seen client
    (async() => {
      const { data: client } = await MisoClient.once('create');
      this._handleClient(client);
    })();

    // inject inferface on MisoClient
    delegateGetters(MisoClient, this, ['ui']);

    this.elements.install();
  }

  _handleClient(client) {
    this._events.emit('client', client);
  }

}

class Ui {

  constructor(root) {
  }

}

let _instance;

export default function get() {
  return _instance || (_instance = new UiPluginRoot());
}
