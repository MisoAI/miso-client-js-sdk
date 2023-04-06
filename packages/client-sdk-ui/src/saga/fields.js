export function session() {
  return 'session';
}

export function input() {
  return 'input';
}

export function data() {
  return 'data';
}

export function element(role) {
  return role ? `element_${role}` : 'element';
}

export function view(role) {
  return role ? `view_${role}` : 'view';
}

export function event() {
  return 'event';
}
