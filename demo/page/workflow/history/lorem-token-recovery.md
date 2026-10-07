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
  .miso-history-demo__status {
    font-size: 0.875rem;
    color: var(--miso-text-color);
  }
  .miso-history-demo {
    display: flex;
    gap: 1rem;
    flex: 1 1 auto;
    min-height: 0;
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
<div class="miso-history-demo-page">
  <nav class="miso-history-demo__nav">
    <span class="miso-history-demo__brand">Lorem</span>
    <button type="button" class="miso-history-demo__touch btn btn-sm btn-outline-primary">+ Update</button>
    <span class="miso-history-demo__status"></span>
    <button type="button" class="miso-history-demo__expire btn btn-sm btn-outline-danger">Expire JWT</button>
  </nav>
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
</div>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  MisoClient.plugins.use('std:ui');
  await MisoClient.plugins.install('std:lorem');
  // mock latency exposes issues in the loading phase
  MisoClient.plugins.use('std:lorem', { latency: 500 });
  // seed the user history with server-side threads, some unread
  const { userHistory } = MisoClient.lorem.api.ask;
  userHistory.generateThreads({ rows: 12 }, { seed: 42 });
  // one long thread, to exercise the message paging (infinite scroll up:
  // 40 questions page in 30 + 10, their contents in batches of 10)
  userHistory.generateThreads({ rows: 1, questionRows: 40 }, { seed: 43 });
  // touch a few threads up front, so update indicators show right away
  userHistory.threads().threads.filter(t => t.subscribed).slice(0, 3).forEach((thread, i) => {
    userHistory.touchThread(thread.thread_id, { generate: true }, { seed: 100 + i });
  });
  const client = new MisoClient('...');
  // sign in with a mocked JWT, so the token expiration can be simulated
  client.context.auth = `Bearer ${MisoClient.lorem.api.me().jwt}`;
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
  // simulate the JWT expiring mid-flow: bumping the token generation makes
  // the mock API reject every token issued so far with 401
  document.querySelector('.miso-history-demo__expire').addEventListener('click', () => {
    MisoClient.lorem.api.bumpGeneration();
    setStatus('JWT expired');
  });
  // token recovery: a request rejected with 401 renews the token and is sent
  // again, so the expiration goes unnoticed in the UI
  const statusElement = document.querySelector('.miso-history-demo__status');
  function setStatus(text) {
    statusElement.textContent = text;
  }
  // stands in for a round trip to the site's own auth endpoint
  async function fetchToken() {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return MisoClient.lorem.api.me().jwt;
  }
  let renewals = 0;
  let renewing;
  async function renewToken(hold) {
    // hold the requests issued from now on, so they wait for the new token
    // rather than fail on the expired one
    const unhold = hold();
    setStatus('Renewing JWT...');
    try {
      client.context.auth = `Bearer ${await fetchToken()}`;
      setStatus(`JWT renewed (${++renewals})`);
    } catch (e) {
      setStatus('JWT renewal failed');
      throw e;
    } finally {
      unhold();
      renewing = undefined;
    }
  }
  client.api.onError = async (error, { hold, resend }) => {
    // not ours to recover: fail as usual. Neither is a request rejected again
    // after it was resent with a renewed token — giving up there keeps a
    // persistent 401 from looping
    if (error.status !== 401 || error.resent) {
      throw error;
    }
    // several requests may be in flight when the token expires, each ending
    // up here with its own 401: they all share a single renewal
    await (renewing || (renewing = renewToken(hold)));
    return resend();
  };
  //client.workflows.history.useApi({ rows: 5 });
  client.workflows.history.start();
});
</script>
{% endraw %}
