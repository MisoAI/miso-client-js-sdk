---
---

{% raw %}
<style>
.columns {
  display: flex;
  width: 100%;
  position: relative;
}
.columns > * {
  flex: 1;
  max-width: 50%;
}
</style>
<h1 class="hero-title">Miso Answers</h1>
<div class="columns">
  <div id="miso-ask-combo-0" class="miso-ask-combo"></div>
  <div id="miso-ask-combo-1" class="miso-ask-combo"></div>
</div>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  const client = new MisoClient(window.DEFAULT_ASK_API_KEY);
  await client.ui.ready;
  const { templates } = MisoClient.ui.defaults.ask;
  document.querySelector('#miso-ask-combo-0').innerHTML = templates.root();
  document.querySelector('#miso-ask-combo-1').innerHTML = templates.root();
  client.ui.ask.autoQuery();
});
</script>
{% endraw %}
