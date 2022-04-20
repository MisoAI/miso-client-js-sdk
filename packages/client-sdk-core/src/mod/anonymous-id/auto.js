import { uuidv4 } from '@miso.ai/commons';

const SESSION_KEY = 'miso-anonymous-id';

export default function AutomaticAnonymousIdManager() {
  let id = window.sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    window.sessionStorage.setItem(SESSION_KEY, (id = uuidv4()));
  }
  return Object.freeze({ id });
}
