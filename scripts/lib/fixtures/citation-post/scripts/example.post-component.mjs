import { createElement } from 'react';

function FixtureDiagram() {
  return createElement('div', { className: 'fixture-post-component' }, 'Discovered locally');
}

export const POST_COMPONENTS = { FixtureDiagram };
