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
}
.miso-citation-tooltip .title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-weight: 600;
  width: max-content;
  max-width: 12rem;
  overflow: hidden;
  text-overflow: ellipsis;
}
.miso-citation-tooltip .date {
  display: block;
  margin-top: 0.5em;
}
</style>
<div id="main">
  <div class="groups">
    <div id="answer-element-actual" class="miso-markdown"></div>
    <div id="answer-element-expected" class="miso-markdown"></div>
    <div id="answer-html-actual"></div>
    <div id="answer-html-expected"></div>
  </div>
</div>
{% endraw %}

<script async src="{{ '/js/markdown-test.js' | url }}"></script>
