import { mixin } from '@miso.ai/commons';

export function enableUseLink(prototype) {
  mixin(prototype, UseLinkMixin.prototype);
}

export class UseLinkMixin {

  useLink(fn, options = {}) {
    if (typeof fn !== 'function' && fn !== false) {
      throw new Error('useLink(fn) expects fn to be a function or false');
    }
    this._linkFn = fn ? [fn, options] : false;
    return this;
  }

  _submitToPage(args = {}) {
    if (!this._linkFn) {
      return;
    }
    // TODO: we want a submit event
    const url = this._getSubmitUrl(args);
    const [_, options = {}] = this._linkFn;
    if (options.open === false) {
      window.location.href = url;
    } else {
      const target = options.target || '_blank';
      const windowFeatures = options.windowFeatures || '';
      window.open(url, target, windowFeatures);
    }
  }

  _getSubmitUrl(args) {
    if (!this._linkFn) {
      throw new Error('useLink(fn) must be called before _getSubmitUrl()');
    }
    return this._linkFn[0](args.q);
  }

}
