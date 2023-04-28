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
  <miso-answers>
    <miso-query></miso-query>
  </miso-answers>
</section>
<section>
  <miso-answers visible-when="ready">
    <div class="phrase">You asked about...</div>
    <miso-question></miso-question>
    <miso-answer></miso-answer>
    <miso-feedback></miso-feedback>
    <hr>
    <div class="phrase">My reply is based on the following:</div>
    <miso-sources></miso-sources>
    <div class="phrase" style="margin-top: 4rem;">Go beyond, and learn more about this topic:</div>
    <miso-related-resources></miso-related-resources>
  </miso-answers>
</section>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(() => {
  MisoClient.plugins.use('std:ui');
  const client = new MisoClient({
    apiKey: '...',
    apiHost: 'http://localhost:9901/api',
  });
});
</script>
{% endraw %}
