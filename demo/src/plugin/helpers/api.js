const PORT = 9901;
const BASE_URL = `http://localhost:${PORT}`;

export default async function({ group, name, payload }) {
  if (group === 'search' && name === 'ask') {
    return ask(payload);
  }
  const response = await window.fetch(buildUrl(group, name), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const { data } = await response.json();
  return postProcess(data);
}

function postProcess(response) {
  // TODO: more API types
  // search, u2p, p2p
  return {
    results: response.products,
  };
}

const ASK_POLLING_INTERVAL = 500;

async function* ask(payload) {
  const response = await (await window.fetch(buildUrl('search', 'questions'), {
    method: 'POST',
    body: JSON.stringify(payload),
  })).json();
  yield response;
  const { answer_id, finished } = response;
  if (finished) {
    return;
  }
  const buffer = new ValueBuffer();
  const intervalId = setInterval(async () => {
    const response = await (await window.fetch(buildUrl('search', `answers/${answer_id}`), {
      method: 'GET',
    })).json();
    const { finished } = response;
    buffer.update(response, finished);
    if (response.finished) {
      clearInterval(intervalId);
    }
  }, ASK_POLLING_INTERVAL);

  yield* buffer;
}

function buildUrl(group, name) {
  return `${BASE_URL}/api/${group}/${name}`;
}

class ValueBuffer {

  constructor() {
    this._index = -1;
    this._done = false;
  }

  update(value, done = false) {
    if (this._done) {
      return;
    }
    this._value = value;
    this._done = done;
    this._index++;

    if (this._resolution) {
      this._resolution.resolve();
      this._resolution = undefined;
    }
  }

  async *[Symbol.asyncIterator]() {
    for (let cursor = 0; ; cursor = this._index + 1) {
      if (cursor > this._index) {
        if (!this._resolution) {
          this._resolution = new Resolution();
        }
        await this._resolution.promise;
      }
      yield this._value;
      if (this._done) {
        break;
      }
    }
  }

}

class Resolution {

  constructor() {
    const self = this;
    self.promise = new Promise((resolve, reject) => {
      self.resolve = resolve;
      self.reject = reject;
    });
    Object.freeze(this);
  }

}
