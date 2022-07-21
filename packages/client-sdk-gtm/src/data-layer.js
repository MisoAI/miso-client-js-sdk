export default function observe(callback) {
  interceptDataLayer(dataLayer => interceptPushMethod(dataLayer, callback));
}

const injected = new WeakSet();

function interceptDataLayer(callback) {
  function _callback(obj) {
    if (injected.has(obj)) {
      return;
    }
    injected.add(obj);
    callback(obj);
  }

  if (Array.isArray(window.dataLayer)) {
    _callback(window.dataLayer)
  }
  let _dataLayer = window.dataLayer;
  Object.defineProperty(window, 'dataLayer', {
    set: function(value) {
      _callback(_dataLayer = value);
    },
    get: function() {
      return _dataLayer;
    },
  });
}

function interceptPushMethod(obj, callback) {
  function _callback(data) {
    try {
      callback(data);
    } catch (e) {
      console.error(e);
    }
  }

  // capture future data
  let _push = obj.push;
  obj.push = function() {
    const ret = _push.apply(this, arguments);
    for (const data of arguments) {
      _callback(data);
    }
    return ret;
  };

  // go through existing data
  for (const data of obj) {
    _callback(data);
  }
}
