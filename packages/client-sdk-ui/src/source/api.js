import { API } from '@miso.ai/client-sdk-core';

export default function(client) {
  // TODO: send uuid & unit id
  return async ({ group, name, payload, options }) => {
    if (group === API.GROUP.ASK && name === API.NAME.QUESTIONS) {
      return client.api.ask.questions(payload, options);
    }
    // because name is in snake case
    return client.api[group]._run(name, payload, options);
  };
}
