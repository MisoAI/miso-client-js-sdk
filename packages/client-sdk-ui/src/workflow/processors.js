import { trimObj } from '@miso.ai/commons';
import { STATUS } from '../constants.js';

export function writeDataStatus(data) {
  const status = getStatus(data);
  const ongoing = status === STATUS.READY ? !!data.ongoing : undefined;
  return trimObj({ ...data, status, ongoing });
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
  if (!request || !value) {
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

export function composeFq(filters) {
  if (!filters) {
    return undefined;
  }
  const clauses = [];
  const { facets } = filters;
  for (const field in facets) {
    const values = facets[field];
    if (!values || !values.length) {
      continue; // just in case
    }
    const vstr = values.length === 1 ? `"${values[0]}"` : `(${values.map(v => `"${v}"`).join(' OR ')})`;
    clauses.push(`${field}:${vstr}`);
  }
  return clauses.map(c => `(${c})`).join(' AND ');
}
