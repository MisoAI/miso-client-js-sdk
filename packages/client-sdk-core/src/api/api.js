/** @module core */

import { Component } from '@miso.ai/commons';
import ApiHelpers from './helpers.js';
import Interactions from './interactions.js';
import Ask from './ask.js';
import Search from './search.js';
import Recommendation from './recommendation.js';

/**
 * Miso APIs, available as `client.api`, grouped by `ask`, `search`,
 * `recommendation`, and `interactions`. For request payloads and responses,
 * see the Miso API docs.
 *
 * Each API method takes a request payload and optional request options, and
 * returns a promise of the response data. Request options include:
 *
 * - `timeout` - Request timeout in milliseconds. Defaults to `options.request.timeout` of the client.
 * - `retry` - Number of retries on network errors, timeouts, and 5xx responses.
 *   Defaults to `options.request.retry` of the client, which is 0.
 * - `bulk` - Send the request with others in a single bulk request.
 *
 * Some Ask APIs return an {@link module:core.IterableApiStub IterableApiStub} instead, for answers that
 * are generated over time.
 *
 * @extends Component
 */
class Api extends Component {

  constructor(client, root) {
    super('api', client);
    this._client = client;
    this.helpers = new ApiHelpers(client, root);
    this.interactions = new Interactions(this);
    this.ask = new Ask(this);
    this.search = new Search(this);
    this.recommendation = new Recommendation(this);
  }

}

export default Api;
