const DEFAULT_SPEED = 100; // characters per second
const DEFAULT_ACCELERATION = 4; // characters per second^2

export default function pacer(options) {
  const speedFn = normalizeSpeedFunction(options);
  return (previousCursor, doneAt, previousTimestamp, newTimestamp) => {
    const cps = speedFn(previousTimestamp, doneAt);
    return previousCursor + (Math.max(newTimestamp - previousTimestamp, 0) * cps / 1000);
  };
}

function normalizeSpeedFunction({ speed = DEFAULT_SPEED, acceleration = DEFAULT_ACCELERATION } = {}) {
  if (typeof speed === 'function') {
    return speed;
  }
  if (typeof speed !== 'number') {
    throw new Error(`Invalid speed: ${speed}`);
  }
  if (typeof acceleration !== 'number') {
    throw new Error(`Invalid acceleration: ${acceleration}`);
  }
  return (timestamp, doneAt) => {
    let value = speed * (Math.random() + 0.5);
    if (acceleration > 0 && doneAt !== undefined && timestamp > doneAt) {
      // speed up gradually when input is done
      value *= 1 + ((timestamp - doneAt) * acceleration / 1000);
    }
    return value;
  };
}
