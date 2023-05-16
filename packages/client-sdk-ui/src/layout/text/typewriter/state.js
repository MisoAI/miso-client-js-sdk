export default class State {

  constructor(args) {
    Object.assign(this, args);
    Object.freeze(this);
  }

}
