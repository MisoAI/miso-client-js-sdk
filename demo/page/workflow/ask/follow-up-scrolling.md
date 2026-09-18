---
---

{% raw %}
<style>
#miso-ask-combo {
  margin-bottom: 50vh;
}
</style>
<h1 class="hero-title">Miso Answers</h1>
<div id="miso-ask-combo" class="miso-ask-combo"></div>
<script>
function modifyMisoFollowUpsElementScrollIntoView() {
  const MisoFollowUpsElement = customElements.get('miso-follow-ups');
  MisoFollowUpsElement.prototype._wire = function(context) {
    if (!context) {
      return;
    }
    if (!context._autoNextFn) {
      context.autoNext();
    }
    this._unsubscribes.push(context.on('create', (workflow) => {
      const { parentQuestionId } = workflow;
      const template = workflow._options.resolved.templates.followUp;
      if (!parentQuestionId || !template) {
        return;
      }
      const oldChildCount = this.children.length;
      this.insertAdjacentHTML('beforeend', template({ parentQuestionId }));
      const newChildCount = this.children.length;
      for (const element of Array.prototype.slice.call(this.children, oldChildCount, newChildCount)) {
        this._elementToWorkflow.set(element, workflow);
      }
    }));
    this._unsubscribes.push(context.on('loading', ({ workflow }) => {
      for (const element of this.children) {
        if (this._elementToWorkflow.get(element) === workflow) {
          // change the scrollIntoView block to 'nearest' to prevent the workflow from scrolling too far up
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          break;
        }
      }
    }));
    this._unsubscribes.push(context.on('destroy', ({ workflow }) => {
      for (const element of this.children) {
        if (this._elementToWorkflow.get(element) === workflow) {
          this._elementToWorkflow.delete(element);
          element.remove();
        }
      }
    }));
  };
}
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  const client = new MisoClient(window.DEFAULT_ASK_API_KEY);
  client.ui.asks.autocomplete.enable();
  await client.ui.ready;
  modifyMisoFollowUpsElementScrollIntoView();
  const { templates } = MisoClient.ui.defaults.ask;
  const rootElement = document.querySelector('#miso-ask-combo');
  rootElement.innerHTML = templates.root();
  client.ui.ask.autoQuery();
});
</script>
{% endraw %}
