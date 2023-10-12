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
  const [openTag, closeTag] = renderTagPair(layout, data);
  return [
    openTag,
    (templates.indexBlock || renderIndexBlock)(layout, data, meta),
    (templates.imageBlock || renderImageBlock)(layout, data, meta),
    (templates.infoBlock || productInfoBlock)(layout, data, meta),
    closeTag,
  ].join('');
}

export function question(layout, state, data) {
  const [openTag, closeTag] = renderTagPair(layout, data);
  return `${openTag}${data.value || data.text || data}${closeTag}`;
}

export function article(layout, state, data, meta) {
  const { templates } = layout;
  const [openTag, closeTag] = renderTagPair(layout, data);
  return [
    openTag,
    (templates.indexBlock || renderIndexBlock)(layout, data, meta),
    (templates.imageBlock || renderImageBlock)(layout, data, meta),
    (templates.infoBlock || articleInfoBlock)(layout, data, meta),
    closeTag,
  ].join('');
}

function productInfoBlock({ className }, { title, snippet, description, sale_price, original_price }) {
  let content = '';
  if (title) {
    content += `<div class="${className}__item-title">${title}</div>`;
  }
  if (description) {
    content += `<div class="${className}__item-desc">${description}</div>`;
  }
  const price = sale_price || original_price;
  if (price) {
    content += `<hr><div class="${className}__item-price">${price}</div>`;
    // TODO: enhance this
  }
  return `<div class="${className}__item-info-container">${content}</div>`;
}

function articleInfoBlock({ className, templates }, { title, snippet, description, created_at, updated_at, published_at }) {
  const date = updated_at || published_at || created_at;
  let content = '';
  if (title) {
    content += `<div class="${className}__item-title">${title}</div>`;
  }
  if (date) {
    content += `<div class="${className}__item-date">${(templates.date || renderDate)(date)}</div>`;
  }
  if (snippet) {
    content += `<div class="${className}__item-snippet">${snippet}</div>`;
  } else if (description) {
    content += `<div class="${className}__item-desc">${description}</div>`;
  }
  return `<div class="${className}__item-info-container">${content}</div>`;
}

// helpers //
function renderTagPair({ className }, { product_id, url }) {
  const tag = url ? 'a' : 'div';
  const urlAttrs = url ? `href="${url}" target="_blank" rel="noopener"` : '';
  const productAttrs = product_id ? `${ATTR_DATA_MISO_PRODUCT_ID}="${product_id}"` : '';
  return [`<${tag} class="${className}__item-body" data-role="item" ${productAttrs} ${urlAttrs}>`, `</${tag}>`];
}

function renderImageBlock({ className }, { cover_image }) {
  if (!cover_image) {
    return '';
  }
  const img = `<img class="${className}__item-cover-image" src="${cover_image}">`;
  return `<div class="${className}__item-cover-image-container">${img}</div>`;
}

function renderIndexBlock({ className }, data, { index }) {
  const i = index + 1;
  return `<div class="${className}__item-index" data-index="${i}"></div>`;
}

function renderDate(date) {
  return new Date(date).toLocaleDateString();
}
