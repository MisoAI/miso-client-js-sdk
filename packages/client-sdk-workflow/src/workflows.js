import { defineValues } from '@miso.ai/commons';
import { ThreadEvents } from './actor/index.js';
import { Asks, HybridSearch, Explores, Search, Recommendations, History, Conversation, MessageItems, ThreadItems } from './workflow/index.js';
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

    defineValues(this, {
      sources: {
        api: sources.api(client),
      },
    });
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
      this._history = new History(this._plugin, this._client, this._getThreadEvents());
      this._client._events.emit('postworkflow', this._history);
    }
    return this._history;
  }

  get conversation() {
    // a peer of the history workflow, created independently: the two look
    // each other up here (without constructing) and coordinate only when
    // both exist, so either panel works standalone
    if (!this._conversation) {
      this._conversation = new Conversation(this._plugin, this._client, this._getThreadEvents());
      this._client._events.emit('postworkflow', this._conversation);
    }
    return this._conversation;
  }

  get messageItems() {
    // the context of message workflows: the item subworkflows behind
    // <miso-message-item> elements in the conversation panel
    return this._messageItems || (this._messageItems = new MessageItems(this._plugin, this._client));
  }

  get threadItems() {
    // the context of thread workflows: the item subworkflows behind
    // <miso-thread-item> elements in the thread list; operations go through the
    // shared threads model
    return this._threadItems || (this._threadItems = new ThreadItems(this._plugin, this._client));
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

  // the thread events channel shared by the chat-history panels' data actors,
  // carrying the thread operation facts across the two hubs; lazily created
  // with the first panel
  _getThreadEvents() {
    return this._threadEvents || (this._threadEvents = new ThreadEvents());
  }

}
