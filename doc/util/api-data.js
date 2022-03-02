const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const rawData = yaml.load(fs.readFileSync(path.join(__dirname, '../_data/api.yml'), 'utf8'));

const propMap = rawData.props.reduce((m, prop) => {
  m[prop.key] = prop;
  return m;
}, {});

const propGroups = rawData.groups.reduce((m, group) => {
  m[group.key] = {
    key: group.key,
    name: group.name || group.key,
    props: group.props.map((key) => Object.assign({name: key}, propMap[key], group.overrides && group.overrides[key]))
  };
  return m;
}, {});

module.exports = Object.freeze({ propGroups });
