import { API } from '@miso.ai/commons';
import { InteractionsActor } from '../actor/index.js';
import Workflow from './base.js';
import AnswerBasedWorkflow from './answer-based.js';
import { ROLE } from '../constants.js';
import { ListLayout, TextLayout, FacetsLayout } from '../layout/index.js';
import HybridSearchResults from './hybrid-search-results.js';

const DEFAULT_API_OPTIONS = Object.freeze({
  ...AnswerBasedWorkflow.DEFAULT_API_OPTIONS,
  name: API.NAME.SEARCH,
  payload: {
    ...AnswerBasedWorkflow.DEFAULT_API_OPTIONS.payload,
    fl: ['cover_image', 'url', 'created_at', 'updated_at', 'published_at'],
  },
});

const DEFAULT_LAYOUTS = Object.freeze({
  ...AnswerBasedWorkflow.DEFAULT_LAYOUTS,
  [ROLE.PRODUCTS]: [ListLayout.type, { itemType: 'article' }],
  [ROLE.KEYWORDS]: [TextLayout.type, { raw: true }],
  [ROLE.HITS]: [TextLayout.type, { raw: true, format: 'number' }],
  [ROLE.FACETS]: [FacetsLayout.type],
});

const DEFAULT_TRACKERS = Object.freeze({
  ...AnswerBasedWorkflow.DEFAULT_TRACKERS,
});

const DEFAULT_OPTIONS = Object.freeze({
  ...AnswerBasedWorkflow.DEFAULT_OPTIONS,
  api: DEFAULT_API_OPTIONS,
  layouts: DEFAULT_LAYOUTS,
  trackers: DEFAULT_TRACKERS,
});

const ROLES_CONFIG = Object.freeze({
  [ROLE.QUESTION]: {
    mapping: ROLE.KEYWORDS,
  },
  [ROLE.FACETS]: {
    mapping: 'facet_counts',
  },
});

const SUBWORKFLOW = Object.freeze({
  ANSWER: 'answer',
  RESULTS: 'results',
});

function getSubworkflowByRole(role) {
  // TODO: ROLE.ERROR
  switch (role) {
    case ROLE.PRODUCTS:
    case ROLE.HITS:
    case ROLE.FACETS:
    case ROLE.KEYWORDS:
      return SUBWORKFLOW.RESULTS;
    default:
      return SUBWORKFLOW.ANSWER;
  }
}

export default class HybridSearch extends Workflow {

  constructor(plugin, client) {
    super({
      name: 'hybrid-search',
      plugin,
      client,
      roles: Object.keys(DEFAULT_LAYOUTS),
      rolesConfig: ROLES_CONFIG,
      defaults: DEFAULT_OPTIONS,
    });
  }

  _initProperties(args) {
    super._initProperties(args);
    this._subworkflows = [
      this._answer = new HybridSearchAnswer(this),
      this._results = new HybridSearchResults(this),
    ];
  }

  _getSubworkflow(name) {
    switch (name) {
      case SUBWORKFLOW.ANSWER:
        return this._answer;
      case SUBWORKFLOW.RESULTS:
        return this._results;
      default:
        throw new Error(`Invalid subworkflow: ${name}`);
    }
  }

  _initActors() {
    const hub = this._hub;
    const client = this._client;
    const options = this._options;

    this._views = new HybridSearchViewsActor(this);
    this._interactions = new InteractionsActor(hub, { client, options });
  }

  _initReset() {
    this._results.reset();
    this._answer.reset();
  }

  restart({ answer = true } = {}) {
    const previousSession = this.session;
    this._sessions.restart();
    const { session } = this;
    if (!answer) {
      session._answer = previousSession._answer || previousSession;
    }
    return this;
  }

  // properties //
  get questionId() {
    return this._answer.questionId;
  }

  get filters() {
    return this._results._views.filters;
  }

  // query //
  autoQuery(options) {
    this._answer.autoQuery(options);
  }

  query(args) {
    this._answer.query(args);
  }

  // interactions //
  _preprocessInteraction(payload) {
    return this._answer._preprocessInteraction(payload);
  }

  // destroy //
  _destroy() {
    for (const subworkflow of this._subworkflows) {
      subworkflow.destroy();
    }
    super._destroy();
  }

}

class HybridSearchViewsActor {

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
            throw new Error(`<${container.tagName}> cannot contain both <${component.tagName}> and <${child.tagName}>, for they don't share the same data lifecycle.`);
          }
        }
        throw new Error(`Failed to add container <${container.tagName}> with child component <${child.tagName}>.`);
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
