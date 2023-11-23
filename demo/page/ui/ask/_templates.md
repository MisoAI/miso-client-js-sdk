{% raw %}
<script>
(() => {
  function root() {
    return `
<section id="miso-ask-combo__question" class="miso-ask-combo__section miso-ask-combo__question">
  <miso-ask class="miso-ask-combo__query-container" status="initial nonempty">
    <miso-query></miso-query>
  </miso-ask>
</section>
<section class="miso-ask-combo__section miso-ask-combo__answer">
  <miso-ask class="miso-ask-combo__answer-container miso-circled-citation-index" visible-when="ready" logo="false" status="initial nonempty">
    <div class="miso-ask-combo__phrase miso-ask-combo__question-phrase">You asked...</div>
    <miso-question></miso-question>
    <miso-answer></miso-answer>
    <miso-feedback></miso-feedback>
  </miso-ask>
  <miso-ask class="miso-ask-combo__sources-container miso-circled-citation-index" visible-when="nonempty" logo="false" status="initial empty">
    <hr>
    <h3 class="miso-ask-combo__phrase miso-ask-combo__sources-phrase">My reply is based on the following</h3>
    <miso-sources></miso-sources>
  </miso-ask>
  <miso-ask class="miso-ask-combo__bottom-spacing-container" visible-when="ongoing" status="initial empty"></miso-ask>
</section>
<div id="miso-ask-combo__follow-ups" class="miso-ask-combo__follow-ups"></div>
<section id="miso-ask-combo__related-resources" class="miso-ask-combo__section miso-ask-combo__related-resources">
  <miso-ask visible-when="nonempty" logo="true" status="initial empty">
    <h2 class="miso-ask-combo__phrase miso-ask-combo__related-resources-phrase">Go beyond, and learn more about this topic</h2>
    <miso-related-resources></miso-related-resources>
  </miso-ask>
</section>`.trim();
  };
  function followUp(parentQuestionId) {
    return `
<section class="miso-ask-combo__section miso-ask-combo__follow-up">
  <miso-ask class="miso-ask-combo__query-suggestions-container" visible-when="initial+nonempty" parent-question-id="${parentQuestionId}">
    <h3 class="miso-ask-combo__phrase miso-ask-combo__related-questions-phrase">Related questions you can explore</h3>
    <miso-query-suggestions></miso-query-suggestions>
  </miso-ask>
  <miso-ask class="miso-ask-combo__query-container" visible-when="initial loading" parent-question-id="${parentQuestionId}">
    <miso-query></miso-query>
  </miso-ask>
  <miso-ask class="miso-ask-combo__answer-container miso-circled-citation-index" visible-when="ready" logo="false" parent-question-id="${parentQuestionId}">
    <hr>
    <div class="miso-ask-combo__phrase miso-ask-combo__question-phrase">You asked...</div>
    <miso-question></miso-question>
    <miso-answer></miso-answer>
    <miso-feedback></miso-feedback>
  </miso-ask>
  <miso-ask class="miso-ask-combo__sources-container miso-circled-citation-index" visible-when="nonempty" logo="false" parent-question-id="${parentQuestionId}">
    <hr>
    <h3 class="miso-ask-combo__phrase miso-ask-combo__sources-phrase">My reply is based on the following</h3>
    <miso-sources></miso-sources>
  </miso-ask>
</section>`.trim();
  }
window.templates = {
  root,
  followUp,
};
})();
</script>
{% endraw %}
