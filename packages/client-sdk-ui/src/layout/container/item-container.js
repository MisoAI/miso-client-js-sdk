import { LAYOUT_TYPE } from '../../constants.js';
import ContainerLayout from './container.js';

const TYPE = LAYOUT_TYPE.ITEM_CONTAINER;

/**
 * The container layout of a collection's item subworkflow (a thread of the
 * thread list, a message of the conversation panel): the standard container
 * duties (status attributes, banner, trackings), plus the item-level
 * behaviors — currently the context menu (vertical dots + popup).
 *
 * The menu is handled by contract, not rendered here: the item template
 * supplies the markup (e.g. the threads layout's threadMenuBlock), marking
 * the toggle button `data-role="item-menu-button"` and the popup
 * `data-role="item-menu"`, and this layout drives their open/close behavior
 * — toggle on the button; any other click on the item (a menu action
 * included) closes it, and so does a click outside the item, which is also
 * how opening one item's menu closes another's. The menu contents are
 * typically role elements binding to the item workflow (e.g. the thread
 * item's `<miso-rename>`/`<miso-delete>` buttons), so the actions stay the
 * workflow's own controls. Collection shells treat clicks carrying the
 * menu data-roles as item-internal (e.g. the threads layout does not
 * select); an item template without menu markup simply has nothing to
 * drive.
 */
export default class ItemContainerLayout extends ContainerLayout {

  static get type() {
    return TYPE;
  }

  initialize(view) {
    this._unsubscribes.push(view.proxyElement.on('click', event => this._handleClick(event)));
    if (typeof document !== 'undefined') {
      const onDocumentClick = (event) => {
        const element = this._element;
        if (element && !element.contains(event.target)) {
          this._closeMenu();
        }
      };
      document.addEventListener('click', onDocumentClick);
      this._unsubscribes.push(() => document.removeEventListener('click', onDocumentClick));
    }
  }

  // menu //
  _handleClick(event) {
    // only left click
    if (event.button !== 0) {
      return;
    }
    if (event.target.closest(`[data-role="item-menu-button"]`)) {
      this._toggleMenu();
      return;
    }
    // any other click on the item — a menu action included — closes the menu
    this._closeMenu();
  }

  _getMenu() {
    return this._element && this._element.querySelector(`[data-role="item-menu"]`);
  }

  _toggleMenu() {
    const menu = this._getMenu();
    if (menu) {
      menu.hidden = !menu.hidden;
    }
  }

  _closeMenu() {
    const menu = this._getMenu();
    if (menu && !menu.hidden) {
      menu.hidden = true;
    }
  }

}
