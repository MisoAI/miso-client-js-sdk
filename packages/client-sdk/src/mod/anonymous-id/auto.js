import uuid from '../../util/uuid';

const SESSION_KEY = 'miso-anonymous-id';

export default function AutomaticAnonymousIdManager() {
  let id = window.sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    window.sessionStorage.setItem(SESSION_KEY, (id = uuid()));
  }
  return Object.freeze({ id });
}
