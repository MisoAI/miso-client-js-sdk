export function debounce(delay) {
  let timeoutId;
  return (callback) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = undefined;
      callback();
    }, delay);
  };
}
