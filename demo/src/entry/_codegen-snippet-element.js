export default class MisoCodegenSnippetElement extends HTMLElement {

  static get tagName() {
    return 'miso-codegen-snippet';
  }

  constructor() {
    super();
    this._codeElement = undefined;
    this._resetButtonTimeout = undefined;
    this._copyToClipboard = this._copyToClipboard.bind(this);
  }

  connectedCallback() {
    const name = this.getAttribute('name');
    const lang = this.getAttribute('lang');
    const codeElementClass = lang ? `language-${lang}` : '';
    this.setAttribute('data-lang', lang);
    this.innerHTML = `
      <div class="miso-codegen-snippet___header">
        <div class="miso-codegen-snippet___header-title">${name}</div>
      </div>
      <div class="miso-codegen-snippet___body">
        <pre><code class="${codeElementClass}"></code></pre>
        <button class="btn btn-sm btn-outline-secondary copy-button" data-role="copy">
          <i class="bi bi-clipboard"></i> Copy
        </button>
      </div>
    `;
    
    this._codeElement = this.querySelector('code');
    this.querySelector('[data-role="copy"]').addEventListener('click', this._copyToClipboard);
  }

  set content(text) {
    if (!this._codeElement) {
      return;
    }
    this._codeElement.textContent = text;
    // Re-highlight the code if Prism is available
    try {
      window.Prism && window.Prism.highlightElement(this._codeElement);
    } catch (err) {
      console.error('Failed to highlight code: ', err);
    }
  }

  async _copyToClipboard() {
    const code = this._codeElement && this._codeElement.textContent;
    if (!code) {
      return;
    }
    
    try {
      await navigator.clipboard.writeText(code);
      const button = this.querySelector('[data-role="copy"]');
      const originalText = button.innerHTML;
      
      // Clear any existing timeout
      this._clearResetButtonTimeout();
      
      button.innerHTML = '<i class="bi bi-check"></i> Copied!';
      this._resetButtonTimeout = setTimeout(() => {
        button.innerHTML = originalText;
        this._resetButtonTimeout = undefined;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }

  _clearResetButtonTimeout() {
    this._resetButtonTimeout && clearTimeout(this._resetButtonTimeout);
    this._resetButtonTimeout = undefined;
  }

  disconnectedCallback() {
    this._clearResetButtonTimeout();
    this.querySelector('[data-role="copy"]').removeEventListener('click', this._copyToClipboard);
  }
}
