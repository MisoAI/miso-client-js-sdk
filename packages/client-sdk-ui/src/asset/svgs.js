import version from '../version.js';

function trianglePath(r) {
  const l = 100;
  const d = r * Math.tan(3 * Math.PI / 8);
  const e = d * Math.sin(Math.PI / 4);
  return `M${r} 0L${l-d} 0A${r} ${r} 0 0 1 ${l-e} ${e}L${e} ${l-e}A${r} ${r} 0 0 1 0 ${l-d}L0 ${r}Z`;
}

const PREFIX = 'miso-ui-icon';
const ID = `${PREFIX}-svg-${version.replaceAll('.', '_')}`;

const ICON_NAME = {
  SEND: 'send',
  SEARCH: 'search',
  TRIANGLE: 'triangle',
  TRIANGLE_EQ: 'triangle-eq',
  CHEVRON: 'chevron',
  CHEVRON_NEGATIVE: 'chevron-negative',
  BULB: 'bulb',
};

// CC0 SVGs
const ICON_SEND = `<symbol id="${PREFIX}-${ICON_NAME.SEND}" viewBox="0 0 32 32"><path fill="currentColor" d="M11.499,19.173l5.801,-5.849c0.389,-0.392 1.022,-0.394 1.414,-0.006c0.392,0.389 0.395,1.022 0.006,1.414l-5.798,5.847l5.306,8.002c0.207,0.313 0.572,0.483 0.945,0.441c0.373,-0.042 0.691,-0.289 0.824,-0.64l9.024,-23.904c0.138,-0.366 0.05,-0.78 -0.226,-1.058c-0.276,-0.278 -0.689,-0.369 -1.057,-0.233l-24.004,8.892c-0.353,0.13 -0.602,0.448 -0.646,0.821c-0.044,0.373 0.125,0.74 0.438,0.948l7.973,5.325Z"/></symbol>`;
const ICON_SEARCH = `<symbol id="${PREFIX}-${ICON_NAME.SEARCH}" viewBox="0 0 24 24"><path fill="currentColor" d="M4 11C4 7.13401 7.13401 4 11 4C14.866 4 18 7.13401 18 11C18 14.866 14.866 18 11 18C7.13401 18 4 14.866 4 11ZM11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20C13.125 20 15.078 19.2635 16.6177 18.0319L20.2929 21.7071C20.6834 22.0976 21.3166 22.0976 21.7071 21.7071C22.0976 21.3166 22.0976 20.6834 21.7071 20.2929L18.0319 16.6177C19.2635 15.078 20 13.125 20 11C20 6.02944 15.9706 2 11 2Z"/></symbol>`;

// Custom SVGs
const ICON_TRIANGLE = `<symbol id="${PREFIX}-${ICON_NAME.TRIANGLE}" viewBox="-5 -5 105 105"><path d="${trianglePath(5)}"/></symbol>`;
const ICON_TRIANGLE_EQ = `<symbol id="${PREFIX}-${ICON_NAME.TRIANGLE_EQ}" viewBox="-100 -100 200 200"><path d="M12.99 -77.5A15 15,0,0,0,-12.99 -77.5L-73.61 27.5A15 15,0,0,0,-60.62 50L60.62 50A15 15,0,0,0,73.61 27.5L12.99 -77.5Z"/></symbol>`;
const ICON_CHEVRON = `<symbol id="${PREFIX}-${ICON_NAME.CHEVRON}" viewBox="-100 -100 200 200"><path d="M10.61 -43.94A15 15,0,0,0,-10.61 -43.94L-60.61 6.06A15 15,0,0,0,-39.39 27.27L0 -12.12L39.39 27.27A15 15,0,0,0,60.61 6.06L10.61 -43.94Z"/></symbol>`;
const ICON_CHEVRON_NEGATIVE = `<symbol id="${PREFIX}-${ICON_NAME.CHEVRON_NEGATIVE}" viewBox="-100 -100 200 200"><path d="M100 100V-200H-200V200H200ZM-10.61 -43.94A15 15,0,0,1,10.61 -43.94L60.61 6.06A15 15,0,0,1,39.39 27.27L0 -12.12L-39.39 27.27A15 15,0,0,1,-60.61 6.06L-10.61 -43.94Z"/></symbol>`;

// from Bootstrap Icons (MIT)
const ICON_BULB = `<symbol id="${PREFIX}-${ICON_NAME.BULB}" viewBox="0 0 16 16"><path d="M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13a.5.5 0 0 1 0 1 .5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1 0-1 .5.5 0 0 1 0-1 .5.5 0 0 1-.46-.302l-.761-1.77a2 2 0 0 0-.453-.618A5.98 5.98 0 0 1 2 6m6-5a5 5 0 0 0-3.479 8.592c.263.254.514.564.676.941L5.83 12h4.342l.632-1.467c.162-.377.413-.687.676-.941A5 5 0 0 0 8 1"/></symbol>`;

const ICONS = [ICON_SEND, ICON_SEARCH, ICON_TRIANGLE, ICON_TRIANGLE_EQ, ICON_CHEVRON, ICON_CHEVRON_NEGATIVE, ICON_BULB];

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

function _icon(name) {
  return `<svg class="miso-ui-icon miso-ui-icon-${name}"><use href="#${PREFIX}-${name}"></use></svg>`;
}

export const ICON_NAMES = new Set(Object.values(ICON_NAME));

export function getIcon(name) {
  return ICON_NAMES.has(name) ? _icon(name) : '';
}

export const SEND = _icon(ICON_NAME.SEND);
export const SEARCH = _icon(ICON_NAME.SEARCH);
export const TRIANGLE = _icon(ICON_NAME.TRIANGLE);
export const TRIANGLE_EQ = _icon(ICON_NAME.TRIANGLE_EQ);
export const CHEVRON = _icon(ICON_NAME.CHEVRON);
export const CHEVRON_NEGATIVE = _icon(ICON_NAME.CHEVRON_NEGATIVE);
export const BULB = _icon(ICON_NAME.BULB);
