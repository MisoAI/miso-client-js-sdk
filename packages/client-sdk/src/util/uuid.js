export default function() {
  if (crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  const tempUrl = URL.createObjectURL(new Blob());
  const uuid = tempUrl.toString();
  URL.revokeObjectURL(tempUrl);
  // remove prefix (e.g. blob:null/, blob:www.test.com/, ...)
  return uuid.substring(uuid.lastIndexOf('/') + 1);
}
