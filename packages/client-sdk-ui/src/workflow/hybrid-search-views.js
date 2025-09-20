import SearchBasedWorkflow from './search-based.js';

const RESULTS_ROLE_MEMBERS = SearchBasedWorkflow.ROLES_OPTIONS.members;

function getSubworkflowByRole(role) {
  // TODO: ROLE.ERROR
  return RESULTS_ROLE_MEMBERS.includes(role) ? 'results' : 'answer';
}

export default class HybridSearchViewsActor {

  constructor(subviews) {
    this._subviews = subviews;
    this._containers = new Set();
  }

  get filters() {
    return this._subviews.results.filters;
  }

  get(role) {
    return this._getSubviews(role).get(role);
  }

  addContainer(element) {
    if (this._containers.has(element)) {
      return;
    }
    this._containers.add(element);

    const { components } = element;
    for (const component of components) {
      this.addComponent(component);
    }
  }

  removeContainer(element) {
    for (const subviews of this._getAllSubviews()) {
      subviews.removeContainer(element);
    }
    this._containers.delete(element);
  }

  addComponent(element) {
    this._getViewByElement(element).element = element;
    this._addContainerToSubviews(element._container, element);
  }

  removeComponent(element) {
    this._getViewByElement(element).element = undefined;
    this._removeContainerFromSubviewsIfNecessary(element._container);
  }

  updateComponentRole(element, oldRole, newRole) {
    // TODO
  }

  refreshElement(element) {
    const view = element.isContainer ? this._containers.get(element) : this._getViewByElement(element);
    view && view.refresh({ force: true });
  }

  // helpers //
  _getAllSubviews() {
    return Object.values(this._subviews);
  }

  _getSubviews(role) {
    return this._subviews[getSubworkflowByRole(role)];
  }

  _getViewByElement(element) {
    let { role } = element;
    if (!role) {
      throw new Error('Component must have a role');
    }
    return this.get(role);
  }

  _addContainerToSubviews(container, child) {
    if (!container) {
      return;
    }
    const { role } = child;
    const subviews = this._getSubviews(role);
    if (subviews._containers.has(container)) {
      return;
    }
    // check if the container is in other subviews
    for (const otherSubviews of this._getAllSubviews()) {
      if (otherSubviews === subviews) {
        continue;
      }
      if (otherSubviews._containers.has(container)) {
        // find the conflicting element
        for (const component of container.components) {
          if (otherSubviews.containsElement(component)) {
            throw new Error(`<${container.tagName.toLowerCase()}> cannot contain both <${component.tagName.toLowerCase()}> and <${child.tagName.toLowerCase()}>, for they don't share the same data lifecycle.`);
          }
        }
        throw new Error(`Failed to add container <${container.tagName.toLowerCase()}> with child component <${child.tagName.toLowerCase()}>.`);
      }
    }
    // add the container to the subviews
    subviews.addContainer(container);
  }

  _removeContainerFromSubviewsIfNecessary(container) {
    if (!container || container.components.length > 0) {
      return;
    }
    for (const subviews of this._getAllSubviews()) {
      subviews.removeContainer(container);
    }
  }

}
