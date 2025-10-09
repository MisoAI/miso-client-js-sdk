import { externalize } from '@miso.ai/commons';
import * as CONSTANTS from './constants.js';
import * as DEFAULT_PHRASES from './phrases.js';
import { CHEVRON, BULB } from '../../asset/svgs.js';
import { Helpers, Sections as _Sections } from '../common/templates.js';

class Sections extends _Sections {

  constructor() {
    super({ helpers });
  }

  answerGroup(options) {
    const { container } = this._helpers;
    return [
      this.question(options),
      this.reasoning(options),
      this.answer(options),
      this.affiliation(options),
      this.sources(options),
      this.followUpQuestions(options),
      container(options, { name: 'bottom-spacing', visibleWhen: 'ongoing' }),
    ];
  }

  question(options) {
    const { container, phrase } = this._helpers;
    return container(options, { name: 'question', visibleWhen: 'ready' }, [
      options.parentQuestionId ? '<hr>' : '',
      phrase(options, { name: 'question', tag: 'div' }),
      '<miso-question></miso-question>',
    ]);
  }

  answer(options) {
    const { container } = this._helpers;
    return container(options, { name: 'answer', visibleWhen: 'ready' }, [
      '<miso-answer></miso-answer>',
      '<miso-feedback></miso-feedback>',
    ]);
  }

  reasoning(options = {}) {
    const { phrases, reasoning: reasoningOptions = {} } = options;
    const { container, element, phraseText } = this._helpers;
    const classes = [];
    reasoningOptions.expand && classes.push('expanded');
    return container(options, { name: 'reasoning', visibleWhen: 'nonempty' }, [
      element('miso-stub', {
        classes,
        trait: 'collapsible',
        'data-role': 'reasoning-box',
      }, [
        element('div', {
          classes: ['miso-collapsible__header'],
          'data-role': 'toggle-expand',
        }, [
          `<div class="miso-collapsible__icon">${reasoningOptions.icon || BULB}</div>`,
          `<div class="miso-collapsible__title" data-role="title">${phraseText(phrases, 'thoughts')}</div>`,
          `<div class="miso-collapsible__toggle">${CHEVRON}</div>`,
        ]),
        element('div', {
          classes: ['miso-collapsible__body'],
        }, [
          '<miso-reasoning></miso-reasoning>',
        ]),
      ]),
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

  followUpQuestions(options) {
    const { container, phrase } = this._helpers;
    const name = 'follow-up-questions';
    const extraNames = ['query-suggestions']; // backward compatibility (styling)
    return container(options, { name, extraNames, visibleWhen: 'nonempty' }, [
      phrase(options, { name, extraNames, tag: 'h3' }),
      '<miso-follow-up-questions></miso-follow-up-questions>',
    ]);
  }

  followUps(options) {
    const { features = {} } = options;
    return features.followUpQuestions === false ? '' : `<miso-follow-ups id="miso-ask-combo__follow-ups" class="miso-ask-combo__follow-ups"></miso-follow-ups>`;
  }

  relatedResourcesSection(options) {
    const { container, phrase, section } = this._helpers;
    const { features = {}, logo = true } = options;
    const body = features.relatedResources === false ? '' : container({ ...options, workflow: 'active' }, { name: 'related-resources', visibleWhen: 'nonempty', logo }, [
      phrase(options, { name: 'related-resources', tag: 'h2' }),
      '<miso-related-resources></miso-related-resources>',
    ]);
    return section(options, { name: 'related-resources' }, body);
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
  const { answerGroup } = sections;
  options = normalizeOptions(options);
  return section(options, { name: 'follow-up' }, [
    container(options, { name: 'query', visibleWhen: 'initial loading' }, '<miso-query></miso-query>'),
    ...answerGroup(options),
  ]);
};
