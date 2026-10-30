import { trimObj, Component, uuidv4, defineValues, isInBrowser } from '@miso.ai/commons';
import { root, register, init } from './root.js';
import { Api } from './api/index.js';
import Context from './context.js';
import * as helpers from './utils.js';

const currentScript = isInBrowser ? document.currentScript : undefined;

/**
 * @typedef {Object} MisoClientOptions
 * @property {string} apiKey - Your Miso publishable API key. Required.
 * @property {string} [apiHost] - Shorthand to set both `dataEndpoint` and `eventEndpoint`.
 * @property {string} [dataEndpoint] - Base URL for data APIs (Ask, Search, Recommendation).
 *   Defaults to `https://api-edge.askmiso.com/v1`.
 * @property {string} [eventEndpoint] - Base URL for the Interactions API.
 *   Defaults to `https://api.askmiso.com/v1`.
 * @property {Object} [request] - Default settings applied to every API request.
 * @property {number} [request.timeout] - Request timeout in milliseconds.
 * @property {number} [request.retry=0] - Number of retries on network errors, timeouts,
 *   and 5xx responses. Off by default, as retrying a non-idempotent call (such as posting
 *   a question) may not be safe. Can also be set per request.
 */

/**
 * The entry point of Miso SDK. Create an instance with your API key to access Miso APIs.
 *
 * When loaded from the CDN, the class is available as `window.MisoClient`. To run code
 * once the SDK is ready, push a function to `window.misocmd`:
 *
 * ```js
 * const misocmd = window.misocmd || (window.misocmd = []);
 * misocmd.push(async () => {
 *   const client = new MisoClient({ apiKey: '...' });
 *   const response = await client.api.search.search({ q: 'shoes' });
 * });
 * ```
 *
 * With the full SDK, plugins also add features to each instance, such as
 * `client.ui` (UI elements and layouts) and `client.workflows` (Ask, Search, etc.).
 *
 * @example
 * import MisoClient from '@miso.ai/client-sdk';
 *
 * const client = new MisoClient({ apiKey: '...' });
 * client.context.user_id = 'user-123';
 */
class MisoClient extends Component {

  /**
   * Assign `MisoClient` to `window.MisoClient`. The default entry point does this
   * automatically; call it only when you import from a `detached` entry point.
   *
   * If `window.MisoClient` already holds a different SDK copy, it is left untouched and
   * a warning is logged.
   */
  static attach() {
    if (typeof window === 'undefined') {
      console.warn(`MisoClient cannot be attached in non-browser environment.`);
      return;
    }
    (window.MisoClients || (window.MisoClients = [])).push(MisoClient);
    if (window.MisoClient) {
      if (window.MisoClient !== MisoClient) {
        // TODO: check version as well
        console.warn(`window.MisoClient already exists: (${window.MisoClient.version}).`);
      }
      return;
    }
    window.MisoClient = MisoClient;
  }

  /**
   * Log debug messages. Does nothing unless the `std:debug` plugin is in use.
   *
   * @param {...*} args
   */
  static debug() {}

  /**
   * @param {MisoClientOptions|string} options - Client options, or just the API key.
   * @throws {Error} If no API key is given.
   */
  constructor(options) {
    super('client', root);
    this._config(options);

    /**
     * User and site context sent along with API requests, such as `user_id`,
     * `user_hash`, `anonymous_id`, and `site`. Set these to identify the current user.
     *
     * @type {Object}
     */
    this.context = new Context(this);

    /**
     * Miso APIs, grouped by `ask`, `search`, `recommendation`, and `interactions`.
     *
     * @example
     * const response = await client.api.recommendation.userToProducts({ rows: 5 });
     * await client.api.interactions.upload({ type: 'click', product_ids: ['P1'] });
     */
    this.api = new Api(this, root);

    register(this);
  }

  /**
   * The options this client was created with, after normalization. Read-only.
   *
   * @member {Readonly<MisoClientOptions>} options
   * @memberof MisoClient#
   */

  /**
   * The SDK version.
   *
   * @type {string}
   */
  get version() {
    return MisoClient.version;
  }

  _config(options) {
    this.options = Object.freeze(this._normalizeOptions(options));
  }

  _normalizeOptions(options = {}) {
    if (typeof options === 'string') {
      options = { apiKey: options };
    }
    if (options.readConfigFromScriptUrl) {
      options = {
        ...this._readConfigFromScriptUrl(),
        ...options,
      };
    }
    if (!options.apiKey) {
      throw new Error('Require API key to initialize miso client.');
    }
    if (options.request && options.request.sendApiKeyByHeader) {
      console.warn('`sendApiKeyByHeader` option is deprecated. Please call `MisoClient.plugins.use("std:header-api-key");` instead.');
    }

    options.dataEndpoint = options.dataEndpoint || options.apiHost;
    options.eventEndpoint = options.eventEndpoint || options.apiHost;
    delete options.apiHost;

    return trimObj(options);
  }

  /**
   * Used by shopify plugin.
   */
  _readConfigFromScriptUrl() {
    const url = currentScript.src || currentScript.href; // might be <link> as well
    const params = new URL(new Request(url).url).searchParams;
    return trimObj({
      apiKey: params.get('api_key') || undefined,
    });
  }

}

/**
 * The SDK version.
 *
 * @member {string} version
 * @memberof MisoClient
 */

/**
 * All client instances created so far.
 *
 * @member {MisoClient[]} instances
 * @memberof MisoClient
 */

/**
 * Get the first client instance, waiting for one to be created if there is none yet.
 *
 * @function any
 * @memberof MisoClient
 * @returns {Promise<MisoClient>}
 */

/**
 * Listen to SDK-level events. For example, `'create'` fires with each new client
 * instance, including the ones created before you started listening.
 *
 * @function on
 * @memberof MisoClient
 * @param {string} name - Event name.
 * @param {Function} callback
 * @returns {Function} A function to remove the listener.
 */

/**
 * Wait for the next occurrence of an SDK-level event.
 *
 * @function once
 * @memberof MisoClient
 * @param {string} name - Event name.
 * @returns {Promise<*>}
 */

/**
 * Resolves after all functions pushed to `window.misocmd` before the SDK loaded have run.
 *
 * @member {Promise<void>} cmdDone
 * @memberof MisoClient
 */

/**
 * Manage plugins, which add optional features to the SDK.
 *
 * - `use(id, options)` activates a plugin, or reconfigures it if already active.
 * - `install(id, options)` is like `use()`, but loads standard (`std:`) plugins from
 *   the CDN if needed, and returns a promise of the installed plugin.
 * - `register(PluginClass)` makes a custom plugin class available by its `id`.
 * - `whenInstalled(id)` returns a promise that resolves when the plugin is installed.
 *
 * @member {Object} plugins
 * @memberof MisoClient
 * @example
 * MisoClient.plugins.use('std:debug');
 * await MisoClient.plugins.install('std:analytics');
 */

/**
 * Utility functions.
 *
 * @member {Object} helpers
 * @memberof MisoClient
 */
MisoClient.helpers = helpers;

defineValues(MisoClient, {
  uuid: uuidv4(),
});

export default init(MisoClient);
