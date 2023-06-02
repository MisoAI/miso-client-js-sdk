export function config({
  answer = {},
  speedRate,
} = {}) {
  const answerLanguages = Array.isArray(answer.languages) ? answer.languages : answer.languages ? [answer.languages] : [];

  window.helpers.fetch.intercept({
    request: (request) => {
      if (request.method.toLowerCase() === 'post' && request.url.indexOf('/api/ask/questions') > -1) {
        if (answerLanguages.length > 0) {}
        request.headers.append('x-answer-languages', answerLanguages.join(','));
      }
      if (typeof answer.format === 'string') {
        request.headers.append('x-answer-format', answer.format);
      }
      if (typeof answer.sampling === 'number') {
        request.headers.append('x-answer-sampling', `${answer.sampling}`);
      }
      if (typeof speedRate === 'number') {
        request.headers.append('x-speed-rate', `${speedRate}`);
      }
      return request;
    }
  });
}
