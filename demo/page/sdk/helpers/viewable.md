---
---

Scroll down to trigger viewable event of target element.

{% raw %}
<style>
  .block {
    margin: 20px 0;
    width: 400px;
    height: 100vh;
    border: 2px dotted #CCC;
  }
  .target {
    margin: 20px 0;
    width: 400px;
    height: 200px;
    border: 2px solid #CCC;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    user-select: none;
  }
</style>
<div>
  <div class="target" data-id="0">
    <div class="title">
      Target 0
    </div>
    <div>
      <label for="target-0-checkbox">Viewable</label>
      <input type="checkbox" id="target-0-checkbox">
    </div>
  </div>
</div>
<div>
  <div class="block">
  </div>
</div>
<div>
  <div class="target" data-id="1">
    <div>
      Target 1
    </div>
    <div>
      <label for="target-1-checkbox">Viewable</label>
      <input type="checkbox" id="target-1-checkbox">
    </div>
  </div>
</div>
<script>
(async () => {
  for (const target of document.querySelectorAll('.target')) {
    (async (target) => {
      const input = target.querySelector('input');
      input.addEventListener('click', e => e.preventDefault());
      await MisoClient.helpers.viewable(target, { duration: 0 });
      input.checked = true;
      window.helpers.ui.alert(`Viewable: Target ${target.getAttribute('data-id')}`, { autohide: false, color: 'success' });
    })(target);
  }
})();
</script>
{% endraw %}
