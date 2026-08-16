import { escapeHtml } from '@miso.ai/commons';
import { fields } from '../../actor/index.js';
import TemplateBasedLayout from '../template.js';
import Bindings from '../../util/bindings.js';

const TYPE = 'facets';
const DEFAULT_CLASSNAME = 'miso-facets';
const DEDAULT_FACET_CLASSNAME = 'miso-facet';
const CUSTOM_ATTRIBUTES_PREFIX = 'custom_attributes.';
const DEFAULT_HIERARCHY_SEPARATOR = ':::';

// The response keys facet_fields by ALIAS, while filtering must use the real
// FIELD. Read the definitions the page already declared in useApi({facets}) so
// both are known here, instead of assuming key === field.
function facetDefinitions(layout) {
  const view = layout._view;
  // useApi({ facets: [...] }) is normalized into api.payload.facets.
  const api = (view && view.workflowOptions && view.workflowOptions.api) || {};
  const payload = api.payload || {};
  const definitions = {};
  for (const definition of payload.facets || []) {
    if (typeof definition === 'string') {
      definitions[definition] = { field: definition, alias: definition };
    } else {
      const alias = definition.alias || definition.field;
      definitions[alias] = { ...definition, alias, field: definition.field };
    }
  }
  return definitions;
}

// A definition may declare that its values are hierarchical paths, and name a
// second facet holding the level below it:
//   { field: 'category_path_depth_1', alias: 'cat_top',
//     hierarchy: { childrenAlias: 'cat_top_l2', separator: ':::' } }
function hierarchyOf(definition) {
  return (definition && definition.hierarchy) || undefined;
}

function leafOf(value, separator) {
  const parts = value.split(separator);
  return parts[parts.length - 1];
}

function root(layout, state) {
  const { className, role, templates } = layout;
  const roleAttr = role ? `data-role="${role}"` : '';
  return `<div class="${className}" ${roleAttr}>${templates.facets(layout, state)}</div>`;
}

function facets(layout, state) {
  const { templates } = layout;
  const { facet_fields = {} } = state.value || {};
  const definitions = facetDefinitions(layout);

  // An alias that only supplies the child level of another facet is rendered
  // inside its parent, not as a box of its own.
  const childAliases = new Set();
  for (const alias in definitions) {
    const hierarchy = hierarchyOf(definitions[alias]);
    if (hierarchy && hierarchy.childrenAlias) {
      childAliases.add(hierarchy.childrenAlias);
    }
  }

  return Object.keys(facet_fields)
    .filter(alias => !childAliases.has(alias))
    .map(alias => {
      const definition = definitions[alias] || { field: alias, alias };
      return templates.facet(layout, {
        alias,
        field: definition.field || alias,
        name: definition.name,
        definition,
        entries: facet_fields[alias],
        children: (hierarchyOf(definition) && facet_fields[hierarchyOf(definition).childrenAlias]) || undefined,
      }, state);
    })
    .join('');
}

function facet(layout, facet, state) {
  const { facetClassName = DEDAULT_FACET_CLASSNAME, templates } = layout;
  const { field, alias = field } = facet;
  // data-key is the response key, used to bind values to elements.
  // data-field is the index field, used when a click becomes a filter.
  return `<div class="${facetClassName}" data-role="facet" data-key="${escapeHtml(alias)}" data-field="${escapeHtml(field)}">${templates.header(layout, facet, state)}${templates.options(layout, facet, state)}</div>`;
}

function header(layout, facet, state) {
  const { facetClassName = DEDAULT_FACET_CLASSNAME, templates } = layout;
  return `<div class="${facetClassName}__header">${templates.title(layout, facet, state)}</div>`;
}

function title(layout, { field, name }) {
  if (name) {
    return escapeHtml(name);
  }
  if (field.startsWith(CUSTOM_ATTRIBUTES_PREFIX)) {
    field = field.substring(CUSTOM_ATTRIBUTES_PREFIX.length);
  }
  // TODO: to words
  return escapeHtml(field);
}

function options(layout, facet, state) {
  const { facetClassName = DEDAULT_FACET_CLASSNAME, templates } = layout;
  const { field, entries = [], children, definition } = facet;
  const hierarchy = hierarchyOf(definition);
  // `separator` may be declared on its own, for a facet whose values are paths
  // but which is not rendered as a tree. Both cases want the leaf as the label.
  const separator =
    (hierarchy && hierarchy.separator) || (definition && definition.separator) || DEFAULT_HIERARCHY_SEPARATOR;
  const pathValues = !!(hierarchy || (definition && definition.separator));

  const rows = entries.map(([value, count]) => {
    // Children of this row come from the facet one level down, matched on the
    // parent path. The level itself is guaranteed by the depth field, so no
    // pattern has to express it.
    const kids = hierarchy && children
      ? children.filter(([childValue]) => childValue.startsWith(value + separator))
      : undefined;
    return templates.option(layout, { field, value, count, hierarchy, separator, pathValues, children: kids }, state);
  }).join('');

  return `<ul class="${facetClassName}__options" data-role="options">${rows}</ul>`;
}

function option(layout, entry, state) {
  const { facetClassName = DEDAULT_FACET_CLASSNAME, templates } = layout;
  const { children, hierarchy, separator, pathValues, field } = entry;
  const hasChildren = !!(children && children.length);

  // The toggle sits outside the clickable option row, so expanding a branch
  // does not also select it.
  const toggle = hasChildren
    ? `<span class="${facetClassName}__toggle" data-role="toggle"></span>`
    : `<span class="${facetClassName}__toggle-spacer"></span>`;

  const nested = hasChildren
    ? `<ul class="${facetClassName}__children">${children.map(([value, count]) =>
        templates.option(layout, { field, value, count, hierarchy, separator, pathValues: true }, state)).join('')}</ul>`
    : '';

  return `
<li class="${facetClassName}__item"${hasChildren ? ' data-expanded="false"' : ''}>
  <div class="${facetClassName}__row">
    ${toggle}
    <span class="${facetClassName}__option" data-role="option" tabindex="0" data-value="${escapeHtml(entry.value)}">
      <span class="${facetClassName}__value">${templates.value(layout, entry, state)}</span>
      <span class="${facetClassName}__count">${templates.count(layout, entry, state)}</span>
    </span>
  </div>
  ${nested}
</li>`;
}


function value(layout, { value, pathValues, separator }, state) {
  // Under a heading that already names the branch, the leaf is the useful label.
  return escapeHtml(pathValues ? leafOf(value, separator || DEFAULT_HIERARCHY_SEPARATOR) : value);
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
    const { proxyElement, filters } = view;
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
    const selectedValues = getSelectedValues(this._view.hub.states[fields.filters()].facets);
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
    const keys = [];
    const values = [];
    const elements = [];
    for (const facetElement of this._getFacetElements(element)) {
      // The FIELD, not the response key: a click has to become a filter on the
      // real index field even when several facets share one field under
      // different aliases.
      const field = facetElement.getAttribute('data-field');
      if (!field) {
        continue;
      }
      for (const itemElement of this._getItemElements(facetElement)) {
        // Read the value off the element rather than pairing by position. A
        // nested tree interleaves parents and children in the DOM, so index
        // pairing against a flat list of values would bind the wrong rows.
        const value = itemElement.getAttribute('data-value');
        if (!value) {
          continue;
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
    // Expanding a branch changes what is visible, not what is selected.
    const toggle = event.target.closest(`[data-role="toggle"]`);
    if (toggle) {
      const item = toggle.closest(`.${this.facetClassName || DEDAULT_FACET_CLASSNAME}__item`);
      if (item) {
        const expanded = item.getAttribute('data-expanded') === 'true';
        item.setAttribute('data-expanded', expanded ? 'false' : 'true');
      }
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
