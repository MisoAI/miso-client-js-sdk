import { capture, requestAnimationFrame as raf } from '@miso.ai/commons';
import RafLayout from './raf';

export default class ProgressiveLayout extends RafLayout {

  constructor(options) {
    super(options);
  }

  _takePending() {
    return this._pending;
  }

  _applyRender(extraControls = {}) {
    const loop = capture(false);
    super._applyRender({ ...extraControls, loop: loop.t });
    if (loop.value) {
      this._requestRaf();
    }
  }

}
