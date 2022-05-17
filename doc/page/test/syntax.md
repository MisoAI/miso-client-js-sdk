---
layout: base.njk
title: Syntax Test Page
---
### Inline Code
This is a piece of `inline code`.

### JS
```js
// line comment
/* block comment */
const v0 = 0 + 9.9;
let v1 = '1';
var v2 = "2";
const v3 = `prefix-${v1}-suffix`;
const v4 = /^regexp$/g;
const v5 = true;
const v6 = () => {};
const v7 = {};
const v8 = new Shiba();

function fn(param) {
  return true;
}

class Shiba extends Dog {

  /**
   * @param options
   */
  constructor(options) {
    this.x = options.x;
  }

  /**
   * Some docs
   * @returns {void}
   */
  run({p1} = {}, ...args) {
    const {p2} = p1;
    return Object.keys(p2);
  }
}
```

### JSON
```json
{
  "products": [
    {
      "title": "title",
      "price": 5.95
    },
    {}
  ]
}
```

### HTML
```html
<!DOCTYPE html>
<div class="my-class" style="width: 100%">
  <img src="//some.io/image.svg">
  <p><![CDATA[cdata section]]></p>
  <style>
    .my-class {
      height: 100px;
    }
  </style>
  <script>
    const variable = (function() {
      return 99;
    })();
  </script>
</div>
```

### CSS
```css
@namespace url(http://www.w3.org/1999/xhtml);

span.class:hover {
  width: 100%;
  height: calc(1px + 2rem);
}
[attr="value"]::before {
  font-weight: bold;
  content: 'test';
}
```

### Bash
```bash
npm install --save @miso.ai/client-sdk
```
