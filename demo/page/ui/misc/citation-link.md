---
---

<style>
.miso-list {
  --miso-list-item-height: 7rem;
  --miso-list-item-gap: 0.65rem;
  --miso-list-description-lines: 3;
}
</style>

## Default

<div>
  <div class="miso-markdown">
    <p>
      A dummy dummy dummy dummy dummy line.<br>
      Some dummy text. 
      {%- for i in range(1, 11) -%}
        <a href="#" class="miso-citation-link" data-index="{{ i }}"></a>
      {%- endfor -%}
      Some dummy text.<br>
      A dummy dummy dummy dummy dummy line.
    </p>
  </div>
  <div class="miso-list ready" data-role="sources">
    <ol class="miso-list__list" data-item-type="article">
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
      {%- for i in range(1, 11) -%}
        <a href="#" class="miso-citation-link" data-index="{{ i }}"></a>
      {%- endfor -%}
      Some dummy text.<br>
      A dummy dummy dummy dummy dummy line.
    </p>
  </div>
  <div class="miso-list ready" data-role="sources">
    <ol class="miso-list__list" data-item-type="article">
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
