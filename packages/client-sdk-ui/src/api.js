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
    case 'custom':
      return 'custom';
    default:
      throw new Error(`Unrecognized API name: "${name}"`);
  }
}

export function getBasePayload(name) {
  // TODO: fl: ['*']?
  return {};
}

function replaceAllPropNamesToItems(response, propNames) {
  for (const propName of propNames) {
    response = replacePropNameToItems(response, propName);
  }
  return response;
}

function replacePropNameToItems(response, propName) {
  const { [propName]: newItems = [], items = [], ...rest } = response;
  return {
    ...rest,
    items: [...items, ...newItems],
  };
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
    case 'custom':
      return replaceAllPropNamesToItems(response, ['products', 'categories', 'attributes', 'completions']);
    default:
      throw new Error(`Unrecognized API name: "${apiName}"`);
  }
}
