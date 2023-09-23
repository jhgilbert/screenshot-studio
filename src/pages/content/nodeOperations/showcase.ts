import { getElementAncestors, getElementSiblings } from "./tree";
import { SHOWCASED_NODE_CLASS } from "@root/src/definitions";

export function addShowcase(node: HTMLElement) {
  if (!node) return;
  const ancestors = getElementAncestors(node);

  // get the siblings of the selected element
  let siblings: HTMLElement[] = [];
  siblings = getElementSiblings(node);

  // get the siblings of all ancestors
  ancestors.forEach((ancestor) => {
    siblings = siblings.concat(getElementSiblings(ancestor));
  });

  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i] as HTMLElement;
    sibling.style.opacity = "0.25";
  }

  node.classList.add(SHOWCASED_NODE_CLASS);
}

export function removeShowcase(node: HTMLElement) {
  const ancestors = getElementAncestors(node);

  // get the siblings of the selected element
  let siblings: HTMLElement[] = [];
  siblings = getElementSiblings(node);

  // get the siblings of all ancestors
  ancestors.forEach((ancestor) => {
    siblings = siblings.concat(getElementSiblings(node));
  });

  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i] as HTMLElement;
    sibling.style.opacity = "1";
  }

  node.classList.remove(SHOWCASED_NODE_CLASS);
}
