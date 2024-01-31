import { uuidv4 } from '@miso.ai/commons';

const ID = 'std:interactions';

export default class InteractionsPlugin {

  static get id() {
    return ID;
  }

  constructor() {
  }

  install(_, { addPayloadPass }) {
    addPayloadPass(this._modifyPayload.bind(this));
  }

  _modifyPayload({ apiGroup, apiName, payload }) {
    return apiGroup === 'interactions' && apiName === 'upload' ?
      this._modifyPayloadForInteractions(payload) : payload;
  }

  _modifyPayloadForInteractions({ data }) {
    return { data: data.map(modifyInteractionRecord) };
  }

}

function modifyInteractionRecord(record) {
  const { context = {} } = record;
  const custom_context = { ...context.custom_context };
  if (!custom_context.uuid) {
    custom_context.uuid = uuidv4();
  }
  return {
    ...record,
    context: {
      ...context,
      custom_context,
    },
  };
}
