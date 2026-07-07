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
.groups[data-mode="dom"] #answer-html-actual,
.groups[data-mode="dom"] #answer-html-expected,
.groups[data-mode="dom"] #answer-md-actual,
.groups[data-mode="dom"] #answer-md-expected,
.groups[data-mode="dom"] #answer-tree-actual,
.groups[data-mode="dom"] #answer-tree-expected {
  display: none;
}
.groups[data-mode="html"] #answer-dom-actual,
.groups[data-mode="html"] #answer-dom-expected,
.groups[data-mode="html"] #answer-md-actual,
.groups[data-mode="html"] #answer-md-expected,
.groups[data-mode="html"] #answer-tree-actual,
.groups[data-mode="html"] #answer-tree-expected {
  display: none;
}
.groups[data-mode="md"] #answer-dom-actual,
.groups[data-mode="md"] #answer-dom-expected,
.groups[data-mode="md"] #answer-html-actual,
.groups[data-mode="md"] #answer-html-expected,
.groups[data-mode="md"] #answer-tree-actual,
.groups[data-mode="md"] #answer-tree-expected {
  display: none;
}
.groups[data-mode="tree"] #answer-dom-actual,
.groups[data-mode="tree"] #answer-dom-expected,
.groups[data-mode="tree"] #answer-html-actual,
.groups[data-mode="tree"] #answer-html-expected,
.groups[data-mode="tree"] #answer-md-actual,
.groups[data-mode="tree"] #answer-md-expected {
  display: none;
}
.groups .code {
  font-size: 0.75rem;
}
.tree {
  font-family: var(--font-family-monospace, monospace);
  font-size: 0.75rem;
  line-height: 1.5;
}
.tree .children {
  margin-left: 0.5rem;
  padding-left: 0.75rem;
  border-left: 1px solid #ddd;
}
.tree .label {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}
.tree .tag {
  color: #905;
}
.tree .value {
  color: #690;
  white-space: pre-wrap;
}
.tree .type {
  color: #555;
  font-style: italic;
}
.tree .bounds {
  color: #999;
}
.tree .atomic {
  font-size: 0.625rem;
  line-height: 1.2;
  padding: 0 0.375rem;
  border-radius: 0.5rem;
  background-color: var(--color-primary-l7, #eee);
}
#result {
  font-weight: bold;
}
</style>
{% endraw %}

<div id="main">
  <div class="controls">
    <div class="input-group seed-info">
      <span class="input-group-text">Seed =&nbsp;<span id="seed">...</span></span>
      <span class="input-group-text button" id="copy-seed">{% icon "copy" %}</span>
      <span class="input-group-text button" id="lock-seed">{% icon "lock" %}</span>
    </div>
    <div class="input-group">
      <span class="input-group-text" id="result">...</span>
      <span class="input-group-text">Step =&nbsp;<span id="step">0</span></span>
      <span class="input-group-text">Res. =&nbsp;<span id="responses">0</span></span>
      <span class="input-group-text">Con. =&nbsp;<span id="conflicts">0</span></span>
      <span class="input-group-text">Ovr. =&nbsp;<span id="overwrites">0</span>&nbsp;(<span id="overwrite-rate">0%</span>)</span>
    </div>
    <div class="input-group mode-toggle">
      <span class="input-group-text button" data-mode="dom">DOM</span>
      <span class="input-group-text button" data-mode="html">HTML</span>
      <span class="input-group-text button" data-mode="md">Markdown</span>
      <span class="input-group-text button" data-mode="tree">Tree</span>
    </div>
  </div>
  <div class="groups" data-mode="dom">
    <div class="group-actual">
      <h6>Actual</h6>
      <hr>
      <div id="answer-dom-actual" class="miso-markdown"></div>
      <pre id="answer-html-actual" class="language-html code"><code class="language-html"></code></pre>
      <pre id="answer-md-actual" class="language-markdown code"><code class="language-markdown"></code></pre>
      <div id="answer-tree-actual" class="tree"></div>
    </div>
    <div class="group-expected">
      <h6>Expected</h6>
      <hr>
      <div id="answer-dom-expected" class="miso-markdown"></div>
      <pre id="answer-html-expected" class="language-html code"><code class="language-html"></code></pre>
      <pre id="answer-md-expected" class="language-markdown code"><code class="language-markdown"></code></pre>
      <div id="answer-tree-expected" class="tree"></div>
    </div>
  </div>
</div>

<script async src="{{ '/js/markdown-test.js' | url }}"></script>
