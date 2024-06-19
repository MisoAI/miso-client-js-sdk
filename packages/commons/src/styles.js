import version from './version.js';

const { currentScript } = document;

export async function loadStyles(url) {
  try {
    let link = getExistedLinkElement(url);
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      document.head.appendChild(link);
    }
    return waitForStylesApplied(link);
  } catch(e) {
    console.error(e);
  }
}

export function resolveCssUrl(name) {
  // TODO: refactor with getPluginScriptUrl() in core
  if (version === 'dev') {
    const src = currentScript.src;
    const searchIndex = src.indexOf('?');
    const k = searchIndex < 0 ? src.length : searchIndex;
    const i = src.lastIndexOf('/', k); // .../dist/umd/*.min.js
    return `${src.slice(0, i - 4)}/css/${name}.css`;
  } else {
    return `https://cdn.jsdelivr.net/npm/@miso.ai/client-sdk@${version}/dist/css/${name}.css`;
  }
}



// helpers //
function getExistedLinkElement(url) {
  return document.head.querySelector(`link[href="${url}"]`);
}

async function waitForStylesApplied(element) {
  await waitForSheetAvailable(element);
  await waitForSheetIncluded(element);
}

async function waitForSheetAvailable(element) {
  if (element.sheet) {
    return;
  }
  return new Promise((resolve, reject) => {
    let intervalId;
    element.onerror = () => {
      intervalId && clearInterval(intervalId);
      reject();
    };
    intervalId = setInterval(() => {
      if (!element.sheet) {
        return;
      }
      intervalId && clearInterval(intervalId);
      resolve();
  }, 100);
  });
}

async function waitForSheetIncluded(element) {
  if (isSheetIncluded(element)) {
    return;
  }
  return new Promise((resolve) => {
    let intervalId;
    intervalId = setInterval(() => {
      if (!isSheetIncluded(element)) {
        return;
      }
      intervalId && clearInterval(intervalId);
      resolve();
  }, 100);
  });
}

function isSheetIncluded(element) {
  for (const sheet of document.styleSheets) {
    if (sheet.ownerNode === element) {
      return true;
    }
  }
  return false;
}
