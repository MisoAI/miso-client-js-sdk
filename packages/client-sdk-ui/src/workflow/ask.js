import Workflow from './base';
import { fields } from '../saga';
import { ROLE } from '../constants';
import { mergeApiParams } from './utils';

const DEFAULT_API_PARAMS = Object.freeze({
  group: 'search',
  name: 'ask',
  payload: {
    fl: ['*'],
  },
});

export default class Ask extends Workflow {

  constructor(plugin, client) {
    super(plugin, client, {
      roles: [ROLE.ANSWER, ROLE.SOURCES, ROLE.FURTHER_READS],
      defaultApiParams: DEFAULT_API_PARAMS,
    });

    this.useLayouts({
      [ROLE.ANSWER]: 'plaintext',
      [ROLE.SOURCES]: 'list',
      [ROLE.FURTHER_READS]: 'list',
    });
  }

  // lifecycle //
  query(payload) {
    this._sessions.new();
    this._sessions.start();
    this._saga.update(fields.input(), mergeApiParams(this._apiParams, { payload }));
    return this;
  }

}
