const TAG_NAME = 'miso-stub';

const ATTR_TRAIT = 'trait';
const OBSERVED_ATTRIBUTES = Object.freeze([ATTR_TRAIT]);

export default class MisoStubElement extends HTMLElement {

  static get tagName() {
    return TAG_NAME;
  }

  static get observedAttributes() {
    return OBSERVED_ATTRIBUTES;
  }

  constructor() {
    super();
    this._traits = [];
  }

  // lifecycle //
  connectedCallback() {
    this._syncTraits();
  }

  disconnectedCallback() {
    for (const trait of this._traits) {
      this._destroyTrait(trait);
    }
    this._traits = [];
  }

  attributeChangedCallback(attr) {
    switch (attr) {
      case ATTR_TRAIT:
        this._syncTraits();
        break;
    }
  }

  _syncTraits() {
    const names = (this.getAttribute(ATTR_TRAIT) || '').split(/\s+/).filter(Boolean);
    const traits = [];
    for (const trait of this._traits) {
      if (!names.includes(trait.constructor.traitName)) {
        this._destroyTrait(trait);
      } else {
        traits.push(trait);
      }
    }
    if (names.length > 0) {
      const availableTraits = getAvailableTraits(MisoStubElement.MisoClient);
      for (const name of names) {
        if (this._traits.find(trait => trait.constructor.traitName === name)) {
          continue;
        }
        const TraitClass = availableTraits[name];
        if (!TraitClass) {
          console.warn(`Unknown trait: ${name}`);
          continue;
        }
        const trait = new TraitClass(this);
        traits.push(trait);
      }
    }
    this._traits = traits;
  }

  _destroyTrait(trait) {
    try {
      trait._destroy && trait._destroy();
    } catch (error) {
      console.error(error);
    }
  }

}

function getAvailableTraits(MisoClient) {
  const traits = MisoClient.ui && MisoClient.ui.traits || {};
  return Object.values(traits).reduce((traits, trait) => {
    traits[trait.traitName] = trait;
    return traits;
  }, {});
}
