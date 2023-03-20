export function randomInt(min, max) {
  return max > min ? min + Math.floor(Math.random() * (max - min)) : min;
}

export function repeat(fn, min = 1, max = 2) {
  const n = randomInt(min, max);
  const result = [];
  for (let i = 0; i < n; i++) {
    result.push(fn());
  }
  return result;
}

export function id() {
  return Math.random().toString(36).substring(2, 10);
}

export function availability() {
  return Math.random() > 0.3 ? 'IN_STOCK' : 'OUT_OF_STOCK';
}

export function price() {
  return Math.floor(Math.random() * 10000) / 100;
}

export function rating() {
  return Math.floor(Math.random() * 500) / 100 + 1;
}
