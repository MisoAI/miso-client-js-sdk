---
---

<script async src="http://localhost:10099/dist/umd/miso.js?lorem&autostart=false"></script>
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
  MisoClient.ui.combo.ask.config({
    features: {
      relatedResources: false,
    },
  });
  MisoClient.ui.combo.ask.start();
});
</script>
{% endraw %}
