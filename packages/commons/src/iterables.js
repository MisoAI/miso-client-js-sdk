export async function * mapAsyncIterator(iterator, fn) {
  for await (const value of iterator) {
    yield fn(value);
  }
}

export function * mapIterator(iterator, fn) {
  for (const value of iterator) {
    yield fn(value);
  }
}
