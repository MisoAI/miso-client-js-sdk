export function isCurrentSession(hub, session) {
  if (!session) {
    return false;
  }
  const { session: currentSession } = hub.states;
  return currentSession && currentSession.index === session.index;
}
