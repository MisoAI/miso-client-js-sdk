---
---

{% raw %}
<h1 class="hero-title">Miso Answers</h1>
<div id="miso-ask-combo" class="miso-ask-combo"></div>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  const client = new MisoClient(window.DEFAULT_ASK_API_KEY);
  await client.ui.ready;
  const { templates, wireFollowUps, wireRelatedResources } = MisoClient.ui.defaults.ask;
  const rootElement = document.querySelector('#miso-ask-combo');
  const FOLLOW_UP_QUESTIONS_REGEXP = /<miso-ask class="miso-ask-combo__follow-up-questions-container .+?<\/miso-ask>/;
  // 1. suppose user has a custom root template with uses <div> instead of <miso-follow-ups>
  rootElement.innerHTML = templates.root().replaceAll('miso-follow-ups', 'div').replace(FOLLOW_UP_QUESTIONS_REGEXP, '');
  // 2. suppose user has a custom follow-up template
  const querySuggestions = options => `<miso-ask class="miso-ask-combo__query-suggestions-container miso-circled-citation-index" visible-when="initial+nonempty" logo="false" parent-question-id="${options.parentQuestionId}" status="ready nonempty done"><h3 class="miso-ask-combo__phrase miso-ask-combo__query-suggestions-phrase">Related questions you can explore</h3><miso-query-suggestions></miso-query-suggestions></miso-ask>`;
  wireFollowUps(client, rootElement.querySelector(`.miso-ask-combo__follow-ups`), {
    template: options => templates.followUp(options).replace('<miso-ask', `<h3>${options.x}</h3>${querySuggestions(options)}<miso-ask`).replace(FOLLOW_UP_QUESTIONS_REGEXP, ''),
    x: 'This is a legacy custom follow-up template'
  });
  wireRelatedResources(client, rootElement.querySelector(`.miso-ask-combo__related-resources`));
  client.ui.ask.autoQuery();
});
</script>
{% endraw %}
