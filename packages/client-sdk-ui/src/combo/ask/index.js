import { defineValues, waitForDomContentLoaded } from '@miso.ai/commons';
import Combo from '../base.js';
import { AskComboOptions, mergeOptions } from './options.js';
import AskComboElements from './elements.js';

export default class AskCombo extends Combo {

  constructor(plugin, MisoClient) {
    super({
      name: 'ask-combo',
      plugin,
      MisoClient,
    });
    // TODO: extract options to super class
    this._options = new AskComboOptions();
    this._localOptions = {};
  }

  config(options = {}) {
    options = mergeOptions(this._localOptions, options);
    const resolvedOptions = this._options.resolve(options);

    // verify
    // TODO

    this._localOptions = options;
    this._resolvedOptions = resolvedOptions;
    return this;
  }

  get resolvedOptions() {
    return this._resolvedOptions || (this._resolvedOptions = this._options.resolve(this._localOptions));
  }

  get client() {
    return this._client;
  }

  get elements() {
    return this._elements;
  }

  autoStart() {
    this.resolvedOptions.autostart && this.start();
  }

  async _start() {
    await waitForDomContentLoaded();
    await this.waitForElement();

    // setup MisoClient
    await this._setupMisoClient();
    
    // render elements for root question
    this._renderRootContent();

    // create client instance
    this._createClientInstance();

    // setup workflows
    this._setupWorkflows();
  }

  async _setupMisoClient() {
    const { MisoClient, resolvedOptions: options } = this;
    const { version } = MisoClient;

    defineValues(MisoClient, {
      name: 'miso-ask-combo',
    });

    // debug
    const debug = version === 'dev' || version.indexOf('beta') > 0 || options.debug;
    if (debug) {
      MisoClient.plugins.use('std:debug');
    }

    // dry run
    if (options.dry_run) {
      MisoClient.plugins.use('std:dry-run');
    }

    // lorem
    if (options.lorem) {
      await MisoClient.plugins.install('std:lorem');
    }
  }

  _renderRootContent() {
    const { element, resolvedOptions: options } = this;
    const { templates = {} } = options;
    element.innerHTML = templates.root(options);
    this._elements = new AskComboElements(element, options);
  }

  async _createClientInstance() {
    this._client = new MisoClient(this.resolvedOptions);
  }

  async _setupWorkflows() {
    const { MisoClient, client, elements, resolvedOptions: options } = this;
    const { wireFollowUps, wireRelatedResources } = MisoClient.ui.defaults.ask;
    const { templates = {}, features = {}, api } = options;

    const context = client.ui.asks;
    const rootWorkflow = client.ui.ask;

    if (api) {
      context.useApi(api);
    }

    // TODO: set placeholder if present in options

    if (features.followUpQuestions !== false) {
      wireFollowUps(client, elements.followUpsSection, { ...options, template: templates.followUp });
    }
    if (features.relatedResources !== false && features.followUpQuestions !== false) {
      wireRelatedResources(client, elements.relatedResourcesSection);
    }

    // start query if specified in URL
    rootWorkflow.autoQuery();
  }

}
