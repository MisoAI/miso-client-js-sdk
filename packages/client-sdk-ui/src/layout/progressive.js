import { capture } from '@miso.ai/commons';
import RafLayout from './raf.js';

export default class ProgressiveLayout extends RafLayout {

  constructor(options) {
    super(options);
  }

  _takePending() {
    return this._pending;
  }

  _applyRender(timestamp, extraControls = {}) {
    const loop = capture(false);
    super._applyRender(timestamp, { ...extraControls, loop: loop.t });
    if (loop.value) {
      this._requestRaf();
    }
  }

}
