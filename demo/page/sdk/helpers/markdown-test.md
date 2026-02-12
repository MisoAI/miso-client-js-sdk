---
dependency: 'markdown-npm'
---

{% raw %}
<style>
#main {
  padding: 1rem;
}
.groups {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1rem;
}
.controls {
  position: sticky;
  top: 1rem;
  z-index: 1;
  width: fit-content;
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
}
.controls .input-group {
  width: auto;
  background-color: #fff;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
}
.controls .input-group-text {
  background-color: transparent;
}
.controls .button {
  cursor: pointer;
}
.mode-toggle [data-mode].selected {
  background-color: var(--color-primary-l7);
}
.groups[data-mode="code"] #answer-element-actual,
.groups[data-mode="code"] #answer-element-expected {
  display: none;
}
.groups[data-mode="element"] #answer-code-actual,
.groups[data-mode="element"] #answer-code-expected {
  display: none;
}
.groups .code {
  font-size: 0.75rem;
}
#seed {
  font-family: monospace;
}
#result {
  font-weight: bold;
}
</style>
{% endraw %}

<div id="main">
  <div class="controls">
    <div class="input-group seed-info">
      <span class="input-group-text">Seed</span>
      <span class="input-group-text" id="seed">...</span>
      <span class="input-group-text button" id="copy-seed">{% icon "copy" %}</span>
      <span class="input-group-text button" id="lock-seed">{% icon "lock" %}</span>
    </div>
    <div class="input-group step-info">
      <span class="input-group-text">Step</span>
      <span class="input-group-text" id="step">0</span>
      <span class="input-group-text" id="result">...</span>
    </div>
    <div class="input-group mode-toggle">
      <span class="input-group-text button" data-mode="element">Element</span>
      <span class="input-group-text button" data-mode="code">Code</span>
    </div>
  </div>
  <div class="groups" data-mode="element">
    <div class="group-element-actual">
      <h6>Actual</h6>
      <hr>
      <div id="answer-element-actual" class="miso-markdown"></div>
      <pre id="answer-code-actual" class="language-html code"><code class="language-html"></code></pre>
    </div>
    <div class="group-element-expected">
      <h6>Expected</h6>
      <hr>
      <div id="answer-element-expected" class="miso-markdown"></div>
      <pre id="answer-code-expected" class="language-html code"><code class="language-html"></code></pre>
    </div>
  </div>
</div>

<script async src="{{ '/js/markdown-test.js' | url }}"></script>
