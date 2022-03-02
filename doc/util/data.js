const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function isMixin(key) {
  return key.charCodeAt(0) === 95; // '_'
}

function compute() {
  const rawProps = yaml.load(fs.readFileSync(path.join(__dirname, '../_data/props.yml'), 'utf8'));
  const rawGroups = yaml.load(fs.readFileSync(path.join(__dirname, '../_data/prop-groups.yml'), 'utf8'));
  
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
    if (!isMixin(group.key)) { // '_'
      m[group.key] = {
        key: group.key,
        props: unfoldProps(group.props)
      };
    }
    return m;
  }, {});

  return Object({ propGroups });
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
}

module.exports = new Data();
