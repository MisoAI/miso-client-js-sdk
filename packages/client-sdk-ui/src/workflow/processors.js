import { trimObj } from '@miso.ai/commons';
import { STATUS, ROLE } from '../constants.js';

export function writeDataStatus(data) {
  const status = getStatus(data);
  const ongoing = status === STATUS.READY ? !!data.ongoing : undefined;
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
