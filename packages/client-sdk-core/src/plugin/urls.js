export function getPluginScriptUrl(id, version, currentScript) {
  // TODO: look up by manifest
  const pkgName = id.slice(4);
  
  if (version === 'dev') {
    const src = currentScript.src;
    const searchIndex = src.indexOf('?');
    const k = searchIndex < 0 ? src.length : searchIndex;
    const i = src.lastIndexOf('/', k) + 1;
    const j = src.indexOf('.', i);
    const ext = j < 0 ? '' : src.slice(j, k); // .min.js or .js
    return `${src.slice(0, i)}plugins/${pkgName}${ext}`;
  } else {
    return `https://cdn.jsdelivr.net/npm/@miso.ai/client-sdk@${version}/dist/umd/plugins/${pkgName}.min.js`;
  }
}
