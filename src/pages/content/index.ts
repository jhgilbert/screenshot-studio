import {
  SelectedNodeAttrs,
  ExtensionState,
  SHOWCASED_NODE_CLASS,
} from "@root/src/definitions";
import { obscurePii } from "./pageOperations/pii";
import { blurMore, blurLess, getCurrentBlurLevel } from "./nodeOperations/blur";
import { addLabel, removeLabel, hasLabel } from "./nodeOperations/label";
import { addShowcase, removeShowcase } from "./nodeOperations/showcase";
import {
  selectNode,
  deselectNode,
  selectNone,
  getSelectedNode,
} from "./nodeOperations/select";
import { docReady } from "./pageOperations/docReady";

let extensionIsActive: boolean = false;
let pageEventListenersAdded = false;

/*
Ensure that the side panel is enabled,
then send the extension state to the side panel
*/
chrome.runtime.sendMessage({ type: "enable-sidepanel" }).then(() => {
  syncWithSidePanel();
});

async function deactivateExtension() {
  extensionIsActive = false;
  selectNone(document);
  broadcastSelectionData(null);
  removePageEventListeners();
}

async function syncWithSidePanel() {
  await chrome.runtime
    .sendMessage({
      type: "set-extension-is-active",
      payload: extensionIsActive,
    })
    .catch((e) => console.log(e));
  const selectedNode = getSelectedNode(document);
  broadcastSelectionData(selectedNode);
}

function buildExtensionState(): ExtensionState {
  const selectedNode = getSelectedNode(document);
  let selectedNodeAttrs: SelectedNodeAttrs | undefined;
  if (!selectedNode) {
    selectedNodeAttrs = undefined;
  } else {
    selectedNodeAttrs = buildSelectedNodeAttrs(selectedNode);
  }
  return {
    extensionIsActive,
    nodeIsSelected: !!selectedNode,
    selectedNodeAttrs,
  };
}

async function broadcastSelectionData(selectedNode: HTMLElement | null) {
  if (!selectedNode) {
    await chrome.runtime
      .sendMessage({
        type: "set-selected-node-attrs",
        payload: null,
      })
      .catch((e) => console.log(e));
    return;
  }

  await chrome.runtime
    .sendMessage({
      type: "set-selected-node-attrs",
      payload: buildSelectedNodeAttrs(selectedNode),
    })
    .catch((e) => console.log(e));
}

const buildSelectedNodeAttrs = (
  selectedNode: HTMLElement
): SelectedNodeAttrs => {
  const attrs: SelectedNodeAttrs = {
    innerText: selectedNode.innerText,
    isLabeled: hasLabel(selectedNode),
    isHidden: selectedNode.style.visibility === "hidden",
    isBlurred: getCurrentBlurLevel(selectedNode) > 0,
    isShowcased: selectedNode.classList.contains(SHOWCASED_NODE_CLASS),
  };
  return attrs;
};

chrome.runtime.onMessage.addListener(async function (
  message: { type: string; payload?: any },
  sender,
  sendResponse
) {
  // deactivate the extension on every page when the side panel closes
  if (message.type === "sidepanel-closed") {
    deactivateExtension();
    return;
  } else if (message.type === "confirm-sidepanel-support") {
    sendResponse({ sidePanelIsSupported: true });
    return;
  }

  // if this is not the active tab, do nothing,
  // because the user is interacting with a different page,
  // not this one
  if (document.visibilityState === "hidden") {
    return;
  }

  // handle page operations requested by the side panel
  if (message.type === "obscure-pii") {
    obscurePii(document);
  } else if (message.type === "set-extension-is-active") {
    extensionIsActive = message.payload;
    if (!extensionIsActive) {
      selectNone(document);
      document.body.contentEditable = "false";
      removePageEventListeners();
    } else {
      document.body.contentEditable = "true";
      addPageEventListeners();
    }
  }

  // handle node operations requested by the side panel
  const selectedNode = getSelectedNode(document);
  if (!selectedNode) {
    sendResponse(buildExtensionState());
    return;
  }

  switch (message.type) {
    case "blur-selected-more":
      blurMore(selectedNode);
      break;
    case "blur-selected-less":
      blurLess(selectedNode);
      break;
    case "delete-selected":
      selectedNode.style.display = "none";
      deselectNode(selectedNode);
      break;
    case "hide-selected":
      selectedNode.style.visibility = "hidden";
      break;
    case "show-selected":
      selectedNode.style.visibility = "visible";
      break;
    case "showcase-selected":
      addShowcase(selectedNode);
      break;
    case "unshowcase-selected":
      removeShowcase(selectedNode);
      break;
    case "select-none":
      deselectNode(selectedNode);
      break;
    case "select-parent":
      const parent = selectedNode.parentElement;
      if (!parent) break;
      selectNode({ document, node: parent });
      break;
    case "label-selected":
      const labelNode = addLabel(selectedNode);
      selectNode({ document, node: labelNode });
      break;
    case "unlabel-selected":
      removeLabel(selectedNode);
      break;
  }

  const extensionState = buildExtensionState();
  sendResponse(extensionState);
});

docReady(addPageEventListeners);

/*
When a node is clicked, mark it as selected
and broadcast the selection data to the side panel
*/
function selectNodeOnClick(e: MouseEvent) {
  if (!extensionIsActive) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  const node = e.target as HTMLElement;
  selectNode({ document, node });
  broadcastSelectionData(node);
  return false;
}

/*
If this page was hidden (in an inactive tab) and becomes visible again,
send the extension state to the side panel
*/
function syncWithSidePanelOnVisibilityChange() {
  if (!document.hidden) {
    syncWithSidePanel();
  }
}

function removePageEventListeners() {
  if (!pageEventListenersAdded) return;
  document.removeEventListener("click", selectNodeOnClick);
  document.removeEventListener(
    "visibilitychange",
    syncWithSidePanelOnVisibilityChange
  );
  pageEventListenersAdded = false;
}

function addPageEventListeners() {
  if (pageEventListenersAdded) return;
  document.addEventListener("click", selectNodeOnClick);
  document.addEventListener(
    "visibilitychange",
    syncWithSidePanelOnVisibilityChange
  );
  pageEventListenersAdded = true;
}
