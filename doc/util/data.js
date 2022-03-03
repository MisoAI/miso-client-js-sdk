const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function isMixin(key) {
  return key && key.charCodeAt(0) === 95; // '_'
}

function loadYaml(file) {
  return yaml.load(fs.readFileSync(path.join(__dirname, `../_data/${file}`), 'utf8'));
}

function compute() {
  const rawProps = loadYaml('props.yml');
  const rawGroups = loadYaml('prop-groups.yml');
  const rawEvents = loadYaml('events.yml');
  const rawEventProps = loadYaml('event-props.yml');
  
  const propMap = rawProps.reduce((m, prop) => {
    m[prop.key] = Object.assign({ name: prop.key }, prop);
    return m;
  }, {});
  
  const mixinGroups = rawGroups.reduce((m, group) => {
    if (isMixin(group.key)) { 
      m[group.key] = group;
    }
    return m;
  }, {});
  
  function unfoldProps(keys, arr = []) {
    for (const key of keys) {
      if (isMixin(key)) {
        unfoldProps(mixinGroups[key].props, arr);
      } else {
        arr.push(propMap[key]);
      }
    }
    return arr;
  }
  
  const propGroups = rawGroups.reduce((m, group) => {
    if (!isMixin(group.key)) {
      const keys = group.keys || [group.key];
      const props = unfoldProps(group.props);
      for (const key of keys) {
        m[key] = { key, props };
      }
    }
    return m;
  }, {});

  const eventProps = rawEventProps;

  function getEventProps(name) {
    return eventProps.filter((prop) => 
      (!prop.used_by && !prop.used_by_except) ||
      (prop.used_by && prop.used_by.includes(name)) ||
      (prop.used_by_except && !prop.used_by_except.includes(name))
    );
  }

  const eventGroups = rawEvents.map((group) => {
    return Object.assign({}, group, {
      events: group.events.map((event) => Object.assign({}, event, {
        props: getEventProps(event.name)
      }))
    });
  });

  return Object.freeze({ propGroups, eventGroups, eventProps });
}

class Data {
  constructor() {
    this.refresh();
  }
  refresh() {
    this._data = compute();
  }
  get propGroups() {
    return this._data.propGroups;
  }
  get eventGroups() {
    return this._data.eventGroups;
  }
  get eventProps() {
    return this._data.eventProps;
  }
}

module.exports = new Data();
