import ContinuityObserver from './continuity.js';

export default class CarouselItemViewabilityObserver {

  constructor(callback, options) {
    this._callback = callback;
    this._options = options || {};
    if (options !== false) {
      this._intersection = new IntersectionObserver(this._handleIntersection.bind(this), { threshold: options.area || 0.5 });
      this._continuity = new ContinuityObserver(this._handleContinuity.bind(this), { onDuration: options.duration || 1000 });
    }

    this._displayed = undefined;
    this._intersecting = false;
    this._triggered = new Set();
  }

  observe(element) {
    if (this._options === false) {
      return;
    }
    this._intersection.observe(element);
  }

  unobserve(element) {
    if (this._options === false) {
      return;
    }
    this._intersection.unobserve(element);
  }

  display(index) {
    if (this._options === false) {
      return;
    }
    if (this._triggered.has(index)) {
      index = undefined;
    }
    if (this._displayed === index) {
      return;
    }
    this._displayed = index;
    this._continuity.value = false; // reset first, the old session is invalid now
    this._syncContinuity();
  }

  disconnect() {
    if (this._options === false) {
      return;
    }
    this._continuity.disconnect();
    this._intersection.disconnect();
  }

  get triggeredCount() {
    return this._triggered.size;
  }

  get triggered() {
    return new Set(this._triggered);
  }

  _syncContinuity() {
    this._continuity.value = this._intersecting && this._displayed !== undefined;
  }

  _handleIntersection(entries) {
    this._intersecting = entries[0].isIntersecting;
    this._syncContinuity();
  }

  _handleContinuity(value) {
    const displayed = this._displayed;
    if (value && displayed !== undefined) {
      if (this._triggered.has(displayed)) {
        return;
      }
      this._triggered.add(displayed);
      this._displayed = undefined;
      this._callback(displayed);
    }
  }

}
