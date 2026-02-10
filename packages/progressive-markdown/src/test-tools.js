import { pacer } from '@miso.ai/commons';
import { lorem as _lorem } from '@miso.ai/lorem';
import Renderer from './renderer.js';
import { resolvePresets } from './preset/index.js';

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
    return rendered && rendered.done;
  }

  get html() {
    return this._element.innerHTML;
  }

}

export function * generateTestSteps({
  seed,
  stages = 2,
  rps = 1,
  fps = 60,
  speed = 1000,
  acceleration = 4,
  ...options
} = {}) {
  const lorem = _lorem({ seed });

  const timePerFrame = 1 / fps;
  const cursorFn = pacer({ speed, acceleration });

  let responseIndex = 0;
  let elapsed = 0;
  let doneAt = undefined;
  let cursor = 0;

  function nextCursor() {
    const increment = cursorFn(0, doneAt ? doneAt * 1000 : undefined, elapsed * 1000, (elapsed + timePerFrame) * 1000);
    elapsed += timePerFrame;
    return { type: 'cursor', increment };
  }

  for (let stageIndex = 0; stageIndex < stages; stageIndex++) {
    // clear cursor at the beginning of each stage
    cursor = 0;
    for (const response of generateTestResponsesPerStage(lorem, stageIndex, stageIndex === stages - 1, options)) {
      const currentResponseTime = elapsed;
      // yield response update
      yield {
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
