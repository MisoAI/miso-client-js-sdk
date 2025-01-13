const { join } = require('path');
const { readFileSync } = require('fs');
const { load: loadYaml } = require('js-yaml');

const DATA_DIR = join(__dirname, '_data');

function readYamlSync(file) {
  return loadYaml(readFileSync(file, 'utf8'));
}

function toWorkflowBitMap(workflows) {
  const map = {};
  let bit = 1;
  for (const workflow of workflows) {
    map[workflow.slug.charAt(0)] = bit;
    bit <<= 1;
  }
  return map;
}

function toWorkflowBits(wbm, str) {
  if (str === '*') {
    return -1;
  }
  let bits = 0;
  for (let i = 0, len = str.length; i < len; i++) {
    bits |= wbm[str.charAt(i)];
  }
  return bits;
}

function computeSpec() {
  return Object.freeze({
    ui: computeSpecUi(),
  });
}

function computeSpecUi() {
  const _ui = readYamlSync(join(DATA_DIR, 'spec/ui.yml'));
  const { workflows } = _ui;
  const len = workflows.length;
  const wbm = toWorkflowBitMap(workflows);
  const features = _ui.features.map(feature => {
    const available = toWorkflowBits(wbm, feature.available);
    const entries = [];
    for (let i = 0, bit = 1; i < len; i++) {
      entries.push({
        available: !!(available & bit),
      });
      bit <<= 1;
    }
    return Object.freeze({
      ...feature,
      workflows: entries,
    });
  });

  return Object.freeze({
    workflows,
    features,
  });
}

function compute() {
  return Object.freeze({
    spec: computeSpec(),
  });
}

class Data {
  constructor() {
    this.refresh();
  }
  refresh() {
    Object.assign(this, compute());
  }
}

module.exports = Data;
