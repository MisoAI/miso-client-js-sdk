import { trimObj } from '@miso.ai/commons';
import { STATUS, ROLE, EVENT_TYPE, isPerformanceEventType, isProductRole } from '../constants.js';
import { fields } from '../actor/index.js';

// role mappings //
export function mappingSortData(_, { hub, workflowOptions = {} } = {}) {
  const { sort: { options = [] } = {} } = workflowOptions.filters || {};
  if (!options.length) {
    return [];
  }
  const { sort } = hub.states[fields.filters()] || {};
  const selectedField = (sort && sort.field) || findDefaultSortOption(options).field;
  if (!selectedField) {
    return options;
  }
  // mark selected
  return options.map(option => {
    return {
      ...option,
      selected: option.field === selectedField,
    };
  });
}

function findDefaultSortOption(options) {
  for (const option of options) {
    if (option.default) {
      return option;
    }
  }
  return options[0];
}

// data //
export function getRevision(data) {
  return data && data.value && data.value.revision;
}

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

export function writeMisoIdToSession(data) {
  const { session, value } = data;
  if (!session || !value) {
    return;
  }
  const { miso_id } = value;
  if (!miso_id) {
    return;
  }
  session.meta.miso_id = miso_id;
}

export function writeMisoIdFromSession(data) {
  const { session, value } = data;
  if (!session || !value) {
    return data;
  }
  const { meta: { miso_id } = {} } = session;
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

export function retainFacetCountsInData(data, currentFacetCounts) {
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

export function concatItemsFromMoreResponse(oldData, newData, { role = ROLE.PRODUCTS } = {}) {
  if (!newData.value) {
    return oldData;
  }
  const { [role]: oldProducts = [], facet_counts, total } = oldData.value;
  const { [role]: newProducts = [] } = newData.value;
  // keep old exhaustion flag, just in case
  // TODO

  // use old values of facet_counts and total, for they are affected by product_id exclusion
  return {
    ...newData,
    value: {
      ...newData.value,
      facet_counts,
      total,
      [role]: [...oldProducts, ...newProducts],
    },
  }
}

export function writeExhaustionToData(data, { role = ROLE.PRODUCTS } = {}) {
  const { status, request, value } = data;
  // keep track of the exhaustion state
  if (status !== STATUS.READY || !request || !value) {
    return data;
  }
  const { [role]: items } = value;
  if (!items) {
    return data;
  }
  const { rows } = request.payload;
  const { length } = items;
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

// interactions //
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

export function writeEventTargetToInteraction(payload, { event_target } = {}) {
  if (!event_target) {
    return payload;
  }
  return mergeInteraction(payload, {
    context: {
      custom_context: {
        event_target,
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

export function writeUnanswerableToMeta(data) {
  const { value } = data;
  if (!value) {
    return data;
  }
  if (!value.finished || value.finish_reason !== 'success' || (value.sources && value.sources.length > 0)) {
    return data;
  }
  return {
    ...data,
    meta: {
      ...data.meta,
      unanswerable: true,
    },
  };
}
