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
  .miso-history-demo miso-history {
    flex: 0 0 20rem;
    overflow-y: auto;
    padding-right: 1rem;
    border-right: 1px solid var(--miso-border-color-light);
  }
  .miso-history-demo miso-conversation {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-width: 0;
    overflow: hidden;
  }
  .miso-history-demo miso-messages {
    flex: 1 1 auto;
    overflow-y: auto;
  }
  .miso-history-demo miso-query {
    flex: none;
  }
  /* new-thread (empty) state: intro headline + composer centered in the panel */
  .miso-history-demo miso-conversation[status~="empty"] {
    justify-content: center;
  }
  .miso-history-demo miso-conversation[status~="empty"] miso-messages {
    flex: 0 0 auto;
  }
  .miso-history-demo .miso-history-demo__intro {
    margin-bottom: 0.5rem;
    font-size: 1.75rem;
    font-weight: 600;
    text-align: center;
    color: var(--miso-text-color);
  }
</style>
<div class="miso-history-demo">
  <miso-history>
    <miso-threads></miso-threads>
  </miso-history>
  <miso-conversation>
    <div class="miso-history-demo__intro" visible-when="empty">What can I help with?</div>
    <miso-messages></miso-messages>
    <miso-query visible-when="ready"></miso-query>
  </miso-conversation>
</div>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  MisoClient.plugins.use('std:ui');
  await MisoClient.plugins.install('std:lorem');
  MisoClient.plugins.use('std:lorem');
  // seed the user history with server-side threads, some unread
  MisoClient.lorem.api.ask.userHistory.generateThreads({ rows: 12 }, { seed: 42 });
  const client = new MisoClient({
    apiKey: '...',
  });
  client.workflows.history.start();
});
</script>
{% endraw %}
