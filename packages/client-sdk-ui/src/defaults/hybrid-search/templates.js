import { externalize } from '@miso.ai/commons';
import * as CONSTANTS from './constants.js';
import * as DEFAULT_PHRASES from './phrases.js';
import { Helpers, Sections as _Sections } from '../common/templates.js';

class Sections extends _Sections {

  constructor() {
    super({ helpers });
  }

  searchResultsGroup(options) {
    const { container } = this._helpers;
    return container(options, { name: 'search-results', visibleWhen: 'ready' }, [
      this.searchResultsInfoGroup(options),
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
  const { answerGroup } = sections;
  options = normalizeOptions(options);
  return [
    section(options, { name: 'answer' }, [
      container(options, { name: 'query' }, '<miso-query></miso-query>'),
      ...answerGroup(options),
    ]),
    section(options, { name: 'search-results' }, sections.searchResultsGroup(options)),
  ].join('');
};
