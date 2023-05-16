export default class ProgressController {

  constructor({ cps = 75 } = {}) {
    this._options = { cps };
  }

  get(prevState, newState) {
    const cps = this._cps(newState.input, newState.timestamp);
    const increment = Math.floor((newState.timestamp - prevState.timestamp) * cps / 1000);
    return prevState.cursor + increment;
  }

  _cps({ done, doneAt }, now) {
    let cps = this._options.cps * (Math.random() + 0.5);
    if (done) {
      // speed up gradually when input is done
      cps *= (now - doneAt) / 250;
    }
    return cps;
  }

}
