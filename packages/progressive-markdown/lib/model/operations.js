import Operation from './operation.js';

export function optimizeOperations(operations) {
  return mergeOperations(operations);
}

function mergeOperations(operations) {
  const output = [];
  let lastOperation = undefined;
  for (const operation of operations) {
    const { type, level, html } = operation;
    switch (type) {
      case Operation.TYPE.APPEND:
        if (!html) {
          continue;
        }
        break;
      case Operation.TYPE.ASCEND:
      case Operation.TYPE.DESCEND:
        if (level === 0) {
          continue;
        }
        break;
    }
    if (lastOperation && type === lastOperation.type) {
      switch (type) {
        case Operation.TYPE.SET:
        case Operation.TYPE.SOLIDIFY:
          lastOperation.html = html; // idempotent
          break;
        case Operation.TYPE.APPEND:
          lastOperation.html += html;
          break;
        case Operation.TYPE.ASCEND:
        case Operation.TYPE.DESCEND:
          lastOperation.level += level;
          break;
      }
    } else {
      output.push(operation);
      lastOperation = operation;
    }
  }
  return output;
}
