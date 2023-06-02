export function postProcessQuestionsResponse(response) {
  const _meta = {
    answer_stage: response.answer_stage,
  };
  return { ...response, _meta };
}
