import { externalize } from '@miso.ai/commons';
import * as CONSTANTS from './constants.js';
import * as DEFAULT_PHRASES from './phrases.js';
import { Helpers, Sections as _Sections } from '../common/templates.js';

class Sections extends _Sections {

  constructor() {
    super({ helpers });
  }

  answerGroup(options) {
    const { container } = this._helpers;
    return [
      ...super.answerGroup(options),
      container(options, { name: 'bottom-spacing', visibleWhen: 'ongoing' }),
    ];
  }

  answer(options) {
    const { container } = this._helpers;
    return container(options, { name: 'answer', visibleWhen: 'ready' }, [
      options.parentQuestionId ? '<hr>' : '',
      ...this.question(options),
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

  followUps(options) {
    const { classPrefix, features = {} } = options;
    return features.followUpQuestions === false ? '' : `<div id="${classPrefix}__follow-ups" class="${classPrefix}__follow-ups"></div>`;
  }

  relatedResourcesSection(options) {
    const { container, phrase, section } = this._helpers;
    const { features = {}, logo = true } = options;
    const body = features.relatedResources === false ? '' : container(options, { name: 'related-resources', visibleWhen: 'nonempty', logo }, [
      phrase(options, { name: 'related-resources', tag: 'h2' }),
      '<miso-related-resources></miso-related-resources>',
    ]);
    return section(options, { name: 'related-resources' }, body);
  }

  querySuggestions(options) {
    const { container, phrase } = this._helpers;
    const { features = {} } = options;
    return features.querySuggestions === false ? '' :
      container(options, { name: 'query-suggestions', visibleWhen: 'initial+nonempty' }, [
        phrase(options, { name: 'query-suggestions', tag: 'h3' }),
        '<miso-query-suggestions></miso-query-suggestions>',
      ]);
  }

}

export const helpers = externalize(new Helpers({ ...CONSTANTS, DEFAULT_PHRASES }));
export const sections = externalize(new Sections({ helpers }));

export function root(options = {}) {
  const { normalizeOptions, section, container } = helpers;
  const { followUps, relatedResourcesSection, answerGroup } = sections;
  options = normalizeOptions(options);
  return [
    section(options, { name: 'question' }, [
      container(options, { name: 'query' }, '<miso-query></miso-query>'),
    ]),
    section(options, { name: 'answer' }, answerGroup(options)),
    followUps(options),
    relatedResourcesSection(options),
  ].join('');
};

export function followUp(options = {}) {
  const { normalizeOptions, section, container } = helpers;
  const { querySuggestions, answerGroup } = sections;
  options = normalizeOptions(options);
  return section(options, { name: 'follow-up' }, [
    querySuggestions(options),
    container(options, { name: 'query', visibleWhen: 'initial loading' }, '<miso-query></miso-query>'),
    ...answerGroup(options),
  ]);
};
