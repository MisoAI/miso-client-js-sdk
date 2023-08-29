import { mapAsyncIterator } from '@miso.ai/commons';
import { API } from '@miso.ai/client-sdk-core';
import { postProcessQuestionsResponse } from './utils.js';

export default function(client) {
    // TODO: send uuid & unit id
    return async ({ group, name, payload, options }) => {
    switch (group) {
      case API.GROUP.ASK:
        switch (name) {
          case API.NAME.QUESTIONS:
            const { signal } = options || {};
            const answer = await client.api[group][name](payload, options);
            signal && signal.addEventListener && signal.addEventListener('abort', () => answer.abort(signal.reason));
            return mapAsyncIterator(answer, postProcessQuestionsResponse);
        }
    }
    return postProcess(await client.api[group]._run(name, payload, options));
  };
}

function postProcess(response) {
  // TODO: more API types
  const { miso_id } = response;
  // search, u2p, p2p
  return {
    _meta: {
      miso_id,
    },
    ...response,
  };
}
