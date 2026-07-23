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
  .miso-history-demo miso-thread {
    flex: 1 1 auto;
    overflow-y: auto;
  }
  .miso-history-demo .miso-history-demo__placeholder {
    color: var(--miso-text-color-gray);
    text-align: center;
    margin-top: 4rem;
  }
</style>
<div class="miso-history-demo">
  <miso-history>
    <miso-threads></miso-threads>
  </miso-history>
  <miso-thread>
    <div class="miso-history-demo__placeholder" visible-when="initial">Select a thread to view the conversation</div>
    <miso-messages></miso-messages>
  </miso-thread>
</div>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  MisoClient.plugins.use('std:ui');
  await MisoClient.plugins.install('std:lorem');
  // huge speed rate -> past answers are all finished, rather than streaming
  MisoClient.plugins.use('std:lorem', { speedRate: 1e9 });
  // seed the user history with server-side threads, some unread
  MisoClient.lorem.api.ask.userHistory.generateThreads({ rows: 12 }, { seed: 42 });
  const client = new MisoClient({
    apiKey: '...',
  });
  client.workflows.history.start();
});
</script>
{% endraw %}
