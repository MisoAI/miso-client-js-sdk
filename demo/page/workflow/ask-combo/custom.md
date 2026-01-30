---
---

<script async src="http://localhost:10099/dist/umd/miso.js?api_key={{ DEFAULT_ASK_API_KEY }}&autostart=false"></script>
{% raw %}
<style>
main {
  padding: 0;
}
.hero-title {
  text-align: center;
  margin: 2rem 0;
  font-size: 3rem;
  line-height: 2;
}
</style>
<h1 class="hero-title">Miso Answers</h1>
<miso-ask-combo></miso-ask-combo>
<script>
(window.misocmd || (window.misocmd = [])).push(async () => {
  MisoClient.on('create', (client) => {
    // TODO: clean up on another input
    client.ui.asks.on('ready', (event) => {
      const comboElement = document.querySelector('miso-ask-combo');
      const feedbackElement = comboElement.querySelector('miso-feedback');
      feedbackElement.insertAdjacentHTML('afterend', `
        <style>
        .miso-notice {
          display: flex;
          gap: 1rem;
        }
        .miso-notice-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 0.3rem;
          width: 2rem;
          height: 2rem;
          border-radius: 9999px;
          background-color: #777;
          color: #fff;
        }
        .miso-notice-icon i {
          font-style: normal;
          font-size: 1.5rem;
          font-weight: 500;
        }
        </style>
        <hr>
        <div class="miso-notice">
          <div class="miso-notice-icon"><i>!</i></div>
          <div class="miso-notice-content">Custom notice message.<br>Second line.</div>
        </div>
      `);
    });
  });
  const combo = MisoClient.ui.combo.ask;
  combo.config({
    api: {
      yearly_decay: 0.5,
    },
    phrases: {
      relatedQuestions: `[Modified!] Related questions you can explore`,
      related_resources: `[Modified!] Go beyond, and learn more about this topic`,
    },
  });
  combo.start();
});
</script>
{% endraw %}
