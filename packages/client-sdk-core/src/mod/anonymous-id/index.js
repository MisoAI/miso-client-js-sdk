import AutomaticAnonymousIdManager from './auto';

export default function DefaultAnonymousIdManager(disableAutoAnonymousId) {
  return disableAutoAnonymousId ? {} : new AutomaticAnonymousIdManager();
}
