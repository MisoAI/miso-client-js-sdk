import { trimObj } from '@miso.ai/commons';
import { STATUS, ROLE, EVENT_TYPE, isPerformanceEventType, isProductRole } from '../constants.js';

export function writeDataStatus(data) {
  const status = getStatus(data);
  const ongoing = status === STATUS.READY ? data.ongoing : undefined;
  return trimObj({ status, ongoing, ...data }); // let orinigal data override status and ongoing
}

function getStatus(data) {
  if (!data) {
    return STATUS.INITIAL;
  }
  const { request, error, value } = data;
  return error ? STATUS.ERRONEOUS : value ? STATUS.READY : request ? STATUS.LOADING : STATUS.INITIAL;
}

export function writeMisoIdToMeta(data) {
  const { value } = data;
  if (!value) {
    return data;
  }
  const { miso_id } = value;
  if (!miso_id) {
    return data;
  }
  return {
    ...data,
    meta: {
      ...data.meta,
      miso_id,
    },
  };
}

export function writeKeywordsToData(data) {
  const { request, value } = data;
  // we still want the value in loading status
  if (!request) {
    return data;
  }
  const { payload } = request || {};
  const { q: keywords } = payload || {};
  if (!keywords) {
    return data;
  }
  return {
    ...data,
    value: {
      ...value,
      keywords,
    },
  };
}

export function writeAnswerStageToMeta(data) {
  const { value } = data;
  if (!value) {
    return data;
  }
  const { answer_stage } = value;
  if (!answer_stage) {
    return data;
  }
  // 1. put answer_stage to meta
  // 2. mark ongoing flag
  return {
    ...data,
    ongoing: !value.finished,
    meta: {
      ...data.meta,
      answer_stage,
    },
  };
}

export function writeFiltersToPayload(payload = {}, filters) {
  return trimObj({
    ...payload,
    ...composeFiltersPayload(filters),
  });
}

function composeFiltersPayload(filters) {
  if (!filters) {
    return undefined;
  }
  const { facets } = filters;
  return trimObj({
    facet_filters: composeFacetFilters(facets),
  });
}

function composeFacetFilters(facets) {
  if (!facets) {
    return undefined;
  }
  const filters = {};
  for (const field in facets) {
    const values = facets[field];
    if (!values || !values.length) {
      continue; // just in case
    }
    filters[field] = {
      terms: values,
    };
  }
  return Object.keys(filters).length ? filters : undefined;
}

export function retainFacetCounts(data, currentFacetCounts) {
  if (!currentFacetCounts) {
    return data;
  }
  const { status, value } = data;
  switch (status) {
    case STATUS.INITIAL:
    case STATUS.LOADING:
      break;
    default:
      return data;
  }
  if (value && value.facet_counts) {
    return data;
  }
  return {
    ...data,
    value: {
      ...value,
      facet_counts: currentFacetCounts,
    },
  };
}

export function concatResults(oldData, newData, { role = ROLE.PRODUCTS } = {}) {
  if (!newData.value) {
    return oldData;
  }
  const { [role]: oldProducts = [] } = oldData.value;
  const { [role]: newProducts = [] } = newData.value;
  // keep exhaustion flag
  // TODO
  return {
    ...newData,
    value: {
      ...newData.value,
      [role]: [...oldProducts, ...newProducts],
    },
  }
}

export function markExhaustion(data, { role = ROLE.PRODUCTS } = {}) {
  const { status, request, value } = data;
  // keep track of the exhaustion state
  if (status !== STATUS.READY || !request || !value) {
    return data;
  }
  const { [role]: products } = value;
  if (!products) {
    return data;
  }
  const { rows } = request.payload;
  const { length } = products;
  const exhausted = length < rows;
  if (!exhausted) {
    return data;
  }
  return {
    ...data,
    meta: {
      ...data.meta,
      exhausted: true,
    },
  };
}

export function buildBaseInteraction(args) {
  const { role, type, items } = args;
  const payload = {
    type: type === 'viewable' ? 'viewable_impression' : type,
    context: {
      custom_context: trimObj({
        property: role,
      }),
    },
  };

  if (isPerformanceEventType(type)) {
    if (isProductRole(role)) {
      payload.product_ids = (items || []).map(v => typeof v === 'string' ? v : v.product_id).filter(v => v);
    } else {
      payload.product_ids = [];
      payload.context.custom_context.items = (items || []).map(v => v.text || v.id || v);
    }
  }

  switch (type) {
    case EVENT_TYPE.SUBMIT:
      payload.context.custom_context.value = args.value;
      break;
    case EVENT_TYPE.FEEDBACK:
      payload.context.custom_context.value = payload.value = args.value;
      payload.context.custom_context.result_type = payload.result_type = args.result_type;
      break;
  }

  return trimObj(payload);
}

export function writeAffiliationInfoToInteraction(payload, args) {
  if (args.role !== ROLE.AFFILIATION) {
    return payload;
  }
  const { items } = args;
  const channel = (items[0] && items[0].channel) || undefined;
  const positions = items.map(v => v.position);
  return mergeInteraction(payload, {
    context: {
      custom_context: {
        channel,
        positions,
      },
    },
  });
}

export function mergeInteraction(base = {}, patch = {}) {
  return trimObj({
    ...base,
    ...patch,
    context:trimObj({
      ...base.context,
      ...patch.context,
      custom_context: trimObj({
        ...(base.context && base.context.custom_context),
        ...(patch.context && patch.context.custom_context),
      }),
    }),
  });
}
