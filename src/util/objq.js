class ObjQuery {

  constructor(value) {
    Object.defineProperty(this, 'value', {value});
  }

  /**
   * Return a new object query carrying over properties with non-undefined values.
   * @returns An object query.
   */
  trim() {
    const value = this.value;
    if (typeof value !== 'object') {
      return this;
    }
    return obj$(Object.keys(value).reduce((acc, key) => {
      if (value[key] !== undefined) {
        acc[key] = value[key];
      }
      return acc;
    }, {}));
  }

  /**
   * Return the undefined object query if the internal object is empty (object keys is empty array), or itself otherwise.
   * @returns An object query.
   */
  emptyToUndefined() {
    const value = this.value;
    return typeof value === 'object' && Object.keys(value).length === 0 ? UNDEFINED : this;
  }

}

export const UNDEFINED = new ObjQuery();

export default obj$ = (value) => value === undefined ? UNDEFINED : new ObjQuery(value);
