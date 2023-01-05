---
---

Scroll down to see the recommendation unit.

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
<div>
  <div class="block">
  </div>
</div>
<div>
  <h3>Recommendation Unit</h3>
  <ul id="unit" class="unit" data-miso-unit-id="unit-0001">
    <li id="product-0001" class="item" data-miso-product-id="product-0001">
      <a href="#product-0001">Product 1</a>
    </li>
    <li id="product-0002" class="item" data-miso-product-id="product-0002">
      <a href="#product-0002">Product 2</a>
    </li>
    <li id="product-0003" class="item" data-miso-product-id="product-0003">
      <a href="#product-0003">Product 3</a>
    </li>
    <li id="product-0004" class="item" data-miso-product-id="product-0004">
      <a href="#product-0004">Product 4</a>
    </li>
  </ul>
</div>
<script>
MisoClient.plugins.use('std:units');
const client = new MisoClient('...');
const element = document.querySelector('#unit');
client.units.get(element).tracker.start();
</script>
{% endraw %}
