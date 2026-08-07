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
    gap: 0.5rem;
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
    <div class="miso-history-demo__intro" visible-when="ready+empty">What can I help with?</div>
    <miso-messages></miso-messages>
    <miso-query visible-when="ready"></miso-query>
  </miso-conversation>
</div>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  MisoClient.plugins.use('std:ui');
  const client = new MisoClient(window.DEFAULT_HISTORY_API_KEY);
  client.context.auth = window.DEFAULT_AUTH;
  client.workflows.history.start();
});
</script>
{% endraw %}
