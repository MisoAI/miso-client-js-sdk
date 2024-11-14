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
  const { session, request, error, value } = data;
  if (!session || !request) {
    return STATUS.INITIAL;
  }
  return error ? STATUS.ERRONEOUS : value ? STATUS.READY : STATUS.LOADING;
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

export function writeKeywordsToData(data, { question: writeQuestion = false } = {}) {
  const { request, value } = data;
  if (!request || !value) {
    return data;
  }
  const { payload } = request || {};
  const { q: keywords } = payload || {};
  if (!keywords) {
    return data;
  }
  const question = writeQuestion ? keywords : undefined;
  return {
    ...data,
    value: {
      question, // so it can be overwritten by value
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

export function addDataInstructions(data, instructions) {
  if (!instructions) {
    return data;
  }
  return {
    _inst: {
      ...data._inst,
      ...instructions,
    },
    ...data,
  };
}

export function removeDataInstructions(data) {
  if (typeof data !== 'object') {
    return data;
  }
  const { _inst, ...rest } = data;
  return rest;
}
