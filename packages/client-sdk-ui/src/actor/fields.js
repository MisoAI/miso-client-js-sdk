export function session() {
  return 'session';
}

export function suggestions() {
  return 'suggestions';
}

export function query() {
  return 'query';
}

export function request(aspect) {
  return aspect ? `request:${aspect}` : 'request';
}

export function response(aspect) {
  return aspect ? `response:${aspect}` : 'response';
}

export function data(aspect) {
  return aspect ? `data:${aspect}` : 'data';
}

export function view(role) {
  return role ? `view:${role}` : 'view';
}

export function event() {
  return 'event';
}

export function tracker() {
  return 'tracker';
}

export function interaction() {
  return 'interaction';
}

export function feedback() {
  return 'feedback';
}

export function input() {
  return 'input';
}
