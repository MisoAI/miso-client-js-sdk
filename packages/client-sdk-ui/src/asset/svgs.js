import version from '../version.js';

const PREFIX = 'miso-ui-icon';
const ID = `${PREFIX}-svg-${version.replaceAll('.', '_')}`;

// all are CC0 SVGs
const ICON_SEND = `<symbol id="${PREFIX}-send" viewBox="0 0 32 32"><path fill="currentColor" d="M11.499,19.173l5.801,-5.849c0.389,-0.392 1.022,-0.394 1.414,-0.006c0.392,0.389 0.395,1.022 0.006,1.414l-5.798,5.847l5.306,8.002c0.207,0.313 0.572,0.483 0.945,0.441c0.373,-0.042 0.691,-0.289 0.824,-0.64l9.024,-23.904c0.138,-0.366 0.05,-0.78 -0.226,-1.058c-0.276,-0.278 -0.689,-0.369 -1.057,-0.233l-24.004,8.892c-0.353,0.13 -0.602,0.448 -0.646,0.821c-0.044,0.373 0.125,0.74 0.438,0.948l7.973,5.325Z"/></symbol>`;
const ICON_SEARCH = `<symbol id="${PREFIX}-search" viewBox="0 0 24 24"><path fill="currentColor" d="M4 11C4 7.13401 7.13401 4 11 4C14.866 4 18 7.13401 18 11C18 14.866 14.866 18 11 18C7.13401 18 4 14.866 4 11ZM11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20C13.125 20 15.078 19.2635 16.6177 18.0319L20.2929 21.7071C20.6834 22.0976 21.3166 22.0976 21.7071 21.7071C22.0976 21.3166 22.0976 20.6834 21.7071 20.2929L18.0319 16.6177C19.2635 15.078 20 13.125 20 11C20 6.02944 15.9706 2 11 2Z"/></symbol>`;

const ICONS = [ICON_SEND, ICON_SEARCH];

const SPRITES_SVG = `<svg id="${ID}" style="display:none;">${ICONS.join('')}</svg>`;

let loaded = false;

function loadSvgSprites() {
  if (loaded || document.head.querySelector(`#${ID}`)) {
    return;
  }
  loaded = true;
  document.head.insertAdjacentHTML('beforeend', SPRITES_SVG);
}

loadSvgSprites();

function getSvg(name) {
  return `<svg class="miso-ui-icon miso-ui-icon-${name}"><use href="#${PREFIX}-${name}"></use></svg>`;
}

export const SEND = getSvg('send');
export const SEARCH = getSvg('search');
