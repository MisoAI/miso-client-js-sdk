{% raw %}
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  // TODO: make this universal by explcitly loading the SDK after this, or hack misocmd
  if (window._pw$) { await window._pw$; }
  // setup client
  const MisoClient = window.MisoClient;
  const client = new MisoClient('...');
  const workflow = client.ui.hybridSearch;
  workflow.useApi(false);
  async function mockApi({ session, group, name, payload }) {
    if (!payload) {
      return;
    }
    const request = { group, name, payload };
    const { rows = 10 } = payload;
    const { page = 0 } = payload._meta || {};
    const total = 100 + page;
    const facet_counts = {
      facet_fields: {
        categories: [['A', 90 + page], ['B', 80 + page], ['C', 70 + page]],
      },
    };
    const products = [];
    for (let i = 0; i < rows; i++) {
      products.push({
        product_id: `p_${page * rows + i}`,
      });
    }
    (page > 0 ? workflow.results : workflow.answer).updateData({
      session,
      request,
      value: {
        products,
        total,
        facet_counts,
      },
    });
  }
  // TODO: extract to utils
  function compareFacetCounts(facetCounts0, facetCounts1) {
    const facetFields0 = facetCounts0.facet_fields;
    const facetFields1 = facetCounts1.facet_fields;
    if (Object.keys(facetFields0).length !== Object.keys(facetFields1).length) {
      return false;
    }
    for (const field in facetFields0) {
      if (!compareFacetFields(facetFields0[field], facetFields1[field])) {
        return false;
      }
    }
    return true;
  }
  function compareFacetFields(facetFields0, facetFields1) {
    if (facetFields0.length !== facetFields1.length) {
      return false;
    }
    for (let i = 0; i < facetFields0.length; i++) {
      if (facetFields0[i][0] !== facetFields1[i][0] || facetFields0[i][1] !== facetFields1[i][1]) {
        return false;
      }
    }
    return true;
  }
  // TODO: use the main workflow
  workflow.answer.on('request', mockApi);
  workflow.results.on('request', mockApi);
  workflow.query({ q: 'LLM' });
  const data0 = workflow.results.states.data.value;
  workflow.results._more();
  const data1 = workflow.results.states.data.value;
  if (data1.products.length !== data0.products.length + 10) {
    throw new Error(`Expected ${data0.products.length + 10} products, but got ${data1.products.length}`);
  }
  if (data1.total !== data0.total) {
    throw new Error(`Expected ${data0.total} total, but got ${data1.total}`);
  }
  if (!compareFacetCounts(data0.facet_counts, data1.facet_counts)) {
    throw new Error(`Expected facet_counts to be the same, but got different values`);
  }
  window.pw && window.pw.done();
});
</script>
{% endraw %}
