import version from './version.js';

const { currentScript } = document;

let cssUrl;
let stylesLoaded;

export async function loadStylesIfNecessary() {
  return stylesLoaded || (stylesLoaded = loadStyles());
}

export async function loadStyles() {
  try {
    let link = getExistedLinkElement();
    if (link) {
      return waitForLinkLoaded(link)
    }
    link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = getCssUrl();
    return new Promise((resolve, reject) => {
      link.onload = resolve;
      link.onerror = reject;
      document.head.appendChild(link);
    });
  } catch(e) {
    console.error(e);
  }
}

// helpers //
function getCssUrl() {
  return cssUrl || (cssUrl = resolveCssUrl());
}

function resolveCssUrl() {
  // TODO: refactor with getPluginScriptUrl() in core
  if (version === 'dev') {
    const src = currentScript.src;
    const searchIndex = src.indexOf('?');
    const k = searchIndex < 0 ? src.length : searchIndex;
    const i = src.lastIndexOf('/', k); // .../dist/umd/*.min.js
    return `${src.slice(0, i - 4)}/css/ui.css`;
  } else {
    return `https://cdn.jsdelivr.net/npm/@miso.ai/client-sdk@${version}/dist/css/ui.css`;
  }
}

function getExistedLinkElement() {
  return document.head.querySelector(`link[href="${getCssUrl()}"]`);
}

async function waitForLinkLoaded(element) {
  if (element.sheet) {
    return;
  }
  return new Promise((resolve, reject) => {
    let intervalId;
    element.onload = () => {
      intervalId && clearInterval(intervalId);
      resolve();
    };
    element.onerror = () => {
      intervalId && clearInterval(intervalId);
      reject();
    };
    intervalId = setInterval(() => {
      if (element.sheet) {
        intervalId && clearInterval(intervalId);
        resolve();
      }
    }, 100);
  });
}
