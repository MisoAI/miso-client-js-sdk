import { trimObj } from '@miso.ai/commons';

export function processData(data) {
  if (!data || !data.value) {
    return data;
  }
  const { value } = data;
  return {
    ...data,
    value: processValue(value)
  };
}

function processValue(value) {
  if (value.sovrn_aff) {
    const { sovrn_aff, ...rest } = value;
    return {
      ...rest,
      affiliation: processSovrnData(sovrn_aff),
    }
  }
  return value;
}

function processSovrnData({ products, ...sovrn_aff }) {
  products = products.slice(0, 1);
  return {
    channel: 'sovrn',
    ...sovrn_aff,
    products: products.map(processSovrnProduct),
  };
}

export function processSovrnProduct({
  id,
  deeplink: url,
  headline: title,
  currency,
  retailPrice: original_price,
  salePrice: sale_price,
  discountRate: discount_rate_percent,
  image: cover_image,
  thumbnail,
  merchant,
  ...product
}) {
  const brand = merchant && merchant.name;
  const brand_logo = merchant && merchant.logo;
  return trimObj({
    id: `sovrn-${id}`,
    channel: 'sovrn',
    title,
    cover_image,
    url,
    currency,
    original_price,
    sale_price,
    discount_rate_percent,
    brand,
    brand_logo,
    custom_attributes: flatten({
      sovrn_id: id,
      thumbnail,
      merchant,
      ...product,
    }),
  });
}

function flatten(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key];
    if (value === undefined) {
      return acc;
    }
    const prefixedKey = prefix ? `${prefix}_${key}` : key;
    if (typeof value === 'object') {
      return { ...acc, ...flatten(value, prefixedKey) };
    }
    return { ...acc, [prefixedKey]: value };
  }, {});
}
