---
---

{% raw %}
<style>
  html, body, main, #demo {
    height: 100%;
    margin: 0;
  }
  body {
    display: flex;
    flex-direction: column;
    padding: 0;
  }
  footer {
    display: none;
  }
  body.base .miso-body-container {
    height: 100%;
    overflow: hidden;
    grid-template-rows: minmax(0, 1fr);
  }
  .miso-history-demo {
    display: flex;
    gap: 1rem;
    height: 100%;
    padding: 1rem;
  }
  /* the panels take the SDK's default styles by their class names
     (miso-history, miso-conversation); only the page layout is set here */
  .miso-history-demo miso-history {
    flex: 0 0 20rem;
    padding-right: 1rem;
    border-right: 1px solid var(--miso-border-color-light);
  }
  .miso-history-demo miso-conversation {
    flex: 1 1 auto;
  }
</style>
<div class="miso-history-demo">
  <miso-history class="miso-history">
    <miso-new-thread></miso-new-thread>
    <miso-threads></miso-threads>
  </miso-history>
  <miso-conversation class="miso-conversation">
    <div class="miso-conversation__header" visible-when="nonempty">
      <div class="miso-conversation__header-row">
        <miso-title></miso-title>
        <miso-rename></miso-rename>
        <miso-delete></miso-delete>
        <miso-subscription></miso-subscription>
      </div>
    </div>
    <div class="miso-conversation__intro" visible-when="ready+empty">What can I help with?</div>
    <miso-messages></miso-messages>
    <miso-query visible-when="ready"></miso-query>
  </miso-conversation>
</div>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  MisoClient.plugins.use('std:ui');
  const client = new MisoClient(window.DEFAULT_HISTORY_API_KEY);
  client.context.auth = `Bearer ${window.JWT_TOKEN}`;
  client.workflows.history.start();
});
</script>
{% endraw %}
