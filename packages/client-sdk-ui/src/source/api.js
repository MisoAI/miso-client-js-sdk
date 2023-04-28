import { ROLE } from '../constants';

export default function(client) {
    // TODO: send uuid & unit id
    return async ({ group, name, payload }) => {
    switch (group) {
      case 'answers':
        switch (name) {
          case 'answer':
            return client.api.answers.answer(payload, { iterable: true });
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
