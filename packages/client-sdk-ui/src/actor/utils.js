import { trimObj, uuidToTimestamp } from '@miso.ai/commons';
import { ROLE, EVENT_TYPE } from '../constants.js';

const PRODUCT_TYPED_PROPERTIES = new Set([
  ROLE.PRODUCTS,
  ROLE.SOURCES,
  ROLE.RELATED_RESOURCES,
]);

// TODO: move away
export function isProduct(property) {
  return PRODUCT_TYPED_PROPERTIES.has(property);
}

export function toInteraction({ property, misoId, request }, { event, values, manual }) {
  let api_ts;
  if (misoId) {
    try {
      api_ts = uuidToTimestamp(misoId);
    } catch (e) {}
  }
  // TODO: ad-hoc
  const question_source = request && request._meta && request._meta.question_source;
  const isProductType = isProduct(property);
  const isSubmit = event === EVENT_TYPE.SUBMIT;
  const isAffiliation = property === ROLE.AFFILIATION;

  const product_ids = isProductType && values ? values.map(v => typeof v === 'string' ? v : v.product_id).filter(v => v) : !isSubmit ? [] : undefined;
  const items = !isProductType && !isSubmit && values ? values.map(v => v.text || v.id || v) : undefined;
  const value = isSubmit ? values : undefined;

  const channel = isAffiliation ? values[0] && values[0].channel : undefined;
  const positions = isAffiliation ? values.map(v => v.position) : undefined;

  const payload = trimObj({
    type: event === 'viewable' ? 'viewable_impression' : event,
    product_ids,
    miso_id: misoId,
    context: {
      custom_context: trimObj({
        api_ts,
        property,
        channel,
        items,
        value,
        positions,
        trigger: manual ? 'manual' : 'auto',
        question_source,
      }),
    },
  });
  return payload;
}

export function isCurrentSession(hub, session) {
  if (!session) {
    return false;
  }
  const { session: currentSession } = hub.states;
  return currentSession && currentSession.index === session.index;
}
