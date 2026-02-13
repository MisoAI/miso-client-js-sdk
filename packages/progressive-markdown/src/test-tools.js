import { EventEmitter, pacer, trimObj } from '@miso.ai/commons';
import { lorem as _lorem } from '@miso.ai/lorem';
import Renderer from './renderer.js';
import { resolvePresets } from './preset/index.js';

export class TestRunner {

  constructor(elements, { lorem, seed, ...options } = {}) {
    if (!Array.isArray(elements) || elements.length !== 2) {
      throw new Error('elements must be an array of 2 elements');
    }
    this._elements = elements;
    this._lorem = lorem || _lorem({ seed });
    this._options = options;
    this._controllers = [
      new FreeController(elements[0], options.renderer),
      new FreeController(elements[1], { ...options.renderer, forceOverwrite: true }),
    ];
    this._events = new EventEmitter({ target: this });
  }

  get seed() {
    return this._lorem.seed;
  }

  get controllers() {
    return this._controllers;
  }

  run() {
    const [actualController, expectedController] = this._controllers;
    const options = { ...this._options.steps, lorem: this._lorem };

    for (const step of generateTestSteps(options)) {
      // apply step
      switch (step.type) {
        case 'response':
          for (const controller of this._controllers) {
            controller.response = step.response;
          }
          break;
        case 'cursor':
          for (const controller of this._controllers) {
            controller.cursor += step.increment;
          }
          break;
      }

      // emit state
      this._events.emit('state', {
        step,
        controllers: this._controllers.map(c => c.state),
      });

      // verify
      if (actualController.html !== expectedController.html) {
        throw new Error('HTML mismatch');
      }
      if (actualController.done !== expectedController.done) {
        throw new Error('Done mismatch');
      }
      if (actualController.done && expectedController.done) {
        return;
      }
    }
    throw new Error('Test steps exhausted without completion');
  }

}

export class FreeController {

  constructor(element, { forceOverwrite = false, ...options } = {}) {
    this._element = element;
    this._renderer = new Renderer({ ...resolvePresets(options), forceOverwrite });

    this._response = undefined;
    this._cursor = undefined;
    this._rendered = undefined;
  }

  set response(response) {
    this._response = response;
  }

  set cursor(cursor) {
    if (!this._response) {
      this._rendered = this._renderer.clear(this._element, this._rendered);
      return;
    }

    const { value, stage, finished } = this._response;
    const dataDone = (this._rendered && this._rendered.dataDone) || finished;
    const isNewStreak = !this._rendered || (stage !== this._rendered.stage);

    const result = isNewStreak ?
      this._renderer.clear(this._element, this._rendered) :
      this._renderer.update(this._element, this._rendered, { value, cursor, done: dataDone });

    this._rendered = Object.freeze({ ...this._rendered, stage, ...result, dataDone });
  }

  get rendered() {
    return this._rendered;
  }

  get response() {
    return this._response;
  }

  get cursor() {
    const { rendered } = this;
    return rendered ? rendered.cursor : undefined;
  }

  get done() {
    const { rendered } = this;
    return !!(rendered && rendered.done);
  }

  get html() {
    return this._element.innerHTML;
  }

  get state() {
    const { rendered, response, done, html } = this;
    return trimObj({ rendered, response, done, html });
  }

}

export function * generateTestSteps({
  lorem,
  seed,
  stages = 2,
  rps = 1,
  fps = 60,
  speed = 1000,
  acceleration = 4,
  ...options
} = {}) {
  lorem = lorem || _lorem({ seed });
  const randomFn = lorem.prng.random.bind(lorem.prng);

  const timePerFrame = 1 / fps;
  const cursorFn = pacer({ speed, acceleration, randomFn });

  let responseIndex = 0;
  let stepIndex = 0;
  let elapsed = 0;
  let doneAt = undefined;

  function nextCursor() {
    const increment = cursorFn(0, doneAt ? doneAt * 1000 : undefined, elapsed * 1000, (elapsed + timePerFrame) * 1000);
    elapsed += timePerFrame;
    return { index: stepIndex++, type: 'cursor', increment };
  }

  for (let stageIndex = 0; stageIndex < stages; stageIndex++) {
    for (const response of generateTestResponsesPerStage(lorem, stageIndex, stageIndex === stages - 1, options)) {
      const currentResponseTime = elapsed;
      // yield response update
      yield {
        index: stepIndex++,
        type: 'response',
        response,
      };
      if (response.finished) {
        doneAt = currentResponseTime;
        break;
      }
      // roll a mocked elapsed time based on rps
      // let's pretend the latency = 0 - 10% of rps
      const nextResponseTime = (responseIndex + lorem.prng.random() / 10) / rps;
      const frameCount = Math.floor((nextResponseTime - elapsed) * fps);
      for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
        yield nextCursor();
      }
      responseIndex++;
      elapsed = nextResponseTime;
    }
  }
  // keep going with acceleration
  while (true) {
    yield nextCursor();
  }
}

function * generateTestResponsesPerStage(lorem, stageIndex, lastStage, options) {
  const value = lastStage ? generateTestAnswer(lorem, options) : capitalize(lorem.words.words({ size: [1, 5] })) + '...';
  const cutoffOptions = lastStage ? { min: 0, max: 10 } : { min: 0, max: 2 };
  const cutoffs = generateCutoffPoints(lorem, cutoffOptions);
  for (const cutoff of cutoffs) {
    yield {
      value: value.slice(0, Math.floor(cutoff * value.length)),
      stage: `stage_${stageIndex}`,
      finished: false,
    };
  }
  yield {
    value,
    stage: `stage_${stageIndex}`,
    finished: lastStage,
  };
}

function generateCutoffPoints(lorem, { min = 0, max = 5 } = {}) {
  const count = lorem.prng.randomInt(min, max);
  const cutoffs = [];
  for (let i = 0; i < count; i++) {
    cutoffs.push(lorem.prng.random());
  }
  cutoffs.sort((a, b) => a - b);
  return cutoffs;
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function generateTestAnswer(lorem, { sources: sourceCount = 5 } = {}) {
  // TODO: take a range array
  const sources = [];
  for (let i = 0; i < sourceCount; i++) {
    const url = `/posts/${lorem.words.words({ size: [1, 3], output: 'array' }).join('-')}`;
    sources.push({ url }); // URL is enough
  }
  const citation = {
    link: 1,
    start: '[',
    end: ']',
    unused: lorem.utils.shuffle([...Array(sources.length).keys()]),
  };
  return lorem.fields.answer({ sources, citation, format: 'markdown' });
}
