const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function loadYaml(file) {
  return yaml.load(fs.readFileSync(path.join(__dirname, `../_data/${file}`), 'utf8'));
}

module.exports = {
  loadYaml: loadYaml
};
