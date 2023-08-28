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

export function product(layout, state, data) {
  const [openTag, closeTag] = renderTagPair(layout, data);
  const imgBox = renderImgBox(layout, data);
  const infoBox = renderInfoBox(layout, data);
  return `${openTag}${imgBox}${infoBox}${closeTag}`;
}

export function source(layout, state, data, { index }) {
  const [openTag, closeTag] = renderTagPair(layout, data);
  const imgBox = renderImgBox(layout, data);
  const infoBox = renderInfoBox(layout, data);
  return `${openTag}${imgBox}${infoBox}${closeTag}`;
}

function renderTagPair({ className }, { product_id, url }) {
  const openTag = url ? `<a class="${className}__item-body" ${ATTR_DATA_MISO_PRODUCT_ID}="${product_id}" href="${url}" target="_blank" rel="noopener">` : `<div class="${className}__item-body">`;
  const clostTag = url ? `</a>` : `</div>`;
  return [openTag, clostTag];
}

function renderImgBox({ className }, { cover_image }) {
  if (!cover_image) {
    return '';
  }
  const img = `<img class="${className}__item-cover-image" src="${cover_image}">`;
  return `<div class="${className}__item-cover-image-container">${img}</div>`;
}

function renderInfoBox({ className }, { title, snippet, description, sale_price, original_price }) {
  let infoContent = '';
  if (title) {
    infoContent += `<div class="${className}__item-title">${title}</div>`;
  }
  if (snippet) {
    infoContent += `<div class="${className}__item-snippet">${snippet}</div>`;
  } else if (description) {
    infoContent += `<div class="${className}__item-desc">${description}</div>`;
  }
  const price = sale_price || original_price;
  if (price) {
    infoContent += `<hr><div class="${className}__item-price">${price}</div>`;
    // TODO: enhance this
  }
  return `<div class="${className}__item-info-container">${infoContent}</div>`;
}
