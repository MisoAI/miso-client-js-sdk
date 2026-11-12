/** @module workflow */

import { WORKFLOW_CONFIGURABLE } from '../../constants.js';

const DEFAULT_FEATURES = [
  WORKFLOW_CONFIGURABLE.API,
  WORKFLOW_CONFIGURABLE.LAYOUTS,
  WORKFLOW_CONFIGURABLE.DATA_PROCESSOR,
  WORKFLOW_CONFIGURABLE.TRACKERS,
  WORKFLOW_CONFIGURABLE.INTERACTIONS,
];

// injects use*() and clear*() methods for each feature: keep in sync with the
// mixin docs at the bottom of this file
export function makeConfigurable(prototype, features = DEFAULT_FEATURES) {
  for (const feature of features) {
    injectConfigurableFeature(prototype, feature);
  }
}

function injectConfigurableFeature(prototype, feature) {
  if (feature === WORKFLOW_CONFIGURABLE.API) {
    Object.assign(prototype, {
      useApi(...args) {
        this._options.api.merge(args);
        return this;
      },
      clearApi() {
        this._options.api.set();
        return this;
      },
    });
  } else {
    const upperCased = upperCase(feature);
    Object.assign(prototype, {
      [`use${upperCased}`](value) {
        (this._options[feature]).merge(value);
        return this;
      },
      [`clear${upperCased}`]() {
        (this._options[feature]).set();
        return this;
      },
    });
  }
}

// helpers //
// TODO: move to commons
function upperCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// docs //
// The methods injected by makeConfigurable(), as JSDoc mixins: one per
// feature, plus Configurable for the default features. A class mixes in the
// ones matching its makeConfigurable() call (@mixes).

/**
 * The methods to configure a workflow, or a workflow context, which every
 * workflow and context has.
 *
 * Each `use*()` method merges the given options into the ones set before,
 * and each `clear*()` method removes them. Options set on a workflow context
 * apply to all of its workflows, and options set on a workflow take
 * precedence.
 *
 * @mixin module:workflow~Configurable
 * @mixes module:workflow~ApiConfigurable
 * @mixes module:workflow~LayoutsConfigurable
 * @mixes module:workflow~DataProcessorConfigurable
 * @mixes module:workflow~TrackersConfigurable
 * @mixes module:workflow~InteractionsConfigurable
 */

/**
 * The methods to configure the API a workflow calls.
 *
 * @mixin module:workflow~ApiConfigurable
 */

/**
 * Set the API to call, and extra payload to send with each request.
 *
 * @function useApi
 * @memberof module:workflow~ApiConfigurable
 * @param {string|Object|false} [name] - The API name, such as `'questions'`,
 *   or with its group, such as `'ask/questions'`. Pass the payload object
 *   alone to keep the API, or `false` to stop calling the API, so you can
 *   provide data by `updateData()` instead.
 * @param {Object} [payload] - Extra payload, merged into the request payload.
 * @returns {this}
 * @example
 * workflow.useApi('ask/questions', { source_fl: ['title', 'url'] });
 */

/**
 * Remove the API options set by `useApi()`.
 *
 * @function clearApi
 * @memberof module:workflow~ApiConfigurable
 * @returns {this}
 */

/**
 * The methods to configure the layouts a workflow renders with.
 *
 * @mixin module:workflow~LayoutsConfigurable
 */

/**
 * Set the layouts, by role.
 *
 * @function useLayouts
 * @memberof module:workflow~LayoutsConfigurable
 * @param {Object|false} options - The layout of each role, as a layout
 *   name, layout options, or `[name, options]`. Pass `false` to stop
 *   rendering.
 * @returns {this}
 * @example
 * workflow.useLayouts({
 *   query: { placeholder: 'Ask a question' },
 *   products: 'list',
 * });
 */

/**
 * Remove the layout options set by `useLayouts()`.
 *
 * @function clearLayouts
 * @memberof module:workflow~LayoutsConfigurable
 * @returns {this}
 */

/**
 * The methods to configure how a workflow processes its data.
 *
 * @mixin module:workflow~DataProcessorConfigurable
 */

/**
 * Add functions to process the data before it is rendered. They run in the
 * order they are added.
 *
 * @function useDataProcessor
 * @memberof module:workflow~DataProcessorConfigurable
 * @param {Function|Function[]} fns - Functions taking `(data, oldData)` and
 *   returning the processed data.
 * @returns {this}
 */

/**
 * Remove the functions added by `useDataProcessor()`.
 *
 * @function clearDataProcessor
 * @memberof module:workflow~DataProcessorConfigurable
 * @returns {this}
 */

/**
 * The methods to configure how a workflow tracks the rendered items.
 *
 * @mixin module:workflow~TrackersConfigurable
 */

/**
 * Set the trackers, by role.
 *
 * @function useTrackers
 * @memberof module:workflow~TrackersConfigurable
 * @param {Object|boolean} options - `true` or `false` to turn all trackers
 *   on or off, or the options of each role: `active`, and the options of
 *   each event type, `impression`, `viewable` (`area` and `duration`), and
 *   `click` (`lenient`).
 * @returns {this}
 * @example
 * workflow.useTrackers({ products: { viewable: { duration: 2000 } } });
 */

/**
 * Remove the tracker options set by `useTrackers()`.
 *
 * @function clearTrackers
 * @memberof module:workflow~TrackersConfigurable
 * @returns {this}
 */

/**
 * The methods to configure how a workflow sends interactions.
 *
 * @mixin module:workflow~InteractionsConfigurable
 */

/**
 * Set how interactions are sent.
 *
 * @function useInteractions
 * @memberof module:workflow~InteractionsConfigurable
 * @param {Object|false} options - Pass `false` to stop sending interactions.
 * @param {Function|Function[]} [options.preprocess] - Functions taking the
 *   interaction payload and returning the modified one, run before it is sent.
 * @param {Function} [options.handle] - A function taking the interaction
 *   payload, to send it yourself instead.
 * @returns {this}
 */

/**
 * Remove the interaction options set by `useInteractions()`.
 *
 * @function clearInteractions
 * @memberof module:workflow~InteractionsConfigurable
 * @returns {this}
 */

/**
 * The methods to configure the filters of a search workflow.
 *
 * @mixin module:workflow~FiltersConfigurable
 */

/**
 * Set the filter options, such as the sort options.
 *
 * @function useFilters
 * @memberof module:workflow~FiltersConfigurable
 * @param {Object|boolean} options
 * @returns {this}
 * @example
 * workflow.useFilters({
 *   sort: {
 *     options: [
 *       { field: 'relevance', text: 'Relevance', default: true },
 *       { field: 'published_at', text: 'Date' },
 *     ],
 *   },
 * });
 */

/**
 * Remove the filter options set by `useFilters()`.
 *
 * @function clearFilters
 * @memberof module:workflow~FiltersConfigurable
 * @returns {this}
 */

/**
 * The methods to configure the pagination of a workflow.
 *
 * @mixin module:workflow~PaginationConfigurable
 */

/**
 * Set the pagination options.
 *
 * @function usePagination
 * @memberof module:workflow~PaginationConfigurable
 * @param {Object|boolean} options - `true` or `false` to turn pagination on
 *   or off, or the options, such as `active` and `mode`.
 * @returns {this}
 */

/**
 * Remove the pagination options set by `usePagination()`.
 *
 * @function clearPagination
 * @memberof module:workflow~PaginationConfigurable
 * @returns {this}
 */

/**
 * The methods to configure the templates of a workflow.
 *
 * @mixin module:workflow~TemplatesConfigurable
 */

/**
 * Set the templates, by name.
 *
 * @function useTemplates
 * @memberof module:workflow~TemplatesConfigurable
 * @param {Object} options - The template of each name, as a function, or a
 *   value.
 * @returns {this}
 */

/**
 * Remove the template options set by `useTemplates()`.
 *
 * @function clearTemplates
 * @memberof module:workflow~TemplatesConfigurable
 * @returns {this}
 */
