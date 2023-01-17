---
---

Click mode: lenient = true

{% raw %}
<style>
  .block {
    margin: 20px 0;
    width: 400px;
    height: 100vh;
    border: 2px dotted #CCC;
  }
  .target {
    margin: 20px;
    width: 400px;
    height: 200px;
    border: 2px solid #CCC;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    user-select: none;
  }
  .unit {
    list-style: none;
    margin: 20px 0;
    padding: 0;
    width: 400px;
  }
  .item {
    height: 80px;
    margin: 20px 0;
    border: 1px solid #CCC;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    user-select: none;
  }
</style>
<hr>
<div>
  <h3>Recommendation Unit</h3>
  <ul id="unit" class="unit" data-miso-unit-id="unit-1">
    <li id="product-1" class="item" data-miso-product-id="product-1">
      <a href="#">Product 1</a>
    </li>
    <li id="product-2" class="item" data-miso-product-id="product-2">
      <a href="#">Product 2 (prevents default)</a>
    </li>
    <li id="product-3" class="item" data-miso-product-id="product-3">
      <span>Product 3</span>
    </li>
  </ul>
</div>
<script>
MisoClient.plugins.use('std:units');
const client = new MisoClient('...');
const element = document.querySelector('#unit');
client.units.get(element).tracker.start({
  click: {
    lenient: true,
  }
});
document.querySelector('[data-miso-product-id="product-2"]').addEventListener('click', e => e.preventDefault());
</script>
{% endraw %}
