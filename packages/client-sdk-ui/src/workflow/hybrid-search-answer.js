import AnswerBasedWorkflow from './answer-based.js';
import { fields } from '../actor/index.js';
import { writeKeywordsToData, writeMisoIdToSession, writeMisoIdFromSession, writeUnanswerableToMeta } from './processors.js';

const ROLES_OPTIONS = AnswerBasedWorkflow.ROLES_OPTIONS;

export default class HybridSearchAnswer extends AnswerBasedWorkflow {

  constructor(superworkflow) {
    super({
      name: 'hybrid-search/answer',
      plugin: superworkflow._plugin,
      client: superworkflow._client,
      options: superworkflow._options,
      defaults: superworkflow._defaults,
      roles: ROLES_OPTIONS,
      superworkflow,
    });
  }

  _initProperties(args) {
    super._initProperties(args);
    this._superworkflow = args.superworkflow;
  }

  _initSession() {} // no reset here, will manually reset later

  _doLoading(data) {
    const { session } = this;
    this.updateData({ ...data, session });
  }

  _queryWithQuestionId(data) {
    const { session } = this;
    const { request, value } = data;
    this.updateData({ ...data, session });
    // start query with question_id
    const { question_id } = value;
    if (!question_id) {
      return;
    }
    // forge the request
    const payload = {
      ...request.payload,
      question_id,
    };
    if (payload.metadata.page !== undefined) {
      delete payload.metadata.page;
    }
    this._hub.update(fields.request(), { ...request, payload, session });
  }

  // data //
  _defaultProcessData(data, oldData) {
    data = super._defaultProcessData(data, oldData);
    data = writeKeywordsToData(data);
    data = writeMisoIdFromSession(data);
    data = writeUnanswerableToMeta(data);
    return data;
  }

  _handleHeadResponse(data) {
    super._handleHeadResponse(data);
    // keep track of miso_id in session
    writeMisoIdToSession(data);
  }

  // interactions //
  _defaultProcessInteraction(payload, args) {
    return this._superworkflow._defaultProcessInteraction(payload, args);
  }

  _defaultProcessInteraction0(payload, args) {
    return super._defaultProcessInteraction(payload, args);
  }

}
