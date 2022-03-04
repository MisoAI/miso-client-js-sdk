# Development

## Setup
* Install [NodeJS](https://nodejs.org/)
* Git clone this project
* `npm ci`

## Build (locallly)
* `npm run build`

## Run (locally)
* `npm start`
* Open browser and visit `http://localhost:10101/demo/index.html`

## Run doc site (locally)
* `npm run doc:start`
* Open browser and visit `http://http://localhost:10201/miso-client-js-sdk`



# Release

## Publish to NPM
On GitHub
* Create and publish a release, which will trigger an npm publish.

## Publish doc site
On GitHub
* Go to `Actions` tab
* Select workflow: `Publish doc site`
* Click on `Run workflow` -> use branch `main` -> `Run workflow`
