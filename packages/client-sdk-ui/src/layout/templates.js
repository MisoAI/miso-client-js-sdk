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

export function affiliation(layout, state, data, meta) {
  const { templates } = layout;
  const [openTag, closeTag] = tagPair(layout, data, { link: false});
  return [
    openTag,
    (templates.infoBlock || templates.affiliationInfoBlock || affiliationInfoBlock)(layout, data, meta),
    (templates.imageBlock || imageBlock)(layout, data, { brand: true, ...meta, }),
    closeTag,
  ].join('');
}

export function affiliationInfoBlock(layout, data, meta) {
  const { className, templates } = layout;
  return `<div class="${className}__item-info-container">${[
    (templates.titleBlock || titleBlock)(layout, data, meta),
    (templates.descriptionBlock || descriptionBlock)(layout, data, meta),
    (templates.priceBlock || priceBlock)(layout, data, meta),
    (templates.ctaBlock || ctaBlock)(layout, data, meta),
  ].join('')}</div>`;
}

export function productInfoBlock(layout, data, meta) {
  const { className, templates } = layout;
  return `<div class="${className}__item-info-container">${[
    (templates.titleBlock || titleBlock)(layout, data, meta),
    (templates.descriptionBlock || descriptionBlock)(layout, data, meta),
    (templates.priceBlock || priceBlock)(layout, data, meta),
  ].join('')}</div>`;
}

export function articleInfoBlock(layout, data, meta) {
  const { className, templates } = layout;
  return `<div class="${className}__item-info-container">${[
    (templates.titleBlock || titleBlock)(layout, data, meta),
    (templates.dateBlock || dateBlock)(layout, data, meta),
    (templates.descriptionBlock || descriptionBlock)(layout, data, meta),
    (templates.ctaBlock || ctaBlock)(layout, data, meta),
  ].join('')}</div>`;
}

export function titleBlock({ className }, { title }) {
  return title ? `<div class="${className}__item-title">${escapeHtml(title)}</div>` : '';
}

export function brandBlock({ className }, { brand, brand_logo }) {
  if (!brand && !brand_logo) {
    return '';
  }
  const content = brand_logo ? `<img class="${className}__item-brand-logo" src="${brand_logo}"${brand ? ` alt="${brand}"` : ''}>` : `<div class="${className}__item-brand">${brand}</div>`;
  return `<div class="${className}__item-brand-container">${content}</div>`;
}

export function descriptionBlock({ className }, { snippet, description }) {
  return snippet ? `<div class="${className}__item-snippet">${snippet}</div>` : description ? `<div class="${className}__item-desc">${escapeHtml(description)}</div>` : '';
}

export function dateBlock({ className, templates }, { created_at, updated_at, published_at }) {
  const date = published_at || created_at || updated_at;
  return date ? `<div class="${className}__item-date">${formatDate(date, templates.date)}</div>` : '';
}

export function priceBlock(layout, data) {
  const { className, templates } = layout;
  const { sale_price, original_price, currency = 'USD' } = data;
  const price = sale_price || original_price;
  if (!price) {
    return '';
  }
  const has_price_difference = original_price !== undefined && sale_price !== undefined && sale_price < original_price;
  const discount_rate_percent = data.discount_rate_percent || (has_price_difference ? Math.floor((1 - sale_price / original_price) * 100) : undefined);

  let content = '';
  // original price
  if (has_price_difference) {
    content += `<span class="${className}__item-original-price miso-price" data-currency="${currency}">${original_price}</span><br>`;
  }
  // current price
  content += `<span class="${className}__item-price miso-price" data-currency="${currency}">${price}</span>`;
  // discount rate
  if (discount_rate_percent) {
    const text = (templates.discountRateText || discountRateText)(layout, { ...data, discount_rate_percent });
    content += ` <span class="${className}__item-discount-rate">${text}</span>`;
  }
  return `<div class="${className}__item-price-container">${content}</div>`;
}

export function discountRateText(layout, { discount_rate_percent }) {
  return `(${discount_rate_percent}% off)`;
}

export function imageBlock(layout, data, meta = {}) {
  const { className, templates } = layout;
  const { cover_image } = data;
  if (!cover_image) {
    return '';
  }
  const img = `<img class="${className}__item-cover-image" src="${cover_image}">`;
  const brand = meta.brand ? (templates.brandBlock || brandBlock)(layout, data, meta) : '';
  return `<div class="${className}__item-cover-image-container">${img}${brand}</div>`;
}

export function indexBlock({ className }, data, { index }) {
  return `<div class="${className}__item-index-container"><span class="${className}__item-index miso-citation-index" data-index="${index + 1}"></span></div>`;
}

export function ctaBlock(layout, data, meta) {
  const { className, templates } = layout;
  const cta = helpers.asFunction(templates.cta)(layout, data, meta);
  return cta ? `<div class="${className}__item-cta-container">${cta}</div>` : '';
}

export function cta(layout, data, meta) {
  const { templates } = layout;
  const { url } = data;
  if (!url) {
    return '';
  }
  const [openTag, closeTag] = tagPair(layout, { url }, { classSuffix: 'item-cta', role: 'cta' });
  const ctaText = helpers.asFunction(templates.ctaText)(layout, data, meta);
  return ctaText ? `${openTag}${ctaText}${closeTag}` : '';
}

// helpers //
function tagPair({ className, options = {} }, { product_id, url }, { classSuffix = 'item-body', role = 'item', ...meta } = {}) {
  const { link = {} } = options;
  const { target = '_blank', rel = 'noopener' } = link; // TODO: other properties
  const tag = meta.link !== false && url ? 'a' : 'div';
  const urlAttrs = meta.link !== false && url ? `href="${url}" target="${target}" rel="${rel}"` : '';
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

function asFunction(template = '') {
  return typeof template === 'function' ? template : () => template;
}

export const helpers = Object.freeze({
  tagPair,
  formatDate,
  escapeHtml,
  asFunction,
});
