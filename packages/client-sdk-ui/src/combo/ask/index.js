import { defineValues } from '@miso.ai/commons';
import { fields } from '../../actor/index.js';
import { ROLE } from '../../constants.js';
import Combo from '../base.js';
import AskComboOptions from './options.js';
import AskComboElements from './elements.js';

export default class AskCombo extends Combo {

  constructor(plugin, MisoClient) {
    super({
      name: 'ask-combo',
      plugin,
      MisoClient,
    });
    this._options = new AskComboOptions();
    this._localOptions = {};
  }

  config(options = {}) {
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

  async _start() {
    // setup MisoClient
    await this._setupMisoClient();
    
    // render elements for root question
    this._renderRootContent();

    // create client instance
    await this._createClientInstance();

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
    this._elements = new AskComboElements(element);
  }

  async _createClientInstance() {
    const { MisoClient, resolvedOptions: options } = this;
    await MisoClient.cmdDone;
    this._client = new MisoClient(options);
  }

  async _setupWorkflows() {
    const { client, elements, resolvedOptions: options } = this;
    const { templates = {} } = options;

    const context = client.ui.asks;
    const rootWorkflow = client.ui.ask;

    // when a answer is fully populated, insert a new section for the follow-up question
    context.on('done', ({ workflow }) => {
      elements.followUpsSection.insertAdjacentHTML('beforeend', templates.followUp(options, { parentQuestionId: workflow.questionId }));
    });

    // when a new query starts, associate the last section container (for related resources) to that workflow
    context.on('loading', ({ workflow }) => {
      elements.relatedResourcesContainer.workflow = workflow;
    });

    // if user starts over, clean up current follow-up questions
    rootWorkflow.on('loading', () => {
      // clean up the entire follow-ups section
      elements.followUpsSection.innerHTML = '';
      // destroy all follow-up workflows
      context.reset({ root: false });
    });

    // wait for miso-query content to be populated
    const QUERY = fields.view(ROLE.QUERY);
    if (!rootWorkflow.states[QUERY]) {
      await rootWorkflow._hub.once(QUERY);
    }

    // start query if specified in URL
    const { q } = options;
    if (q) {
      elements.rootInput.value = q;
      rootWorkflow.query({ q });
    } else {
      elements.rootInput.focus();
    }
  }

}