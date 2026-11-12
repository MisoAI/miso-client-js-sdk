/** @module core */

import { trimObj, Component, uuidv4, defineValues, isInBrowser } from '@miso.ai/commons';
import { root, register, init } from './root.js';
import { Api } from './api/index.js';
import Context from './context.js';
import * as helpers from './utils.js';

const currentScript = isInBrowser ? document.currentScript : undefined;

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
 * @extends Component
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
   * The SDK version.
   *
   * @type {string}
   */
  static get version() {
    return root.version;
  }

  /**
   * All client instances created so far.
   *
   * @type {MisoClient[]}
   */
  static get instances() {
    return root.instances;
  }

  /**
   * Get the first client instance, waiting for one to be created if there is none yet.
   *
   * @returns {Promise<MisoClient>}
   */
  static any() {
    return root.any();
  }

  /**
   * Listen to SDK-level events. For example, `'create'` fires with each new client
   * instance, including the ones created before you started listening.
   *
   * @param {string} name - Event name.
   * @param {Function} callback
   * @returns {Function} A function to remove the listener.
   */
  static on(name, callback) {
    return root.on(name, callback);
  }

  /**
   * Wait for the next occurrence of an SDK-level event.
   *
   * @param {string} name - Event name.
   * @returns {Promise<*>}
   */
  static once(name) {
    return root.once(name);
  }

  /**
   * Resolves after all functions pushed to `window.misocmd` before the SDK loaded have run.
   *
   * @type {Promise<void>}
   */
  static get cmdDone() {
    return root.cmdDone;
  }

  /**
   * Manage plugins, which add optional features to the SDK.
   *
   * - `use(id, options)` activates a plugin, or reconfigures it if already active.
   * - `install(id, options)` is like `use()`, but loads standard (`std:`) plugins from
   *   the CDN if needed, and returns a promise of the installed plugin.
   * - `register(PluginClass)` makes a custom plugin class available by its `id`.
   * - `whenInstalled(id)` returns a promise that resolves when the plugin is installed.
   *
   * @type {Object}
   * @example
   * MisoClient.plugins.use('std:debug');
   * await MisoClient.plugins.install('std:analytics');
   */
  static get plugins() {
    return root._pluginRoot.plugins;
  }

  /**
   * @param {Object|string} options - Client options, or just the API key as a string.
   * @param {string} options.apiKey - Your Miso publishable API key. Required.
   * @param {string} [options.apiHost] - Shorthand to set both `dataEndpoint` and `eventEndpoint`.
   * @param {string} [options.dataEndpoint] - Base URL for data APIs (Ask, Search, Recommendation).
   *   Defaults to `https://api-edge.askmiso.com/v1`.
   * @param {string} [options.eventEndpoint] - Base URL for the Interactions API.
   *   Defaults to `https://api.askmiso.com/v1`.
   * @param {Object} [options.request] - Default settings applied to every API request.
   * @param {number} [options.request.timeout] - Request timeout in milliseconds.
   * @param {number} [options.request.retry=0] - Number of retries on network errors, timeouts,
   *   and 5xx responses. Off by default, as retrying a non-idempotent call (such as posting
   *   a question) may not be safe. Can also be set per request.
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
   * The SDK version.
   *
   * @type {string}
   */
  get version() {
    return MisoClient.version;
  }

  /**
   * The options passed to the constructor, after normalization. Read-only.
   *
   * @type {Readonly<Object>}
   */
  get options() {
    return this._options;
  }

  _config(options) {
    this._options = Object.freeze(this._normalizeOptions(options));
  }

  _normalizeOptions(options = {}) {
    // copy, so the caller's own object is left untouched
    options = typeof options === 'string' ? { apiKey: options } : { ...options };
    if (options.readConfigFromScriptUrl) {
      options = {
        ...this._readConfigFromScriptUrl(),
        ...options,
      };
    }
    if (!options.apiKey) {
      throw new Error('Require API key to initialize miso client.');
    }
    if (options.request) {
      if (options.request.sendApiKeyByHeader) {
        console.warn('`sendApiKeyByHeader` option is deprecated. Please call `MisoClient.plugins.use("std:header-api-key");` instead.');
      }
      // copy before freezing, so the caller's own object stays mutable
      options.request = Object.freeze({ ...options.request });
    }

    options.dataEndpoint = options.dataEndpoint || options.apiHost;
    options.eventEndpoint = options.eventEndpoint || options.apiHost;
    delete options.apiHost;

    return trimObj(options);
  }

  /**
   * Used by shopify plugin.
   *
   * @private
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
 * Utility functions.
 *
 * @member {Object} helpers
 * @memberof module:core~MisoClient
 */
MisoClient.helpers = helpers;

defineValues(MisoClient, {
  uuid: uuidv4(),
});

export default init(MisoClient);
