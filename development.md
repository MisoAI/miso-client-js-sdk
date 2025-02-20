# Development

## Setup
* Install [NodeJS](https://nodejs.org/)
* Git clone this project
* `npm ci`

## Test (locallly)
* `npm run test`

## Build (locallly)
* `npm run build`

## Run (locally)
* Write the API key in `demo/.env` file:

```
DEFAULT_API_KEY='...'
```

* `npm run start`
* Open browser and visit `http://localhost:10100`

## Run doc site (locally)
* `npm run doc:start`
* Open browser and visit `http://http://localhost:10101/miso-client-js-sdk`



# Release

## Publish to NPM
On GitHub
* Create and publish a release (or prerelease), which will trigger an npm publish.
* If it's a release (not prerelease), the doc site will be published as well.

## Publish doc site
On GitHub
* Go to `Actions` tab
* Select workflow: `Publish doc site`
* Click on `Run workflow` -> use branch `main` -> `Run workflow`



# Debug mode

```js
// ==UserScript==
// @name         Miso SDK debug mode
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Turn on Miso SDK debug mode
// @author       simonpai
// @match        https://*/*
// @match        http://*/*
// @run-at       document-start
// @noframes
// @grant        none
// ==/UserScript==

(function() {
  'use strict';
  console.log('[Userscript] MISO DEBUG!');

  function setup(MisoClient) {
    if (!MisoClient) {
      return;
    }
    MisoClient.plugins.use('std:dry-run');
    MisoClient.plugins.use('std:debug');
  }
  const misodev = window.misodev || (window.misodev = []);
  misodev.push(() => {
    setup(window.MisoClient);
    for (const MisoClient of window.MisoClients || []) {
      setup(MisoClient);
    }
  });
})();
```
