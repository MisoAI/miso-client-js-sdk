const { loadYaml } = require('./file');

function isMixin(key) {
  return key && key.charCodeAt(0) === 95; // '_'
}

function getPropMap(rawProps) {
  return rawProps.reduce((m, prop) => {
    m[prop.key] = Object.assign({ name: prop.key }, prop);
    return m;
  }, {});
}

function getMixinGroupMap(rawGroups) {
  return rawGroups.reduce((m, group) => {
    if (isMixin(group.key)) { 
      m[group.key] = group;
    }
    return m;
  }, {});
}

function unfoldProps(propMap, mixinGroupMap, keys, arr = []) {
  for (const key of keys) {
    if (isMixin(key)) {
      unfoldProps(propMap, mixinGroupMap, mixinGroupMap[key].props, arr);
    } else {
      arr.push(propMap[key]);
    }
  }
  return arr;
}

function getPropGroupMap(file) {
  const { props, groups } = loadYaml(file);

  const propMap = getPropMap(props);
  const mixinGroupMap = getMixinGroupMap(groups);

  return Object.freeze(groups.reduce((m, group) => {
    if (!isMixin(group.key)) {
      const keys = group.keys || [group.key];
      const props = unfoldProps(propMap, mixinGroupMap, group.props);
      for (const key of keys) {
        m[key] = { key, props };
      }
    }
    return m;
  }, {}));
}



function computeProps() {
  return Object.freeze({
    sdk: getPropGroupMap('prop/sdk.yml'), 
    'ui:model': getPropGroupMap('prop/ui.model.yml'),
  });
}

function computeEvent() {
  const rawEvents = loadYaml('events.yml');
  const props = Object.freeze(loadYaml('event-props.yml'));

  function getEventProps(name) {
    return props.filter((prop) => 
      (!prop.used_by && !prop.used_by_except) ||
      (prop.used_by && prop.used_by.includes(name)) ||
      (prop.used_by_except && !prop.used_by_except.includes(name))
    );
  }

  const groups = Object.freeze(rawEvents.map((group) => {
    return Object.assign({}, group, {
      events: group.events.map((event) => Object.assign({}, event, {
        props: getEventProps(event.name)
      }))
    });
  }));

  return Object.freeze({ props, groups });
}

function compute() {
  return Object.freeze({
    props: computeProps(),
    event: computeEvent(),
  });
}

class Data {
  constructor() {
    this.refresh();
  }
  refresh() {
    this._data = compute();
  }
  get props() {
    return this._data.props;
  }
  get event() {
    return this._data.event;
  }
}

module.exports = new Data();
