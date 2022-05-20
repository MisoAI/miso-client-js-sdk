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
