export default class ProgressController {

  constructor({ cps = 75 } = {}) {
    this._options = { cps };
  }

  get(prevState, newState) {
    const cps = this._cps(newState);
    const increment = Math.floor((newState.timestamp - prevState.timestamp) * cps / 1000);
    return prevState.cursor + increment;
  }

  _cps({ doneAt, timestamp }) {
    let cps = this._options.cps * (Math.random() + 0.5);
    if (doneAt !== undefined) {
      // speed up gradually when input is done
      cps *= (timestamp - doneAt) / 250;
    }
    return cps;
  }

}
