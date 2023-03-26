export default class Logger {

  constructor(saga) {
    this._saga = saga;
    saga.on('*', (event, meta) => console.log(meta, event));
  }

}
