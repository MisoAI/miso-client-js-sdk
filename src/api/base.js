export default class ApiBase {

  // TODO: use private fields (may encounter issues with rollup)

  constructor(api) {
    this.helpers = api.helpers;
    this.config = api._context.config.readonly;
    this.user = api._context.user.readonly;
  }

}
