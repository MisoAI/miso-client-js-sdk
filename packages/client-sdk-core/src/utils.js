import { ContinuityObserver, asElement } from '@miso.ai/commons';

export async function viewable(element, {
  area = 0.5,
  duration = 1000,
  signal,
} = {}) {
  element = asElement(element);
  // TODO: check element
  return new Promise((resolve) => {
    const continuity = new ContinuityObserver((value) => {
      if (value) {
        continuity.disconnect();
        intersection.disconnect();
        resolve();
      }
    }, {
      onDuration: duration,
    });
    const intersection = new IntersectionObserver((entries) => {
      continuity.value = entries[0].isIntersecting;
    }, {
      threshold: area,
    });
    intersection.observe(element);

    if (signal && signal.addEventListener) {
      signal.addEventListener('abort', () => {
        continuity.disconnect();
        intersection.disconnect();
      });
    }
  });
}
