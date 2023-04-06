import { ROLE } from '../constants';

export default function(client) {
  return async ({ group, name, payload }) => {
    // TODO: send uuid
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
