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
  .miso-history-demo-page {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  /* a mock site nav bar, hosting the dev controls */
  .miso-history-demo__nav {
    flex: none;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 1rem;
    border-bottom: 1px solid var(--miso-border-color-light);
  }
  .miso-history-demo__brand {
    font-weight: 600;
    color: var(--miso-text-color);
  }
  .miso-history-demo__touch {
    margin-left: auto;
  }
  .miso-history-demo {
    display: flex;
    gap: 1rem;
    flex: 1 1 auto;
    min-height: 0;
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
  /* conversation header: thread title on the left, subscription toggle on the
     right. The visible-when mechanism forces `display: block` on the element
     it toggles, so the flex row lives in an inner wrapper. */
  .miso-history-demo__header {
    flex: none;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--miso-border-color-light);
  }
  .miso-history-demo__header-row {
    display: flex;
    align-items: center;
    gap: gap: 0.5rem;
  }
  .miso-history-demo__header miso-title {
    flex: 0 1 auto;
    min-width: 0;
    font-size: 1.125rem;
  }
  .miso-history-demo__header miso-rename {
    flex: none;
  }
  .miso-history-demo__header miso-subscription {
    flex: none;
    margin-left: auto;
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
<div class="miso-history-demo-page">
  <nav class="miso-history-demo__nav">
    <span class="miso-history-demo__brand">Lorem</span>
    <button type="button" class="miso-history-demo__touch btn btn-sm btn-outline-primary">+ Update</button>
  </nav>
  <div class="miso-history-demo">
    <miso-history>
      <miso-new-thread></miso-new-thread>
      <miso-threads></miso-threads>
    </miso-history>
    <miso-conversation>
      <div class="miso-history-demo__header" visible-when="nonempty">
        <div class="miso-history-demo__header-row">
          <miso-title></miso-title>
          <miso-rename></miso-rename>
          <miso-subscription></miso-subscription>
        </div>
      </div>
      <div class="miso-history-demo__intro" visible-when="empty">What can I help with?</div>
      <miso-messages></miso-messages>
      <miso-query visible-when="ready"></miso-query>
    </miso-conversation>
  </div>
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
  // simulate server-side activity: touch a random thread, generating a fresh
  // answer in it, so the update indicators can be exercised on demand
  document.querySelector('.miso-history-demo__touch').addEventListener('click', () => {
    const { userHistory } = MisoClient.lorem.api.ask;
    const { threads } = userHistory.threads();
    if (!threads.length) {
      return;
    }
    const { thread_id } = threads[Math.floor(Math.random() * threads.length)];
    userHistory.touchThread(thread_id, { generate: true });
  });
});
</script>
{% endraw %}
