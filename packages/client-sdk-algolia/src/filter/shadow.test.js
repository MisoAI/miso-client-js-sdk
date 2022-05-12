import shadow from './shadow';

const sample = 'abc"d\\"e\\"f"\'g\\\'h\\\'i\'';

describe('shadow', () => {
  it('nop', () => {
    expect(shadow(sample).unshadow()).toBe(sample);
  });
  it('apply', () => {
    expect(
      shadow(sample)
        .apply(String.prototype.toUpperCase)
        .unshadow()
    ).toBe('ABC"d\\"e\\"f"\'g\\\'h\\\'i\'');
  });
});
