---
---

<script async src="http://localhost:10099/dist/umd/miso.js?api_key={{ DEFAULT_ASK_API_KEY }}&autostart=false"></script>
{% raw %}
<style>
.hero-title {
  text-align: center;
  margin: 2rem 0;
  font-size: 3rem;
  line-height: 2;
}
</style>
<style>
.miso-citation-tooltip .title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-weight: 600;
  width: max-content;
  max-width: 12rem;
  overflow: hidden;
  text-overflow: ellipsis;
}
.miso-citation-tooltip .date {
  display: block;
  margin-top: 0.5em;
}
</style>
<h1 class="hero-title">Miso Answers</h1>
<miso-ask-combo></miso-ask-combo>
<script>
(window.misocmd || (window.misocmd = [])).push(async () => {
  function onCitationLink({ addClass, setAttribute, setTooltipHtml, escapeHtml }, { source, index }) {
    addClass('my-custom-class');
    if (source) {
      setAttribute('data-title', source.title);
      const date = new Date(source.published_at).toLocaleDateString();
      setTooltipHtml(`<span class="title">${escapeHtml(source.title)}</span><span class="date">${date}</span>`);
    }
  }
  //const start = Date.now();
  MisoClient.on('create', (client) => {
    client.ui.asks.useLayouts({
      answer: {
        /*
        onDebug: ({ summary, timestamp, elapsed, ref, operation, conflict }) => {
          console.log(`[${(timestamp - start) / 1000}](${elapsed[0] / 1000}, ${elapsed[1] / 1000})`, summary, ref, `${operation}`, conflict);
        },
        */
        onCitationLink,
      },
    });
  });
  const combo = MisoClient.ui.combo.ask;
  combo.start();
});
</script>
{% endraw %}
