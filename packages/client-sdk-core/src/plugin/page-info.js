import { trimObj } from '@miso.ai/commons';

const ID = 'std:page-info';

export default class PageInfoPlugin {

  static get id() {
    return ID;
  }

  constructor() {
  }

  install(_, { addPayloadPass }) {
    addPayloadPass(this._modifyPayload.bind(this));
  }

  _modifyPayload({ apiGroup, apiName, payload }) {
    return apiGroup === 'interactions' && apiName === 'upload' ?
      this._modifyPayloadForInteractions(payload) : payload;
  }

  _modifyPayloadForInteractions({ data }) {
    data = data.map(obj => ({
      ...obj,
      context: {
        ...getPayloadContext(),
        ...obj.context,
      },
    }));
    return { data };
  }

}

function getPayloadContext() {
  return trimObj({
    page: readPageInfo(),
    campaign: readUtm()
  });
}

function readPageInfo() {
  return trimObj({
    url: window.location.href,
    referrer: document.referrer || undefined,
    title: document.title,
  });
}

function readUtm() {
  const params = new URLSearchParams(window.location.search);
  let utm = trimObj({
    source: params.get('utm_source') || undefined,
    medium: params.get('utm_medium') || undefined,
    name: params.get('utm_campaign') || undefined,
    term: params.get('utm_term') || undefined,
    content: params.get('utm_content') || undefined,
  });
  return Object.keys(utm).length === 0 ? undefined : utm;
}
