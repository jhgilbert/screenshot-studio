export function getElementSiblings(element: HTMLElement) {
  const siblings = [];
  let sibling = element.parentNode?.firstChild as HTMLElement;
  while (sibling) {
    if (sibling.nodeType === 1 && sibling !== element) {
      siblings.push(sibling);
    }
    sibling = sibling.nextSibling as HTMLElement;
  }
  return siblings;
}

export function getElementAncestors(element: HTMLElement) {
  const ancestors = [];
  let ancestor = element.parentNode as HTMLElement;
  while (ancestor) {
    if (ancestor.nodeType === 1) {
      ancestors.push(ancestor);
    }
    ancestor = ancestor.parentNode as HTMLElement;
  }
  return ancestors;
}
