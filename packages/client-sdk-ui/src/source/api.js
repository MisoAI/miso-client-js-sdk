import { mapAsyncIterator } from '@miso.ai/commons';
import { ROLE } from '../constants';

export default function(client) {
    // TODO: send uuid & unit id
    return async ({ group, name, payload }) => {
    switch (group) {
      case 'ask':
        switch (name) {
          case 'questions':
            return mapAsyncIterator(client.api[group][name](payload, { iterable: true }), postProcessQuestions);
        }
    }
    return postProcess(await client.api[group]._run(name, payload));
  };
}

function postProcess(response) {
  // TODO: more API types
  // search, u2p, p2p
  return {
    [ROLE.RESULTS]: response.products,
  };
}

function postProcessQuestions(response) {
  const _meta = {
    answer_stage: response.answer_stage,
  };
  return { ...response, _meta };
}
