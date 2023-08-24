export default class ProgressController {

  constructor(options = {}) {
    this._cps = normalizeSpeedFunction(options);
  }

  get(prevState, newState) {
    const cps = this._cps(newState);
    const increment = Math.floor((newState.timestamp - prevState.timestamp) * cps / 1000);
    return prevState.cursor + increment;
  }

}

function normalizeSpeedFunction({ speed = 75, acceleration = 4 } = {}) {
  if (typeof speed === 'function') {
    return speed;
  }
  if (typeof speed !== 'number') {
    throw new Error(`Invalid speed: ${speed}`);
  }
  if (typeof acceleration !== 'number') {
    throw new Error(`Invalid acceleration: ${acceleration}`);
  }
  return ({ doneAt, timestamp }) => {
    let value = speed * (Math.random() + 0.5);
    if (acceleration > 0 && doneAt !== undefined) {
      // speed up gradually when input is done
      value *= 1 + ((timestamp - doneAt) * acceleration / 1000);
    }
    return value;
  };
}
