import { trimObj, uuidToTimestamp } from '@miso.ai/commons';
import { ROLE } from '../constants.js';

const PRODUCT_TYPED_PROPERTIES = new Set([
  ROLE.PRODUCTS,
  ROLE.SOURCES,
  ROLE.RELATED_RESOURCES,
]);

// TODO: move away
export function isProduct(property) {
  return PRODUCT_TYPED_PROPERTIES.has(property);
}

export function toInteraction({ property, misoId }, { event, values, manual }) {
  let api_ts;
  if (misoId) {
    try {
      api_ts = uuidToTimestamp(misoId);
    } catch (e) {}
  }
  const isProductType = isProduct(property);
  const product_ids = isProductType ? values.map(v => v.product_id).filter(v => v) : [];
  const items = isProductType ? undefined : values.map(v => v.text || v);
  return trimObj({
    type: event === 'viewable' ? 'viewable_impression' : event,
    product_ids,
    miso_id: misoId,
    context: {
      custom_context: trimObj({
        api_ts,
        property,
        items,
        trigger: manual ? 'manual' : 'auto',
      }),
    },
  });
}
