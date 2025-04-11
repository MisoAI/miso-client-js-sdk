import { toElement, main } from './misc.js';
import getBootstrap from './bootstrap.js';

export default async function alert(message, options) {
  if (typeof message === 'string') {
    message = { body: message };
  }
  const toastElement = toElement(renderToast(message, options));
  getToastContainer().appendChild(toastElement);
  const bootstrap = await getBootstrap();
  const toast = new bootstrap.Toast(toastElement, options);
  toast.show();
  return toast;
}

let toastContainer;

function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.getElementById('toast-container');;
  }
  if (!toastContainer) {
    toastContainer = toElement(`<div id="toast-container" class="toast-container position-fixed p-3 top-0 end-0"></div>`);
    main().appendChild(toastContainer);
  }
  return toastContainer;
}

function renderToast({
  body,
}, {
  color = 'primary',
} = {}) {
  return `
<div class="toast text-white bg-${color}" role="alert" aria-live="assertive" aria-atomic="true">
  <div class="d-flex">
    <div class="toast-body">${body}</div>
    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
  </div>
</div>
`;
}
