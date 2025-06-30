import HybridSearchResults from './hybrid-search-results.js';

function getSubworkflowByRole(role) {
  // TODO: ROLE.ERROR
  return HybridSearchResults.ROLES_OPTIONS.members.includes(role) ? 'results' : 'answer';
}

export default class HybridSearchViewsActor {

  constructor(workflow) {
    this._workflow = workflow;
    this._containers = new Set();
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
    for (const subworkflow of this._workflow._subworkflows) {
      subworkflow._views.removeContainer(element);
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
  _getSubworkflow(role) {
    return this._workflow._getSubworkflow(getSubworkflowByRole(role));
  }

  _getAllSubviews() {
    return this._workflow._subworkflows.flatMap(subworkflow => subworkflow._views);
  }

  _getSubviews(role) {
    return this._getSubworkflow(role)._views;
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
