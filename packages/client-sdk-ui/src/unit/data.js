export default class DataReactor {

  constructor(unit) {
    this._unit = unit;
    unit.on('start', event => this._handleStart(event));
  }

  get source() {
    return this._source;
  }

  set source(source) {
    if (source && typeof source.supply !== 'function') {
      throw new Error(`Supply function is mandatory in a data source.`);
    }
    this._source = source;
  }

  async _handleStart(event) {
    if (!this._source) {
      return;
    }
    const { session } = event;
    //this._unit._events.emit('supply', event);
    try {
      const data = await this._source.supply(session);
      this._unit.updateData({ data });
    } catch(error) {
      this._unit.updateData({ error });
    }
  }

}
