---
---

<script async src="http://localhost:10099/dist/umd/miso.js?api_key=test&autostart=false"></script>
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
    client.ui.asks.on('error', (event) => {
      const workflow = event.workflow;
      const error = workflow.states.data.error;
      const errorMessage = error.message;
      console.error(error);
    });
  });
  MisoClient.ui.combo.ask.start();
});
</script>
{% endraw %}
