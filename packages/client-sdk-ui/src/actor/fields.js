export function session() {
  return 'session';
}

export function query() {
  return 'query';
}

export function input() {
  return 'input';
}

export function data() {
  return 'data';
}

export function view(role) {
  return role ? `view:${role}` : 'view';
}

export function event() {
  return 'event';
}
