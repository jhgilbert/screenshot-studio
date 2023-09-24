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

let extensionIsActive: boolean = false;

async function syncWithSidePanel() {
  console.log("syncing with side panel");
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

syncWithSidePanel();

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
  // if this is not the active tab, do nothing,
  // because the user is not interacting with this page
  if (document.visibilityState === "hidden") {
    console.log("Message received, but page is hidden:", message);
    return;
  }

  // handle page operations
  if (message.type === "obscure-pii") {
    obscurePii(document);
  } else if (message.type === "set-extension-is-active") {
    extensionIsActive = message.payload;
    if (!extensionIsActive) {
      selectNone(document);
      document.body.contentEditable = "false";
    } else {
      document.body.contentEditable = "true";
      addPageEventListeners();
    }
  }

  // handle node operations
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
    case "label-selected":
      const labelNode = addLabel(selectedNode);
      selectNode({ document, node: labelNode });
      break;
    case "unlabel-selected":
      removeLabel(selectedNode);
      break;
  }

  sendResponse(buildExtensionState());
});

function docReady(fn: () => any) {
  // see if DOM is already available
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    // call on next available tick
    setTimeout(fn, 1);
  } else {
    document.addEventListener("DOMContentLoaded", fn);
  }
}

docReady(addPageEventListeners);

let pageEventListenersAdded = false;

function addPageEventListeners() {
  if (pageEventListenersAdded) return;
  console.log("Adding event listeners");
  document.addEventListener("click", function (e: MouseEvent) {
    if (!extensionIsActive) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const node = e.target as HTMLElement;
    selectNode({ document, node });
    broadcastSelectionData(node);
    return false;
  });
  document.addEventListener(
    "visibilitychange",
    async function () {
      if (!document.hidden) {
        console.log("This page is visible");
        await syncWithSidePanel();
      } else {
        console.log("This page is hidden");
      }
    },
    false
  );
  pageEventListenersAdded = true;
}

chrome.runtime.onMessage.addListener(async function (
  message,
  sender,
  sendResponse
) {
  // listen for messages sent from background.js
  if (message.type === "tab-updated") {
    console.log("tab-updated message received from background worker"); // new url is now in content scripts!
  } else if (message.type === "set-active-tab-id") {
    console.log(
      "set-active-tab-id message received from background worker",
      message
    );
  }
});

/**
 * @description
 * Chrome extensions don't support modules in content scripts.
 */
// import("./components/Demo");

console.log("content loaded");
