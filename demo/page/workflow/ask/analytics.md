---
---

{% raw %}
<style>
#miso-analytics {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 10;
  background-color: white;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid #ccc;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 1rem;
  row-gap: 0.5rem;
  align-items: baseline;
  font-family: monospace;
}
.miso-analytics-label {
  font-weight: bold;
  color: #666;
}
.miso-analytics-value {
  text-align: right;
}
</style>
<div>
  <a href="https://miso.ai">Miso.ai</a>
</div>
<h1 class="hero-title">Miso Answers</h1>
<div id="miso-ask-combo" class="miso-ask-combo"></div>
<div id="miso-analytics">
  <div class="miso-analytics-label">Waiting:</div>
  <div id="user-waiting-time" class="miso-analytics-value"></div>
  <div class="miso-analytics-label">Engaged:</div>
  <div id="user-engagement-time" class="miso-analytics-value"></div>
  <div class="miso-analytics-label">Idle:</div>
  <div id="user-idle-time" class="miso-analytics-value"></div>
  <div class="miso-analytics-label">Heartbeats:</div>
  <div id="heartbeat-count" class="miso-analytics-value"></div>
  <div class="miso-analytics-label">Generic Clicks:</div>
  <div id="generic-click-count" class="miso-analytics-value"></div>
</div>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  const client = new MisoClient(window.DEFAULT_ASK_API_KEY);
  await client.ui.ready;
  const { templates } = MisoClient.ui.defaults.ask;
  const rootElement = document.querySelector('#miso-ask-combo');
  rootElement.innerHTML = templates.root();
  client.ui.ask.autoQuery();
  const waitingTimeEl = document.querySelector('#user-waiting-time');
  const engagementTimeEl = document.querySelector('#user-engagement-time');
  const idleTimeEl = document.querySelector('#user-idle-time');
  const heartbeatCountEl = document.querySelector('#heartbeat-count');
  const genericClickCountEl = document.querySelector('#generic-click-count');
  function formatTime(ms) {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toFixed(3).padStart(6, '0')}`;
  }
  let heartbeatCount = 0;
  let genericClickCount = 0;
  client.ui.ask.on('interaction', (interaction) => {
    if (interaction.type !== 'custom') {
      return;
    }
    switch (interaction.custom_action_name) {
      case 'heartbeat':
        heartbeatCount++;
        heartbeatCountEl.textContent = heartbeatCount;
        break;
      case 'generic_click':
        genericClickCount++;
        genericClickCountEl.textContent = genericClickCount;
        break;
    }
  });
  setInterval(() => {
    const { analytics } = client.ui.ask;
    const { state } = analytics;
    const { userWaitingTime, userEngagementTime, userIdleTime } = state;
    waitingTimeEl.textContent = formatTime(userWaitingTime);
    engagementTimeEl.textContent = formatTime(userEngagementTime);
    idleTimeEl.textContent = formatTime(userIdleTime);
  }, 1000);
});
</script>
{% endraw %}
