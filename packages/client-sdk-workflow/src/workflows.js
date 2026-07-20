import { defineValues, EventEmitter } from '@miso.ai/commons';
import { Asks, HybridSearch, Explores, Search, Recommendations, History, Thread } from './workflow/index.js';
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
    this._events = new EventEmitter();

    defineValues(this, {
      sources: {
        api: sources.api(client),
      },
    });
  }

  /**
   * The event bus shared by all workflow instances of this client.
   */
  get events() {
    return this._events;
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

  get history() {
    if (!this._history) {
      this._history = new History(this._plugin, this._client);
      this._client._events.emit('postworkflow', this._history);
    }
    return this._history;
  }

  get thread() {
    if (!this._thread) {
      this._thread = new Thread(this._plugin, this._client);
      this._client._events.emit('postworkflow', this._thread);
    }
    return this._thread;
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
