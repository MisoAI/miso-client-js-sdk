import { escapeHtml } from '@miso.ai/commons';
import TemplateBasedLayout from '../template.js';
import Bindings from '../../util/bindings.js';

const TYPE = 'facets';
const DEFAULT_CLASSNAME = 'miso-facets';
const DEDAULT_FACET_CLASSNAME = 'miso-facet';
const CUSTOM_ATTRIBUTES_PREFIX = 'custom_attributes.';

function root(layout, state) {
  const { className, role, templates } = layout;
  const roleAttr = role ? `data-role="${role}"` : '';
  return `<div class="${className}" ${roleAttr}>${templates.facets(layout, state)}</div>`;
}

function facets(layout, state) {
  const { templates } = layout;
  const { facet_fields = {} } = state.value || {};
  return Object.keys(facet_fields).map(field => templates.facet(layout, { field, entries: facet_fields[field] }, state));
}

function facet(layout, facet, state) {
  const { facetClassName = DEDAULT_FACET_CLASSNAME, templates } = layout;
  const { field } = facet;
  return `<div class="${facetClassName}" data-role="facet" data-field="${escapeHtml(field)}">${templates.header(layout, facet, state)}${templates.options(layout, facet, state)}</div>`;
}

function header(layout, facet, state) {
  const { facetClassName = DEDAULT_FACET_CLASSNAME, templates } = layout;
  return `<div class="${facetClassName}__header">${templates.title(layout, facet, state)}</div>`;
}

function title(layout, { field }) {
  if (field.startsWith(CUSTOM_ATTRIBUTES_PREFIX)) {
    field = field.substring(CUSTOM_ATTRIBUTES_PREFIX.length);
  }
  // TODO: to words
  return escapeHtml(field);
}

function options(layout, { field, entries }, state) {
  const { facetClassName = DEDAULT_FACET_CLASSNAME, templates } = layout;
  return `<ul class="${facetClassName}__options" data-role="options">${entries.map(([value, count]) => templates.option(layout, { field, value, count }, state)).join('')}</ul>`;
}

function option(layout, entry, state) {
  const { facetClassName = DEDAULT_FACET_CLASSNAME, templates } = layout;
  return `
<li class="${facetClassName}__option" data-role="option" tabindex="0">
  <span class="${facetClassName}__value">${templates.value(layout, entry, state)}</span>
  <span class="${facetClassName}__count">${templates.count(layout, entry, state)}</span>
</li>`;
}


function value(layout, { value }, state) {
  return escapeHtml(value);
}

function count(layout, { count }, state) {
  return layout.templates.helpers.formatNumber(count);
}

const DEFAULT_TEMPLATES = Object.freeze({
  root,
  facets,
  facet,
  header,
  title,
  options,
  option,
  value,
  count,
});

function getItemKey(field, value) {
  return `${field}:::${value}`;
}

function getSelectedValues(facets) {
  const selections = {};
  for (const field in facets) {
    selections[field] = new Set(facets[field]);
  }
  return selections;
}

export default class FacetsLayout extends TemplateBasedLayout {

  static get type() {
    return TYPE;
  }

  static get defaultTemplates() {
    return DEFAULT_TEMPLATES;
  }

  static get defaultClassName() {
    return DEFAULT_CLASSNAME;
  }

  constructor({ className = DEFAULT_CLASSNAME, templates, ...options } = {}) {
    super({
      className,
      templates: { ...DEFAULT_TEMPLATES, ...templates },
      ...options,
    });
    this._bindings = new Bindings();
  }

  initialize(view) {
    const { proxyElement, hub, filters } = view;
    this._unsubscribes = [
      ...this._unsubscribes,
      proxyElement.on('click', (e) => this._handleClick(e)),
      filters.on('update', (e) => this._updateSelections(e)),
      filters.on('reset', () => this._syncSelections()),
    ];
  }

  _render(element, data, controls) {
    super._render(element, data, controls);
  }

  _afterRender(element, state) {
    this._syncBindings(element, state);
    this._syncSelections();
  }

  _unrender() {
    this._clearBindings();
  }

  _syncSelections() {
    const selectedValues = getSelectedValues(this._view.filters.states.facets);
    for (const { value: { field, value }, element } of this._bindings.entries) {
      this._setSelected(element, selectedValues[field] && selectedValues[field].has(value));
    }
  }

  _updateSelections({ updates }) {
    const selectedValues = getSelectedValues(updates.facets);
    for (const { value: { field, value }, element } of this._bindings.entries) {
      if (!selectedValues[field]) {
        continue;
      }
      this._setSelected(element, selectedValues[field].has(value));
    }
  }

  _setSelected(element, selected) {
    if (!element) {
      return;
    }
    if (selected) {
      element.classList.add('selected');
    } else {
      element.classList.remove('selected');
    }
  }

  _syncBindings(element, state) {
    if (!element || !state.value) {
      return;
    }
    const items = this._getItems(state);
    const keys = [];
    const values = [];
    const elements = [];
    for (const facetElement of this._getFacetElements(element)) {
      const field = facetElement.getAttribute('data-field');
      const _values = items[field];
      if (!_values) {
        continue;
      }
      const itemElements = this._getItemElements(facetElement);
      for (let i = 0; i < itemElements.length; i++) {
        const itemElement = itemElements[i];
        const value = _values[i];
        if (!value) {
          break;
        }
        keys.push(getItemKey(field, value));
        values.push({ field, value });
        elements.push(itemElement);
      }
    }
    this._bindings.update(keys, values, elements);
  }

  _clearBindings() {
    this._bindings.clear();
  }

  _getItems({ value } = {}) {
    const { facet_fields = {} } = value || {};
    const items = {};
    for (const field in facet_fields) {
      // the key needs to be matched against data-field attribute
      items[escapeHtml(field)] = facet_fields[field].map(([value]) => value);
    }
    return items;
  }

  _getFacetElements(element) {
    return Array.from(element.querySelectorAll(`[data-role="facet"]`));
  }

  _getFacetElement(element, field) {
    return element.querySelector(`[data-role="facet"][data-field="${field}"]`);
  }

  _getItemElements(element) {
    return Array.from(element.querySelectorAll(`[data-role="option"]`));
  }

  _handleClick(event) {
    // only left click
    if (event.button !== 0) {
      return;
    }
    const element = event.target.closest(`[data-role="option"]`);
    if (!element) {
      return;
    }
    const binding = this._bindings.get(element);
    const option = binding && binding.value;
    if (!option) {
      return;
    }
    const { field, value } = option;
    this._view.filters.facets.toggle(field, value);
    this._view.filters.apply(); // TODO: support autoApply = false
  }

  destroy() {
    this._bindings.clear();
    super.destroy();
  }

}
