export function uuidv4() {
  return uuidv4ByCyrptoRandomUUID() || uuidv4ByBlobUrl() || uuidv4ByMathRandom();
}

function uuidv4ByCyrptoRandomUUID() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined;
}

function uuidv4ByBlobUrl() {
  if (typeof URL === 'undefined' || !URL.createObjectURL || !URL.revokeObjectURL || typeof Blob === 'undefined') {
    return undefined;
  }
  const url = URL.createObjectURL(new Blob());
  const uuid = url.toString();
  URL.revokeObjectURL(url);
  // remove prefix (e.g. blob:null/, blob:www.test.com/, ...)
  return uuid.substring(uuid.lastIndexOf('/') + 1);
}

// TODO: this is a badly performant fallback
function uuidv4ByMathRandom() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}
