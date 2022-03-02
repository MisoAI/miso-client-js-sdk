---
layout: base.njk
title: Syntax Test Page
---
### Inline Code
This is a piece of `Inline Code`.
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
    return Object.key(p2);
  }
}
```
