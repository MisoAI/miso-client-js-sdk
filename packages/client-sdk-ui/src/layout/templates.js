import { escapeHtml } from '@miso.ai/commons';
import { ATTR_DATA_MISO_PRODUCT_ID } from '../constants.js';

export function requiresImplementation(...names) {
  return names.reduce((acc, name) => {
    acc[name] = unimplemented(name);
    return acc;
  }, {});
}

export function unimplemented(name) {
  return () => {
    throw new Error(`Template '${name}' is not implemented.`);
  }
}

export function product(layout, state, data, meta) {
  const { templates } = layout;
  const [openTag, closeTag] = tagPair(layout, data);
  return [
    openTag,
    (templates.imageBlock || imageBlock)(layout, data, meta),
    (templates.infoBlock || templates.productInfoBlock || productInfoBlock)(layout, data, meta),
    closeTag,
  ].join('');
}

export function question(layout, state, data) {
  const [openTag, closeTag] = tagPair(layout, data);
  return `${openTag}${data.value || data.text || data}${closeTag}`;
}

export function article(layout, state, data, meta) {
  const { templates } = layout;
  const [openTag, closeTag] = tagPair(layout, data);
  return [
    openTag,
    (templates.imageBlock || imageBlock)(layout, data, meta),
    (templates.infoBlock || templates.articleInfoBlock || articleInfoBlock)(layout, data, meta),
    (templates.indexBlock || indexBlock)(layout, data, meta),
    closeTag,
  ].join('');
}

export function productInfoBlock({ className }, { title, description, sale_price, original_price }) {
  let content = '';
  if (title) {
    content += `<div class="${className}__item-title">${escapeHtml(title)}</div>`;
  }
  if (description) {
    content += `<div class="${className}__item-desc">${escapeHtml(description)}</div>`;
  }
  const price = sale_price || original_price;
  if (price) {
    content += `<hr><div class="${className}__item-price">${price}</div>`;
    // TODO: enhance this
  }
  return `<div class="${className}__item-info-container">${content}</div>`;
}

export function articleInfoBlock({ className, templates }, { title, snippet, description, created_at, updated_at, published_at }) {
  const date = published_at || created_at || updated_at;
  let content = '';
  if (title) {
    content += `<div class="${className}__item-title">${escapeHtml(title)}</div>`;
  }
  if (date) {
    content += `<div class="${className}__item-date">${formatDate(date, templates.date)}</div>`;
  }
  if (snippet) {
    content += `<div class="${className}__item-snippet">${snippet}</div>`;
  } else if (description) {
    content += `<div class="${className}__item-desc">${escapeHtml(description)}</div>`;
  }
  return `<div class="${className}__item-info-container">${content}</div>`;
}

export function imageBlock({ className }, { cover_image }) {
  if (!cover_image) {
    return '';
  }
  const img = `<img class="${className}__item-cover-image" src="${cover_image}">`;
  return `<div class="${className}__item-cover-image-container">${img}</div>`;
}

export function indexBlock({ className }, data, { index }) {
  const i = index + 1;
  return `<div class="${className}__item-index-container"><span class="${className}__item-index miso-citation-index" data-index="${i}"></span></div>`;
}

// helpers //
function tagPair({ className, options = {} }, { product_id, url }, { classSuffix = 'item-body', role = 'item' } = {}) {
  const { link = {} } = options;
  const { target = '_blank', rel = 'noopener' } = link; // TODO: other properties
  const tag = url ? 'a' : 'div';
  const urlAttrs = url ? `href="${url}" target="${target}" rel="${rel}"` : '';
  const productAttrs = product_id ? `${ATTR_DATA_MISO_PRODUCT_ID}="${product_id}"` : '';
  const roleAttrs = role ? `data-role="${role}"` : '';
  return [`<${tag} class="${className}__${classSuffix}" ${roleAttrs} ${productAttrs} ${urlAttrs}>`, `</${tag}>`];
}

const DEFAULT_DATE_OPTIONS = Object.freeze({ locale: 'en-US', year: 'numeric', month: 'short', day: 'numeric' });

function formatDate(date, fn = DEFAULT_DATE_OPTIONS) {
  switch (typeof fn) {
    case 'function':
      return fn(date);
    case 'string':
      return new Date(date).toLocaleDateString(fn);
    case 'object':
      return new Date(date).toLocaleDateString(fn.locale || DEFAULT_DATE_OPTIONS.locale, fn);
    default:
      throw new Error(`Invalid date format: ${fn}`);
  }
}

export const helpers = Object.freeze({
  tagPair,
  formatDate,
  escapeHtml,
});
