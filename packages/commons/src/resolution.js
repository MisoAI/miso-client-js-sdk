export default class Resolution {

  constructor() {
    const self = this;
    self.promise = new Promise((resolve, reject) => {
      self.resolve = resolve;
      self.reject = reject;
    });
    Object.freeze(this);
  }

}
