---
---

{% raw %}
<miso-list api="user_to_products" on:start="load">
  <script data-attr="payload" type="application/json">
    {
      "fl": ["*"],
      "rows": 8
    }
  </script>
  <template data-name="container" data-type="string">
    <div class="product-list"></div>
  </template>
  <template data-name="item" data-type="string">
    <div class="product-card row-4">
      <div>
        <div class="title">${ data.title }</div>
        <div class="image">
          <img src="${ data.cover_image }">
        </div>
        <div class="footer">$${ data.sale_price }</div>
      </div>
    </div>
  </template>
</miso-list>

<script>
new MisoClient('...');
</script>
{% endraw %}
