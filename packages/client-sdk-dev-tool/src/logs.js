import { dumpValue, loadStyles as _loadStyles, resolveCssUrl } from '@miso.ai/commons';

const LOGS_UI_ROOT_ID = 'miso-logdump';
const LOGS_UI_ROOT_CLASS = 'miso-logdump';
const LOGS_UI_BUTTON_CLASS = `${LOGS_UI_ROOT_CLASS}__download-btn`;
const DEFAULT_DOWNLOAD_BUTTON_TEXT = 'Miso Log';

export class Logs {

  constructor(options = {}) {
    this._options = options;
    this._logs = [];
  }

  config(options = {}) {
    this._options = {
      ...this._options,
      ...options,
    }
  }

  async showDownloadButton() {
    await loadStyles();
    let element = document.getElementById(LOGS_UI_ROOT_ID);
    if (!element) {
      const button = document.createElement('div');
      button.textContent = this._options.logDownloadButtonText || DEFAULT_DOWNLOAD_BUTTON_TEXT;
      button.classList.add(LOGS_UI_BUTTON_CLASS);
      button.addEventListener('click', () => this.download());

      element = document.createElement('div');
      element.id = LOGS_UI_ROOT_ID;
      element.classList.add(LOGS_UI_ROOT_CLASS);
      element.appendChild(button);

      document.body.appendChild(element);
    }
    element.style.display = 'block';
  }

  _syncUi() {
    const element = document.getElementById(LOGS_UI_ROOT_ID);
    const button = element && element.querySelector(`.${LOGS_UI_BUTTON_CLASS}`);
    if (button) {
      button.textContent = this._options.logDownloadButtonText || DEFAULT_DOWNLOAD_BUTTON_TEXT;
    }
  }

  hideDownloadButton() {
    const element = document.getElementById(LOGS_UI_ROOT_ID);
    if (element) {
      element.style.display = 'none';
    }
  }

  download() {
    const logs = this._logs;
    const blob = new Blob([exportLog(logs)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this._filename();
    a.click();
  }

  _filename() {
    let { logFilename } = this._options;
    if (typeof logFilename === 'function') {
      const timestamp = getTimestampSegment();
      logFilename = logFilename({ timestamp });
    }
    if (logFilename && typeof logFilename === 'string') {
      return logFilename;
    }
    return getDefaultFileName();
  }

  clear() {
    this._logs = [];
  }

}

function getDefaultFileName() {
  return `miso-log.${getTimestampSegment()}.jsonl`;
}

function getTimestampSegment() {
  return new Date().toISOString().replaceAll(/[\:\.]/g, '-');
}

function exportLog(logs) {
  return logs.map(log => JSON.stringify(dumpValue(shimLog(log), { depth: 10 }))).join('\n');
}

function shimLog(log) {
  if (log[0] === '<progressive-markdown>') {
    const len = log.length;
    return [...log.slice(0, len - 1), shimProgressiveMarkdownPosition(log[len - 1])];
  }
  return log;
}

function shimProgressiveMarkdownPosition(pos) {
  return pos ? dumpValue(pos, { depth: 2 }) : pos;
}

let stylesLoaded;

async function loadStyles() {
  return stylesLoaded || (stylesLoaded = _loadStyles(resolveCssUrl('logdump')));
}
