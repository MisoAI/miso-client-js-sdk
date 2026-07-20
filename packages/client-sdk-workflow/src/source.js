import { API } from '@miso.ai/commons';

export function api(client) {
  return async ({ group, name, payload, options }) => {
    if (group === API.GROUP.ASK) {
      switch (name) {
        case API.NAME.QUESTIONS:
          return client.api.ask.questions(payload, options);
        case API.NAME.SEARCH:
          return client.api.ask.search(payload, options);
        case API.NAME.ANSWERS:
          return client.api.ask.answers(payload, options);
      }
    }
    if (group === API.GROUP.ASK_USER_HISTORY) {
      // the group is not a direct property of client.api, and name may carry a path (e.g. `threads/${id}`)
      return client.api.ask.userHistory._run(name, payload, options);
    }
    // because name is in snake case
    return client.api[group]._run(name, payload, options);
  };
}
