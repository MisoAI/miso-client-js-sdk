import { asArray } from '@miso.ai/commons';

export default class Interactions {

  constructor(context) {
    this._context = context;
  }

  _send(unit, event) {
    const payloads = this._buildPayloads(unit, event);
    const client = this._context._client;
    if (payloads.length > 0) {
      client.api.interactions.upload(payloads, { merge: true });
    }
  }

  preprocess(callback) {
    this._payloadPass = callback;
  }

  _buildPayloads({ id, uuid }, { type, productIds, manual }) {
    let payload = {
      type: type === 'viewable' ? 'viewable_impression' : type,
      product_ids: productIds,
      context: {
        custom_context: {
          unit_id: id,
          unit_instance_uuid: uuid,
          trigger: manual ? 'manual' : 'auto',
        },
      },
    };
    if (this._payloadPass) {
      // TODO: handle error
      payload = this._payloadPass(payload);
    }
    return asArray(payload);
  }

}
