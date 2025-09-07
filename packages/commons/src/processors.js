import { trimObj } from './objects.js';

export function mergeApiPayloads(base = {}, patch = {}) {
  const metadata = (base.metadata || patch.metadata) ? trimObj({
    ...base.metadata,
    ...patch.metadata,
  }) : undefined;
  // we still want to keep this, in case users rely on _meta in eariler version
  const _meta = (base._meta || patch._meta) ? trimObj({
    ...base._meta,
    ...patch._meta,
  }) : undefined;
  return trimObj({
    ...base,
    ...patch,
    metadata,
    _meta,
  });
}

export function mergeInteractions(base = {}, patch = {}) {
  const custom_context = (base.context && base.context.custom_context) || (patch.context && patch.context.custom_context) ? trimObj({
    ...(base.context && base.context.custom_context),
    ...(patch.context && patch.context.custom_context),
  }) : undefined;
  const context = (base.context || patch.context) ? trimObj({
    ...base.context,
    ...patch.context,
    custom_context,
  }) : undefined;
  return trimObj({
    ...base,
    ...patch,
    context,
  });
}
