---
---

{% raw %}
<style>
main {
  padding: 2rem;
}
#default {
  margin-top: 0;
}
.miso-list {
  --miso-list-item-height: 7rem;
  --miso-list-item-gap: 0.65rem;
  --miso-list-description-lines: 3;
}
.large p {
  font-size: 5rem !important;
  line-height: 1 !important;
}
.line {
  overflow: hidden;
}
</style>
{% endraw %}

## Default

<div>
  <div class="miso-markdown">
    <p>
      A dummy dummy dummy dummy dummy line.<br>
      Some dummy text. 
      {%- for i in range(1, 31) -%}
        <a href="#" class="miso-citation-link" data-index="{{ i }}"></a>
      {%- endfor -%}
      Some dummy text.<br>
      A dummy dummy dummy dummy dummy line.
    </p>
  </div>
  <div class="miso-list ready" data-item-type="article" data-role="sources">
    <ol class="miso-list__list">
      <li class="miso-list__item">
        <a class="miso-list__item-body" data-role="item" href="#">
          <div class="miso-list__item-cover-image-container">
            <img class="miso-list__item-cover-image" src="https://picsum.photos/seed/116/300">
          </div>
          <div class="miso-list__item-info-container">
            <div class="miso-list__item-title">Title</div>
            <div class="miso-list__item-date">10/10/2023</div>
            <div class="miso-list__item-snippet">Fusce consequat ornare porta aliquam aliquam ultrices.</div>
          </div>
          <div class="miso-list__item-index-container">
            <span class="miso-list__item-index miso-citation-index" data-index="1"></span>
          </div>
        </a>
      </li>
    </ol>
  </div>
</div>

## Circled

<div class="miso-circled-citation-index">
  <div class="miso-markdown">
    <p>
      A dummy dummy dummy dummy dummy line.<br>
      Some dummy text. 
      {%- for i in range(1, 31) -%}
        <a href="#" class="miso-citation-link" data-index="{{ i }}"></a>
      {%- endfor -%}
      Some dummy text.<br>
      A dummy dummy dummy dummy dummy line.
    </p>
  </div>
  <div class="miso-list ready" data-item-type="article" data-role="sources">
    <ol class="miso-list__list">
      <li class="miso-list__item">
        <a class="miso-list__item-body" data-role="item" href="#">
          <div class="miso-list__item-cover-image-container">
            <img class="miso-list__item-cover-image" src="https://picsum.photos/seed/116/300">
          </div>
          <div class="miso-list__item-info-container">
            <div class="miso-list__item-title">Title</div>
            <div class="miso-list__item-date">10/10/2023</div>
            <div class="miso-list__item-snippet">Fusce consequat ornare porta aliquam aliquam ultrices.</div>
          </div>
          <div class="miso-list__item-index-container">
            <span class="miso-list__item-index miso-citation-index" data-index="1"></span>
          </div>
        </a>
      </li>
    </ol>
  </div>
</div>

----

<div class="miso-circled-citation-index-dark">
  <div class="miso-markdown">
    <p>
      A dummy dummy dummy dummy dummy line.<br>
      Some dummy text. 
      {%- for i in range(1, 31) -%}
        <a href="#" class="miso-citation-link" data-index="{{ i }}"></a>
      {%- endfor -%}
      Some dummy text.<br>
      A dummy dummy dummy dummy dummy line.
    </p>
  </div>
</div>

<div class="miso-circled-citation-index miso-markdown large">
  <div>
    {%- for i in range(0, 5) -%}
      <p class="line">
        {%- for j in range(1, 8) -%}
          <a href="#" class="miso-citation-link" data-index="{{ i * 7 + j }}"></a>
        {%- endfor -%}
      </p>
    {%- endfor -%}
  </div>
</div>
