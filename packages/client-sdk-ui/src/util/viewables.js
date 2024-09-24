import { viewable as whenViewable } from '@miso.ai/commons';

export default class Viewables {

  constructor() {
    this._entries = new WeakMap();
  }

  isTracked(element) {
    return this._entries.has(element);
  }

  async track(element, options = {}) {
    if (!options) {
      return false;
    }
    const entry = this._entries.get(element);
    if (entry) {
      return false;
    }
    const ac = new AbortController();
    const { signal } = ac;
    this._entries.set(element, { ac });
    let result = false;
    try {
      await whenViewable(element, { ...options, signal });
      result = true;
    } catch (e) {
      if (e.name !== 'AbortError') {
        throw e;
      }
    } finally {
      this._entries.delete(element);
    }
    return result;
  }

  untrack(element) {
    const entry = this._entries.get(element);
    if (!entry) {
      return;
    }
    entry.ac.abort();
    this._entries.delete(element);
  }

}
