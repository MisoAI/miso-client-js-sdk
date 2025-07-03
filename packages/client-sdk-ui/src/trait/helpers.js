export function defineStatusGetters(prototype, statuses) {
  for (const status of statuses) {
    Object.defineProperty(prototype, status, {
      get() {
        return this._element && this._element.classList.contains(status);
      },
    });
  }
}

export function defineActions(prototype, actions) {
  for (const { action, classAction, className } of actions) {
    prototype[action] = function() {
      this._element && this._element.classList[classAction](className);
      this[`_${action}`] && this[`_${action}`]();
    };
  }
}

export function defineClickables(prototype, clickables) {
  prototype._handleClick = function(event) {
    const { target, button } = event;
    if (button !== 0) {
      return; // only left click
    }
    for (let { role, selector, action } of clickables) {
      selector = selector || `[data-role="${role}"]`;
      if (!selector) {
        continue;
      }
      if (target.closest(selector)) {
        this[action]();
        event.stopPropagation();
        return;
      }
    }
  };
}

export function listenToClickables(addon) {
  const element = addon._element;
  if (!element) {
    return () => {};
  }
  const handleClick = event => addon._handleClick(event);
  element.addEventListener('click', handleClick);
  return () => element.removeEventListener('click', handleClick);
}
