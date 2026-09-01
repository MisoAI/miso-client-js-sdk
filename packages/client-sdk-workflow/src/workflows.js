import { defineValues } from '@miso.ai/commons';
import WorkflowEventBus from './bus.js';
import { ThreadsModel } from './actor/index.js';
import { Asks, HybridSearch, Explores, Search, Recommendations, History, Conversation, Messages } from './workflow/index.js';
import * as sources from './source.js';

/**
 * The per-client workflow interface, exposed as `client.workflows`. Lazily
 * creates and caches the workflow singletons (search, hybridSearch) and
 * workflow contexts (asks, explores, recommendations) of the client.
 */
export default class Workflows {

  constructor(plugin, client) {
    this._plugin = plugin;
    this._client = client;
    this._bus = new WorkflowEventBus();

    defineValues(this, {
      sources: {
        api: sources.api(client),
      },
    });
  }

  /**
   * The event bus shared by all workflow instances of this client.
   */
  get bus() {
    return this._bus;
  }

  get search() {
    if (!this._search) {
      this._search = new Search(this._plugin, this._client);
      this._client._events.emit('postworkflow', this._search);
    }
    return this._search;
  }

  get hybridSearch() {
    if (!this._hybridSearch) {
      this._hybridSearch = new HybridSearch(this._plugin, this._client);
      this._client._events.emit('postworkflow', this._hybridSearch);
    }
    return this._hybridSearch;
  }

  // the model of thread operations shared by the history/conversation peers
  _getThreadsModel() {
    return this._threadsModel || (this._threadsModel = new ThreadsModel(this._client));
  }

  get history() {
    if (!this._history) {
      this._history = new History(this._plugin, this._client, this._getThreadsModel());
      this._client._events.emit('postworkflow', this._history);
    }
    return this._history;
  }

  get conversation() {
    // a peer of the history workflow, created independently: the two share
    // the threads model, look each other up here (without constructing) and
    // coordinate only when both exist, so either panel works standalone
    if (!this._conversation) {
      this._conversation = new Conversation(this._plugin, this._client, this._getThreadsModel());
      this._client._events.emit('postworkflow', this._conversation);
    }
    return this._conversation;
  }

  get messages() {
    // the context of message workflows: the item subworkflows behind
    // <miso-message> elements in the conversation panel
    return this._messages || (this._messages = new Messages(this._plugin, this._client));
  }

  get asks() {
    return this._asks || (this._asks = new Asks(this._plugin, this._client));
  }

  get ask() {
    return this.asks.root;
  }

  get explores() {
    return this._explores || (this._explores = new Explores(this._plugin, this._client));
  }

  get explore() {
    return this.explores.get(); // get default explore unit
  }

  get recommendations() {
    return this._recommendations || (this._recommendations = new Recommendations(this._plugin, this._client));
  }

  get recommendation() {
    return this.recommendations.get(); // get default recommendation unit
  }

}
