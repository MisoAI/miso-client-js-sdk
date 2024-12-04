import { externalize } from '@miso.ai/commons';
import * as CONSTANTS from './constants.js';
import * as DEFAULT_PHRASES from './phrases.js';
import { Helpers, Sections as _Sections } from '../common/templates.js';

class Sections extends _Sections {

  constructor() {
    super({ helpers });
  }

  answerBox(options) {
    const { element } = this._helpers;
    const { classPrefix } = options;
    return element('div', { classes: [`${classPrefix}__answer-box`] }, [
      element('div', { classes: [`${classPrefix}__answer-box-inner`] }, this.answerGroup(options)),
      this.answerBoxToggle(options),
    ]);
  }

  question(options) {
    const { phrase } = this._helpers;
    return phrase(options, { name: 'question', tag: 'div' }).replaceAll('${value}', '<miso-question></miso-question>');
  }

  answerBoxToggle(options) {
    const { element } = this._helpers;
    const { classPrefix } = options;
    return element('div', { classes: [`${classPrefix}__answer-box-toggle-container`] }, [
      element('div', { classes: [`${classPrefix}__answer-box-toggle`], 'data-role': 'answer-box-toggle' }),
    ]);
  }

  searchResultsGroup(options) {
    const { container } = this._helpers;
    return container(options, { name: 'search-results', visibleWhen: 'loading ready' }, [
      this.searchResultsInfoGroup(options),
      this.searchResultsFilters(options),
      '<miso-products></miso-products>',
    ]);
  }

  searchResultsInfoGroup(options) {
    const { element } = this._helpers;
    const { classPrefix } = options;
    return element('div', { classes: [`${classPrefix}__search-results-info`] }, [
      this.keywords(options),
      this.hits(options),
    ]);
  }

  searchResultsFilters(options) {
    const { element } = this._helpers;
    const { classPrefix } = options;
    return element('div', { classes: [`${classPrefix}__search-results-filters`] }, [
      '<miso-facets></miso-facets>',
    ]);
  }

  keywords(options) {
    const { phrase } = this._helpers;
    return phrase(options, { name: 'keywords', tag: 'div', inline: true }).replaceAll('${value}', '<miso-keywords></miso-keywords>');
  }

  hits(options) {
    const { phrase } = this._helpers;
    return phrase(options, { name: 'hits', tag: 'div', inline: true }).replaceAll('${value}', '<miso-hits></miso-hits>');
  }

}

export const helpers = externalize(new Helpers({ ...CONSTANTS, DEFAULT_PHRASES }));
export const sections = externalize(new Sections({ helpers }));

export function root(options = {}) {
  const { normalizeOptions, section, container } = helpers;
  options = normalizeOptions(options);
  const { answerBox, answerGroup } = sections;
  const { answerBox: answerBoxOptions = true } = options;
  return [
    section(options, { name: 'question' }, [
      container(options, { name: 'query' }, '<miso-query></miso-query>'),
    ]),
    section(options, { name: 'answer' }, answerBoxOptions ? [ answerBox(options) ] : answerGroup(options)),
    section(options, { name: 'search-results' }, sections.searchResultsGroup(options)),
  ].join('');
};
