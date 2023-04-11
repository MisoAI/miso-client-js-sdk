import * as u from './utils.mjs';
import * as lorem from './lorem.mjs';

export function *articles({ rows, ...options } = {}) {
  for (let i = 0; i < rows; i++) {
    yield article({ ...options, index: i });
  }
}

function article({} = {}) {
  const id = u.id();
  const prices = u.repeat(u.price, 1, 2);
  prices.sort();
  const seed = Math.floor(Math.random() * 1000);

  return {
    product_id: id,
    authors: lorem.lorem({
      min: 1,
      max: 3,
      fixedStarts: 0,
      decorates: ['title'],
      output: 'array',
    }),
    categories: [],
    tags: lorem.lorem({
      min: 1,
      max: 4,
      fixedStarts: 0,
      output: 'array',
    }),
    title: lorem.lorem({
      min: 4,
      max: 10,
      fixedStarts: 0,
      decorates: ['title'],
    }),
    description: lorem.lorem({
      min: 20,
      max: 40,
      decorates: ['description'],
    }),
    //html,
    cover_image: `https://picsum.photos/seed/${seed}/300`,
    url: `/products/${id}`,
  };
}
