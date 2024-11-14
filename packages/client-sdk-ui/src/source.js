import { API } from '@miso.ai/commons';

export function api(client) {
  // TODO: send uuid & unit id
  return async ({ group, name, payload, options }) => {
    if (group === API.GROUP.ASK) {
      switch (name) {
        case API.NAME.QUESTIONS:
          return client.api.ask.questions(payload, options);
        case API.NAME.SEARCH:
          return client.api.ask.search(payload, options);
      }
    }
    // because name is in snake case
    return client.api[group]._run(name, payload, options);
  };
}
