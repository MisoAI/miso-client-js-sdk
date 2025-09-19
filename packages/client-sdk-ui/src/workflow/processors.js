import { trimObj, mergeApiPayloads, mergeInteractions } from '@miso.ai/commons';
import { STATUS, ROLE, EVENT_TYPE, REQUEST_TYPE, QUESTION_SOURCE, isPerformanceEventType, isProductRole } from '../constants.js';
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

export function mappingAnswerData(data) {
  if (!data || !data.value) {
    return undefined;
  }
  const { answer = '', answer_stage, finished } = data.value;
  return Object.freeze({ value: answer, stage: answer_stage, finished: !!finished });
}

export function mappingReasoningData(data) {
  if (!data || !data.value) {
    return undefined;
  }
  const { reasoning = '', reasoning_finished } = data.value;
  return Object.freeze({ value: reasoning, stage: 'reasoning', finished: !!reasoning_finished });
}

export function mappingSuggestionsData(_, { workflow } = {}) {
  const previous = workflow.previous;
  const values = previous && previous.states[fields.data()].value;
  const value = values && (values.suggested_followup_questions || values.followup_questions || []);
  return value && value.map(text => ({ text }));
}

export function mappingFollowUpQuestionsData(data) {
  if (!data || !data.value) {
    return undefined;
  }
  return (data.value.followup_questions || []).map(text => ({ text }));
}

// payload //
export function writeQuestionSourceToPayload({ qs, ...payload } = {}) {
  return mergeApiPayloads(payload, {
    metadata: {
      question_source: qs || QUESTION_SOURCE.ORGANIC, // might be null, not undefined
    },
  });
}

export function disableAnswerForNonQueryRequest(payload, type) {
  if (type === REQUEST_TYPE.QUERY) {
    return payload;
  }
  return { ...payload, answer: false };
}

// data //
export function getRevision(data) {
  return data && data.value && data.value.revision;
}

export function writeRequestFromPreviousData(data, oldData) {
  // patch request in case user call updateData() without request object in custom data scenario
  if (!data || !data.value || data.request || !oldData || !oldData.request) {
    return data;
  }
  const { request } = oldData;
  return {
    ...data,
    request,
  };
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

export function writeMisoIdAsRootMisoId(data) {
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
    value: {
      ...value,
      root_miso_id: miso_id,
    },
  };
}

export function concatItemsFromMoreResponse(oldData, newData, { role = ROLE.PRODUCTS } = {}) {
  if (!newData.value) {
    return oldData;
  }
  const { [role]: oldProducts = [], facet_counts, total, root_miso_id } = oldData.value;
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
      root_miso_id,
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
    if (areProducts(role, items)) {
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

function areProducts(role, items = []) {
  return isProductRole(role) || (items.length > 0 && typeof items[0] === 'object' && items[0].product_id);
}

export function writeRequestMetadataToInteraction(payload, args) {
  const { data } = args;
  if (!data) {
    return payload;
  }
  const metadata = data.request && data.request.payload && data.request.payload.metadata;
  if (!metadata) {
    return payload;
  }
  return mergeInteractions(payload, {
    context: {
      custom_context: metadata,
    },
  });
}

export function writeAffiliationInfoToInteraction(payload, args) {
  if (args.role !== ROLE.AFFILIATION) {
    return payload;
  }
  const { items } = args;
  const channel = (items[0] && items[0].channel) || undefined;
  const positions = items.map(v => v.position);
  return mergeInteractions(payload, {
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
  return mergeInteractions(payload, {
    context: {
      custom_context: {
        event_target,
      },
    },
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
