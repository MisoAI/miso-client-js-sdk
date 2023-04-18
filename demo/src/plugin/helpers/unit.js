import alert from './ui/alert';

function shimType(type) {
  switch (type) {
    case 'viewable_impression':
      return 'viewable';
    default:
      return type;
  }
}

function getColor(type) {
  switch (type) {
    case 'impression':
      return 'primary';
    case 'viewable':
    case 'feedback':
      return 'success';
    case 'click':
      return 'danger';
    default:
      return 'secondary';
  }
}

export function monitorEvents(workflow) {
  workflow.on('interaction', (payload) => {
    let { type, product_ids } = payload;
    type = shimType(type);
    const color = getColor(type);
    alert(`[${type}] ${product_ids.join(', ')}`, { color });
  });
}
