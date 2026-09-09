export function session() {
  return 'session';
}

export function completions() {
  return 'completions';
}

export function filters() {
  return 'filters';
}

export function query() {
  return 'query';
}

export function request() {
  return 'request';
}

export function response() {
  return 'response';
}

// a response arriving after its session expired (trigger-only, not persisted)
export function expiredResponse() {
  return 'expired-response';
}

// a thread operation fact (trigger-only, not persisted): triggered off a
// operation request, on the initiating chat-history panel's hub and its
// peer's alike
export function thread() {
  return 'thread';
}

export function data() {
  return 'data';
}

export function view(role) {
  return role ? `view:${role}` : 'view';
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

export function more() {
  return 'more';
}
