import { test } from 'uvu';
import * as assert from 'uvu/assert';

import shadow from '../src/filter/shadow';

const sample = 'abc"d\\"e\\"f"\'g\\\'h\\\'i\'';

test('nop', () => {
  assert.equal(shadow(sample).unshadow(), sample);
});
test('apply', () => {
  assert.equal(
    shadow(sample)
      .apply(String.prototype.toUpperCase)
      .unshadow(),
    'ABC"d\\"e\\"f"\'g\\\'h\\\'i\'',
  );
});
