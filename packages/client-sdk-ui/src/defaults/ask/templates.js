import { lowerCamelToKebab, kebabToLowerCamel, kebabOrSnakeToLowerCamel } from '@miso.ai/commons';
import { CLASS_PREFIX } from './constants.js';
import * as DEFAULT_PHRASES from './phrases.js';

// TODO: rename classPrefix -> rootClass?
// TODO: placeholder

export function root(options = {}) {
  options = normalizeOptions(options);
  return [
    section(options, { name: 'question' }, [
      container(options, { name: 'query' }, '<miso-query></miso-query>'),
    ]),
    section(options, { name: 'answer' }, answerGroup(options)),
    followUps(options),
    relatedResources(options),
  ].join('');
};

export function followUp(options = {}) {
  options = normalizeOptions(options);
  return section(options, { name: 'follow-up' }, [
    querySuggestions(options),
    container(options, { name: 'query', visibleWhen: 'initial loading' }, '<miso-query></miso-query>'),
    ...answerGroup(options),
  ]);
};

export const sections = Object.freeze({
  followUps,
  relatedResources,
  querySuggestions,
  answerGroup,
  answer,
  sources,
});

export const helpers = Object.freeze({
  normalizeOptions,
  normalizePhraseOptions,
  normalizePhraseOptionKey,
  phrase,
  phraseText,
  section,
  container,
  element,
  attrs,
});



// options //
function normalizeOptions({
  classPrefix = CLASS_PREFIX,
  circledCitationIndex = true,
  phrases,
  ...options
} = {}) {
  phrases = normalizePhraseOptions(phrases);
  return { classPrefix, circledCitationIndex, phrases, ...options };
}

function normalizePhraseOptions(options = {}) {
  if (!options) {
    return {};
  }
  const normalized = {};
  for (const key in options) {
    normalized[normalizePhraseOptionKey(key)] = options[key];
  }
  return normalized;
}

function normalizePhraseOptionKey(key) {
  key = kebabOrSnakeToLowerCamel(key);
  if (key === 'relatedQuestions') {
    return 'querySuggestions'; // legacy key
  }
  return key;
}

// sections & containers //
function followUps(options) {
  const { classPrefix, features = {} } = options;
  return features.followUpQuestions === false ? '' : `<div id="${classPrefix}__follow-ups" class="${classPrefix}__follow-ups"></div>`;
}

function relatedResources(options) {
  const { features = {}, logo = true } = options;
  const body = features.relatedResources === false ? '' : container(options, { name: 'related-resources', visibleWhen: 'nonempty', logo }, [
    phrase(options, { name: 'related-resources', tag: 'h2' }),
    '<miso-related-resources></miso-related-resources>',
  ]);
  return section(options, { name: 'related-resources' }, body);
}

function querySuggestions(options) {
  const { features = {} } = options;
  return features.querySuggestions === false ? '' :
    container(options, { name: 'query-suggestions', visibleWhen: 'initial+nonempty' }, [
      phrase(options, { name: 'query-suggestions', tag: 'h3' }),
      '<miso-query-suggestions></miso-query-suggestions>',
    ]);
}

function answerGroup(options) {
  return [
    answer(options),
    affiliation(options),
    sources(options),
    container(options, { name: 'bottom-spacing', visibleWhen: 'ongoing' }),
  ];
}

function answer(options) {
  return container(options, { name: 'answer', visibleWhen: 'ready' }, [
    options.parentQuestionId ? '<hr>' : '',
    phrase(options, { name: 'question', tag: 'div' }),
    '<miso-question></miso-question>',
    '<miso-answer></miso-answer>',
    '<miso-feedback></miso-feedback>',
  ]);
}

function sources(options) {
  return container(options, { name: 'sources', visibleWhen: 'nonempty' }, [
    '<hr>',
    phrase(options, { name: 'sources', tag: 'h3' }),
    '<miso-sources></miso-sources>',
  ]);
}

function affiliation(options) {
  const { affiliation = true } = options || {};
  if (!affiliation) {
    return '';
  }
  return container(options, { name: 'affiliation', visibleWhen: 'nonempty' }, [
    '<hr>',
    '<miso-affiliation></miso-affiliation>',
  ]);
}

function phrase(options, { name, tag = 'div' }) {
  const { classPrefix } = options;
  return `<${tag} class="${classPrefix}__phrase ${classPrefix}__${name}-phrase">${phraseText(options, kebabToLowerCamel(name))}</${tag}>`;
}

function phraseText(options, key) {
  const { phrases = {} } = options;
  const fn = phrases[key] || DEFAULT_PHRASES[key];
  switch (typeof fn) {
    case 'function':
      return fn(options);
    case 'string':
      return fn;
    default:
      return '';
  }
}

function section({ classPrefix }, { name }, body) {
  return element('section', {
    classes: [`${classPrefix}__section`, `${classPrefix}__${name}`],
  }, body);
}

function container({
  classPrefix,
  circledCitationIndex,
  parentQuestionId,
}, {
  name,
  visibleWhen,
  logo = false,
}, body) {
  const classes = [`${classPrefix}__${name}-container`];
  circledCitationIndex && classes.push('miso-circled-citation-index');
  return element('miso-ask', { classes, visibleWhen, logo, parentQuestionId }, body);
}

function element(tag, attributes = {}, body = '') {
  if (typeof attributes === 'string' || Array.isArray(attributes)) {
    body = attributes;
    attributes = {};
  }
  return `<${tag}${attrs(attributes)}>${Array.isArray(body) ? body.join('') : body}</${tag}>`;
}

function attrs({ classes = [], ...attributes } = {}) {
  let str = ``;
  if (classes.length) {
    str += ` class="${classes.join(' ')}"`;
  }
  for (const name in attributes) {
    const value = attributes[name];
    if (value !== undefined) {
      str += ` ${lowerCamelToKebab(name)}="${value}"`;
    }
  }
  return str;
}
