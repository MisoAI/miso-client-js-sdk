import BasicStore from './basic.mjs';
import hydrate from './mock.mjs'

export default function createStore() {
  const catalog = new BasicStore();
  const user = new BasicStore();
  const interaction = new BasicStore();
  return hydrate({catalog, user, interaction});
}
