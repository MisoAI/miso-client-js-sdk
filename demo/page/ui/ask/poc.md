---
---

{% raw %}
<style>
  .btn-group * {
    box-shadow: none !important;
  }
  #reload-btn {
    margin-left: 0.5em;
  }
</style>
<section>
  <miso-ask-input>
  </miso-ask-input>
</section>
<script>
</script>
<hr>
<section>
  <miso-ask-answer></miso-ask-answer>
</section>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(() => {
  MisoClient.plugins.use('std:ui');
  const client = new MisoClient('...');
  const ask = client.ui.ask;
  ask.useSource(window.helpers.api);
  //ask.useApi('ask');
  //search.useLayout('list');
});
</script>
{% endraw %}
