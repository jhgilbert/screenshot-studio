import { SELECTED_NODE_CLASS, LABEL_TAB_CLASS } from "@root/src/definitions";

export function getSelectedNode(document: Document): HTMLElement | null {
  const selectedNodes = document.getElementsByClassName(SELECTED_NODE_CLASS);
  if (selectedNodes.length === 0) return null;
  if (selectedNodes.length > 1) {
    console.error("More than one selected node found");
  }
  return selectedNodes[0] as HTMLElement;
}

export function selectNode({
  document,
  node,
}: {
  document: Document;
  node: HTMLElement;
}) {
  selectNone(document);
  node.classList.add(SELECTED_NODE_CLASS);
  if (node.classList.contains(LABEL_TAB_CLASS)) {
    document.body.contentEditable = "false";
  } else {
    document.body.contentEditable = "true";
  }
}

export function deselectNode(node: HTMLElement) {
  node.classList.remove(SELECTED_NODE_CLASS);
  chrome.runtime.sendMessage({
    type: "set-selected-node-attrs",
    payload: null,
  });
}

export function selectNone(document: Document) {
  const selectedNode = getSelectedNode(document);
  if (!selectedNode) return;
  deselectNode(selectedNode);
}
