const blurFilterRegex = /blur\((\d+)px\)/;

export const getCurrentBlurLevel = (node: HTMLElement) => {
  let currentBlurLevel: number = 0;
  if (blurFilterRegex.test(node.style.filter)) {
    const match = node.style.filter.match(blurFilterRegex) as RegExpMatchArray;
    currentBlurLevel = parseInt(match[1]);
  }
  return currentBlurLevel;
};

export function blurMore(node: HTMLElement) {
  const currentBlurLevel = getCurrentBlurLevel(node);
  node.style.filter = `blur(${currentBlurLevel + 1}px)`;
}

export function blurLess(node: HTMLElement) {
  const currentBlurLevel = getCurrentBlurLevel(node);
  if (currentBlurLevel > 0) {
    node.style.filter = `blur(${currentBlurLevel - 1}px)`;
  }
}
