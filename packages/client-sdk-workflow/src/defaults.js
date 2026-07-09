/**
 * A store of default workflow options, keyed by workflow name
 * (e.g. 'search', 'ask', 'recommendation').
 *
 * Values set here act as workflow defaults: they override the built-in
 * defaults of the workflow class, but are in turn overridden by context-level
 * and workflow-level options (e.g. `useLayouts()`).
 *
 * For now, only layout options (`layouts`) are picked up by the UI plugin.
 * Defaults must be set before the workflow instance is created.
 */
export default class WorkflowDefaults {

  constructor({ onSet } = {}) {
    this._onSet = onSet;
    this._data = new Map();
  }

  /**
   * Merge the given options into the stored defaults of a workflow.
   * Feature values (e.g. `layouts`) are merged shallowly.
   *
   * @param {string} name workflow name, e.g. 'search'
   * @param {object} options e.g. `{ layouts: { products: ['list', { ... }] } }`
   */
  set(name, options) {
    if (typeof name !== 'string' || !name) {
      throw new Error(`Expect workflow name to be a non-empty string: ${name}`);
    }
    if (!isPlainObject(options)) {
      throw new Error(`Expect options to be an object: ${options}`);
    }
    const current = this._data.get(name) || {};
    const merged = { ...current };
    for (const [key, value] of Object.entries(options)) {
      merged[key] = mergeFeatureOptions(current[key], value);
    }
    this._data.set(name, Object.freeze(merged));
    this._onSet && this._onSet(name, options);
  }

  get(name) {
    return this._data.get(name);
  }

  get names() {
    return [...this._data.keys()];
  }

}

function mergeFeatureOptions(base, overrides) {
  return isPlainObject(base) && isPlainObject(overrides) ? Object.freeze({ ...base, ...overrides }) : overrides;
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
