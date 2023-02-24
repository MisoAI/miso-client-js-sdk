import alert from './ui/alert';

export function monitorEvents(unit) {
  unit.on('event', ({ type, productIds }) => {
    const color = type === 'impression' ? 'primary' : type === 'viewable' ? 'success' : type === 'click' ? 'danger' : 'secondary';
    alert(`[${type}] ${productIds.join(', ')}`, { color });
  });
}
