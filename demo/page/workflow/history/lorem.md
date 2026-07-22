---
---

{% raw %}
<style>
  .miso-history-demo {
    display: flex;
    gap: 1rem;
    height: calc(100vh - 12rem);
    min-height: 24rem;
    margin: 1rem;
  }
  .miso-history-demo miso-history {
    flex: 0 0 18rem;
    padding: 0.75rem;
    overflow-y: auto;
    background-color: #f4f4f8;
    border-radius: 0.75rem;
  }
  .miso-history-demo miso-thread {
    flex: 1 1 auto;
    min-width: 0;
    padding: 1.5rem;
    overflow-y: auto;
    border: 1px solid var(--miso-border-color-light);
    border-radius: 0.75rem;
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
