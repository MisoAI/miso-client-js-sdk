const interceptors = {
  request: [],
  response: [],
};

export function intercept({ request, response } = {}) {
  if (request !== undefined && typeof request !== 'function') {
    throw new TypeError('request must be a function');
  }
  if (response !== undefined && typeof response !== 'function') {
    throw new TypeError('response must be a function');
  }
  if (request || response) {
    injectFetchInNecessary();
  }
  request && interceptors.request.push(request);
  response && interceptors.response.push(response);
}

let _fetch;

async function fetch(...args) {
  let request = new Request(...args);
  for (const fn of interceptors.request) {
    request = fn(request) || request;
  }
  let response = await _fetch(request);
  for (const fn of interceptors.response) {
    response = await fn(response, request) || response;
  }
  return response;
}

function injectFetchInNecessary() {
  if (window.fetch === fetch) {
    return;
  }
  _fetch = window.fetch;
  window.fetch = fetch;  
}
