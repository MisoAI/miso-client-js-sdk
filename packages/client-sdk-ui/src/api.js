export function checkApiName(name) {
  getApiGroup(name);
}

export function getApiGroup(name) {
  switch (name) {
    case 'user_to_products':
    case 'user_to_categories':
    case 'user_to_attributes':
    case 'user_to_trending':
    case 'user_to_history':
    case 'product_to_products':
      return 'recommendation';
    case 'search':
    case 'autocomplete':
    case 'mget':
      return 'search';
    default:
      throw new Error(`Unrecognized API name: "${name}"`);
  }
}

export function getBasePayload(name) {
  // TODO: fl: ['*']?
  return {};
}

function replacePropNameToItems(response, propName) {
  const { [propName]: items, ...rest } = response;
  return { ...rest, items };
}

export function transformResponse(apiName, response) {
  switch (apiName) {
    case 'user_to_products':
    case 'user_to_trending':
    case 'user_to_history':
    case 'product_to_products':
    case 'search':
    case 'mget':
      return replacePropNameToItems(response, 'products');
    case 'user_to_categories':
      return replacePropNameToItems(response, 'categories');
    case 'user_to_attributes':
      return replacePropNameToItems(response, 'attributes');
    case 'autocomplete':
      return replacePropNameToItems(response, 'completions');
    default:
      throw new Error(`Unrecognized API name: "${apiName}"`);
  }
}
