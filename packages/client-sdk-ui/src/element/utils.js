let MisoClientPromise, clientPromise, client;

export async function getClient(ElementClass) {
  const MisoClient = await getMisoClient(ElementClass);
  clientPromise = clientPromise || MisoClient.any();
  client = client || await clientPromise;
  if (!client.ui) {
    await timeout(0);
  }
  return client;
}

export async function getMisoClient(ElementClass) {
  // TODO: ElementClass.MisoClient should be enough
  return ElementClass.MisoClient || window.MisoClient || MisoClientPromise || (MisoClientPromise = waitForMisoClient());
}

async function waitForMisoClient() {
  return new Promise((resolve) => {
    const misocmd = window.misocmd || (window.misocmd = []);
    misocmd.push(() => resolve(window.MisoClient));
  });
}

export function getContainer(element) {
  for (let node = element; node; node = node.parentNode) {
    if (node.isContainer) {
      return node;
    }
  }
  throw new Error(`${element.tagName} needs to be placed under a workflow container element.`);
}

function timeout(duration) {
  return new Promise(resolve => setTimeout(resolve, duration));
}

export function applyCoerce({ type, coerce, defaultValue }, str) {
  coerce = getCoerceFunction(type, coerce);
  const value = coerce(str);
  return (value === undefined || value === null) && defaultValue !== undefined ? defaultValue : value;
}

function getCoerceFunction(type = 'default', coerce) {
  if (typeof coerce === 'function') {
    return coerce;
  }
  switch (type) {
    case 'boolean':
      return coerceBoolean;
    case 'number':
      return coerceNumber;
    case 'string':
      return coerceString;
    default:
      return coerceDefault;
  }
}

function coerceBoolean(str) {
  return str === 'true' || (str !== 'false' && str);
}

function coerceNumber(str) {
  const num = Number(str);
  return isNaN(num) ? undefined : num;
}

function coerceString(str) {
  return str;
}

function coerceDefault(str) {
  if (str === 'true') {
    return true;
  }
  if (str === 'false') {
    return false;
  }
  const num = Number(str);
  if (!isNaN(num)) {
    return num;
  }
  return str;
}
