import { externalize } from '@miso.ai/commons';
import * as CONSTANTS from './constants.js';
import * as DEFAULT_PHRASES from './phrases.js';
import { Helpers, Sections as _Sections } from '../common/templates.js';

class Sections extends _Sections {

  constructor() {
    super({ helpers });
  }

  answer(options) {
    const { container } = this._helpers;
    return container(options, { name: 'answer', visibleWhen: 'ready !unanswerable' }, [
      ...this.question(options),
      '<miso-answer></miso-answer>',
      '<miso-feedback></miso-feedback>',
    ]);
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
      this.more(options),
    ]);
  }

  searchResultsInfoGroup(options) {
    const { element } = this._helpers;
    const { classPrefix } = options;
    return element('div', { classes: [`${classPrefix}__search-results-info`] }, [
      this.keywords(options),
      this.total(options),
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

  total(options) {
    const { phrase } = this._helpers;
    return phrase(options, { name: 'total', tag: 'div', inline: true }).replaceAll('${value}', '<miso-total></miso-total>');
  }

  more(options) {
    if (!options.moreButton) {
      return '';
    }
    const { element } = this._helpers;
    const { classPrefix } = options;
    return element('div', { classes: [`${classPrefix}__search-results-more-container`] }, [
      '<miso-more></miso-more>',
    ]);
  }

}

export const helpers = externalize(new Helpers({ ...CONSTANTS, DEFAULT_PHRASES }));
export const sections = externalize(new Sections({ helpers }));

export function root(options = {}) {
  const { normalizeOptions, section, container } = helpers;
  options = normalizeOptions(options);
  const { answerBox, answerGroup, searchResultsGroup } = sections;
  const { answerBox: answerBoxOptions = true } = options;
  return [
    section(options, { name: 'question' }, [
      container(options, { name: 'query' }, '<miso-query></miso-query>'),
    ]),
    section(options, { name: 'answer' }, answerBoxOptions ? [ answerBox(options) ] : answerGroup(options)),
    section(options, { name: 'search-results' }, searchResultsGroup(options)),
  ].join('');
};
