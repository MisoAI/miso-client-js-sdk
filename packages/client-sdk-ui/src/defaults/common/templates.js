import { lowerCamelToKebab, kebabToLowerCamel, kebabOrSnakeToLowerCamel, defineValues } from '@miso.ai/commons';

// TODO: rename classPrefix -> rootClass?
// TODO: placeholder

export class Sections {

  constructor({ helpers }) {
    this._helpers = helpers;
  }

  answerGroup(options) {
    const { container } = this._helpers;
    return [
      this.answer(options),
      this.affiliation(options),
      this.sources(options),
      container(options, { name: 'bottom-spacing', visibleWhen: 'ongoing' }),
    ];
  }

  answer(options) {
    const { container, phrase } = this._helpers;
    return container(options, { name: 'answer', visibleWhen: 'ready' }, [
      options.parentQuestionId ? '<hr>' : '',
      phrase(options, { name: 'question', tag: 'div' }),
      '<miso-question></miso-question>',
      '<miso-answer></miso-answer>',
      '<miso-feedback></miso-feedback>',
    ]);
  }

  sources(options) {
    const { container, phrase } = this._helpers;
    return container(options, { name: 'sources', visibleWhen: 'nonempty' }, [
      '<hr>',
      phrase(options, { name: 'sources', tag: 'h3' }),
      '<miso-sources></miso-sources>',
    ]);
  }

  affiliation(options) {
    const { container } = this._helpers;
    const { affiliation = true } = options || {};
    if (!affiliation) {
      return '';
    }
    return container(options, { name: 'affiliation', visibleWhen: 'nonempty' }, [
      '<miso-affiliation></miso-affiliation>',
    ]);
  }

}

export class Helpers {

  constructor(context) {
    this._context = context;
    defineValues(this, { lowerCamelToKebab, kebabToLowerCamel, kebabOrSnakeToLowerCamel });
  }

  // options //
  normalizeOptions({
    classPrefix,
    circledCitationIndex = true,
    phrases,
    ...options
  } = {}) {
    classPrefix = classPrefix || this._context.CLASS_PREFIX;
    phrases = this.normalizePhraseOptions(phrases);
    return { classPrefix, circledCitationIndex, phrases, ...options };
  }

  normalizePhraseOptions(options = {}) {
    if (!options) {
      return {};
    }
    const normalized = {};
    for (const key in options) {
      normalized[this.normalizePhraseOptionKey(key)] = options[key];
    }
    return normalized;
  }

  normalizePhraseOptionKey(key) {
    key = kebabOrSnakeToLowerCamel(key);
    if (key === 'relatedQuestions') {
      return 'querySuggestions'; // legacy key
    }
    return key;
  }

  // html //
  phrase(options, { name, tag = 'div' }) {
    const { classPrefix } = options;
    return `<${tag} class="${classPrefix}__phrase ${classPrefix}__${name}-phrase">${this.phraseText(options, kebabToLowerCamel(name))}</${tag}>`;
  }

  phraseText(options, key) {
    const { phrases = {} } = options;
    const fn = phrases[key] || this._context.DEFAULT_PHRASES[key];
    switch (typeof fn) {
      case 'function':
        return fn(options);
      case 'string':
        return fn;
      default:
        return '';
    }
  }

  section({ classPrefix }, { name }, body) {
    return this.element('section', {
      classes: [`${classPrefix}__section`, `${classPrefix}__${name}`],
    }, body);
  }

  container({ classPrefix, circledCitationIndex, parentQuestionId }, { name, visibleWhen, logo = false }, body) {
    const classes = [`${classPrefix}__${name}-container`];
    circledCitationIndex && classes.push('miso-circled-citation-index');
    return this.element('miso-ask', { classes, visibleWhen, logo, parentQuestionId }, body);
  }

  element(tag, attributes = {}, body = '') {
    return `<${tag}${this.attrs(attributes)}>${Array.isArray(body) ? body.join('') : body}</${tag}>`;
  }

  attrs({ classes = [], ...attributes } = {}) {
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

}

export function externalize(object) {
  const externalized = {};
  const props = new Set();
  for (let o = object; o !== Object.prototype; o = Object.getPrototypeOf(o)) {
    const descriptors = Object.getOwnPropertyDescriptors(o);
    for (const key in descriptors) {
      if (key === 'constructor' || key.startsWith('_') || props.has(key)) {
        continue;
      }
      props.add(key);
      // TODO: getter, setter
      const { value } = descriptors[key];
      if (value) {
        externalized[key] = typeof value === 'function' ? value.bind(object) : value;
      }
    }
  }
  return Object.freeze(externalized);
}
