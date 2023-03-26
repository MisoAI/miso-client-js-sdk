import { ATTR_DATA_MISO_PRODUCT_ID } from '../constants';

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

export function product(layout, state, { product_id, url, cover_image, title, description, sale_price, original_price, ...product }) {
  const { className } = layout;
  const openTag = url ? `<a class="${className}__item-body" ${ATTR_DATA_MISO_PRODUCT_ID}="${product_id}" href="${url}" target="_blank" rel="noopener">` : `<div class="${className}__item-body">`;
  const clostTag = url ? `</a>` : `</div>`;

  const img = cover_image ? `<img class="${className}__item-cover-image" src="${cover_image}">` : '';
  const imgBox = `<div class="${className}__item-cover-image-container">${img}</div>`;

  let infoContent = '';
  if (title) {
    infoContent += `<div class="${className}__item-title">${title}</div>`;
  }
  if (description) {
    infoContent += `<div class="${className}__item-desc">${description}</div>`;
  }
  const price = sale_price || original_price;
  if (price) {
    infoContent += `<hr><div class="${className}__item-price">${price}</div>`;
    // TODO: enhance this
  }
  const infoBox = `<div class="${className}__item-info-container">${infoContent}</div>`;

  return `${openTag}${imgBox}${infoBox}${clostTag}`;
}
