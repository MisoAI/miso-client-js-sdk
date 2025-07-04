---
---

{% raw %}
<style>
  #demo {
    padding: 1rem;
  }
</style>
<p>
  There should be spacing between highlighted words "Lorem" and "ipsum", in both title and description.
</p>
<miso-search logo="false">
  <miso-products></miso-products>
</miso-search>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(() => {
  MisoClient.plugins.use('std:ui');
  const client = new MisoClient('...');
  const workflow = client.ui.search;
  workflow.useApi(false);
  workflow.useInteractions(false);
  const { session } = workflow;
  workflow.updateData({
    session,
    value: {
      products: [
        {
          _title_with_markups: 'Lorem ipsum, <mark>Lorem</mark> <mark>ipsum</mark>.',
          snippet: 'Lorem ipsum, <mark>Lorem</mark> <mark>ipsum</mark>, <mark>Lorem</mark> <mark>ipsum</mark>.',
        },
      ],
    },
  });
});
</script>
{% endraw %}
