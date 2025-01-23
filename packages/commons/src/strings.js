export function kebabToLowerCamel(str) {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

export function snakeToLowerCamel(str) {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

export function kebabOrSnakeToLowerCamel(str) {
  return str.replace(/[-_][a-z]/g, (g) => g[1].toUpperCase());
}

export function lowerCamelToKebab(str) {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

export function lowerCamelToSnake(str) {
  return str.replace(/[A-Z]/g, ch => `_${ch.toLowerCase()}`);
}

export function kebabToSnake(str) {
  return str.replaceAll('-', '_');
}

export function kebabOrSnakeToHuman(str) {
  return str.replace(/[-_][a-zA-Z]/g, ' $1');
}
