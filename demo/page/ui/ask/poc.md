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
  .phrase {
    font-size: .875rem;
    line-height: 1.2;
    margin: 1rem auto;
    color: #999;
  }
  .miso-list {
    --miso-list-item-height: 7rem;
    --miso-list-item-gap: 0.65rem;
    --miso-list-description-lines: 3;
  }
</style>
<section>
  <miso-ask-input></miso-ask-input>
</section>
<section>
  <miso-ask-results>
    <div class="phrase">You asked about...</div>
    <miso-ask-question></miso-ask-question>
    <miso-ask-answer></miso-ask-answer>
    <hr>
    <div class="phrase">My reply is based on the following:</div>
    <miso-ask-sources></miso-ask-sources>
  </miso-ask-results>
</section>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(() => {
  MisoClient.plugins.use('std:ui');
  const client = new MisoClient('...');
  const ask = client.ui.ask;
  ask.useSource(window.helpers.api);
});
</script>
{% endraw %}
