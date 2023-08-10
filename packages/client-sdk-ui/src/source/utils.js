export function postProcessQuestionsResponse(response) {
  if (!response) {
    return response;
  }
  const _meta = {
    answer_stage: response.answer_stage,
  };
  return { ...response, _meta };
}
