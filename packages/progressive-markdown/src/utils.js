export function mergeRendererOptions(...args) {
  let options = {};
  for (const arg of args) {
    options = mergeTwoRendererOptions(options, arg);
  }
  return options;
}

function mergeTwoRendererOptions(base = {}, overrides = {}) {
  return trimObj({
    ...base,
    ...overrides,
    parser: trimObj({ ...base.parser, ...overrides.parser }),
    compiler: trimObj({ ...base.compiler, ...overrides.compiler }),
    query: trimObj({ ...base.query, ...overrides.query }),
  });
}

function trimObj(obj) {
  const trimmed = {};
  let nonEmpty = false;
  for (const k in obj) {
    const v = obj[k];
    if (v !== undefined) {
      trimmed[k] = v;
      nonEmpty = true;
    }
  }
  return nonEmpty ? trimmed : undefined;
}
