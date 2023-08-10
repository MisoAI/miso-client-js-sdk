import { trimObj, uuidToTimestamp } from '@miso.ai/commons';

export function toInteraction({ property, misoId }, { event, items, manual }) {
  let api_ts;
  if (misoId) {
    try {
      api_ts = uuidToTimestamp(misoId);
    } catch (e) {}
  }
  return trimObj({
    type: event === 'viewable' ? 'viewable_impression' : event,
    product_ids: items,
    miso_id: misoId,
    context: {
      custom_context: trimObj({
        api_ts,
        property,
        trigger: manual ? 'manual' : 'auto',
      }),
    },
  });
}
