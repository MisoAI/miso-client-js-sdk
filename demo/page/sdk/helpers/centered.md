---
---

Scroll down to trigger viewable/centered events of target elements. The dashed line marks the viewport center: `centered()` resolves when a target straddles it for 1 second. Target 1 is much taller than the viewport, so it can never reach the 50% visible area required by `viewable()` — only `centered()` catches it.

{% raw %}
<style>
  .center-line {
    position: fixed;
    top: 50vh;
    left: 0;
    right: 0;
    border-top: 2px dashed #DC3545;
    pointer-events: none;
    z-index: 100;
  }
  .center-line > span {
    position: absolute;
    right: 8px;
    bottom: 4px;
    color: #DC3545;
    font-size: 12px;
  }
  .block {
    margin: 20px 0;
    width: 400px;
    height: 100vh;
    border: 2px dotted #CCC;
  }
  .target {
    margin: 20px 0;
    width: 400px;
    border: 2px solid #CCC;
  }
  .target[data-id="0"] {
    height: 200px;
  }
  .target[data-id="1"] {
    height: 300vh;
  }
  .target .status {
    position: sticky;
    top: 35vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px 0;
    user-select: none;
  }
</style>
<div class="center-line"><span>viewport center</span></div>
<div>
  <div class="target" data-id="0">
    <div class="status">
      <div class="title">
        Target 0 (200px)
      </div>
      <div>
        <label for="target-0-viewable">Viewable</label>
        <input type="checkbox" id="target-0-viewable" class="viewable">
      </div>
      <div>
        <label for="target-0-centered">Centered</label>
        <input type="checkbox" id="target-0-centered" class="centered">
      </div>
    </div>
  </div>
</div>
<div>
  <div class="block">
  </div>
</div>
<div>
  <div class="target" data-id="1">
    <div class="status">
      <div class="title">
        Target 1 (300vh)
      </div>
      <div>
        <label for="target-1-viewable">Viewable</label>
        <input type="checkbox" id="target-1-viewable" class="viewable">
      </div>
      <div>
        <label for="target-1-centered">Centered</label>
        <input type="checkbox" id="target-1-centered" class="centered">
      </div>
    </div>
  </div>
</div>
<div>
  <div class="block">
  </div>
</div>
<script>
(async () => {
  for (const target of document.querySelectorAll('.target')) {
    const id = target.getAttribute('data-id');
    for (const input of target.querySelectorAll('input')) {
      input.addEventListener('click', e => e.preventDefault());
    }
    (async () => {
      await MisoClient.helpers.viewable(target, { duration: 1000 });
      target.querySelector('input.viewable').checked = true;
      window.helpers.ui.alert(`Viewable: Target ${id}`, { autohide: false, color: 'success' });
    })();
    (async () => {
      await MisoClient.helpers.centered(target, { duration: 1000 });
      target.querySelector('input.centered').checked = true;
      window.helpers.ui.alert(`Centered: Target ${id}`, { autohide: false, color: 'primary' });
    })();
  }
})();
</script>
{% endraw %}
