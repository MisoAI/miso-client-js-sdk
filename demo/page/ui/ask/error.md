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
  .miso-error {
    border: 1px solid #ccc;
    padding: 1rem;
    display: inline-block;
    margin-top: 0;
    border-radius: 0.5rem;
  }
  .error-header {
    margin-top: 1rem;
  }
</style>
<section>
  <miso-ask>
    <miso-query></miso-query>
  </miso-ask>
</section>
<section>
  <miso-ask visible-when="erroneous">
    <h2 class="error-header">Oops!</h2>
    <hr>
    <p>
      We are currently experiencing some difficulties. Would you mind trying again later?
    </p>
    <miso-error></miso-error>
  </miso-ask>
  <miso-ask visible-when="ready">
    <div class="phrase">You asked about...</div>
    <miso-question></miso-question>
    <hr>
    <miso-answer></miso-answer>
    <miso-feedback></miso-feedback>
    <hr>
    <div class="phrase">My reply is based on the following:</div>
    <miso-sources></miso-sources>
    <div class="phrase" style="margin-top: 4rem;">Go beyond, and learn more about this topic:</div>
    <miso-related-resources></miso-related-resources>
  </miso-ask>
</section>
<script src="https://www.unpkg.com/@miso.ai/doggoganger@beta/dist/umd/doggoganger-browser.min.js"></script>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  MisoClient.plugins.use('std:ui');
  const client = new MisoClient({
    apiKey: '...',
    apiHost: 'http://localhost:9901/api',
  });
  const workflow = client.ui.ask;
  workflow.useApi(false);
  const api = window.doggoganger.buildApi();
  workflow.on('input', async ({ session, payload }) => {
    const answer = await api.ask.questions(payload);
    const start = Date.now();
    let intervalId;
    intervalId = setInterval(async () => {
      const elapsed = Date.now() - start;
      if (elapsed > 5000) {
        clearInterval(intervalId);
        const error = new Error(`Emulated timeout: ${elapsed / 1000} seconds`);
        workflow.updateData({ session, error });
        return;
      }
      const value = await answer.get();
      const { finished } = value;
      finished && clearInterval(intervalId);
      workflow.updateData({ session, value, ongoing: !finished });
    }, 1000);
  });
});
</script>
{% endraw %}
