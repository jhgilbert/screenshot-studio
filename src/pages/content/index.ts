import {
  SelectedNodeAttrs,
  SELECTED_NODE_CLASS,
  LABEL_TAB_CLASS,
  SHOWCASED_NODE_CLASS,
} from "../../definitions";
import { obscurePii } from "./pageOperations/pii";
import { blurMore, blurLess, getCurrentBlurLevel } from "./nodeOperations/blur";
import { addLabel, removeLabel, hasLabel } from "./nodeOperations/label";

let selectedNode: HTMLElement | null = null;
let extensionIsActive: boolean = false;

async function syncWithSidePanel() {
  console.log("syncing with side panel");
  await chrome.runtime
    .sendMessage({
      type: "set-extension-is-active",
      payload: extensionIsActive,
    })
    .catch((e) => console.log(e));
  broadcastSelectionData();
}

syncWithSidePanel();

function selectNode(node: HTMLElement) {
  deselectNode(selectedNode);
  selectedNode = node;
  selectedNode.classList.add(SELECTED_NODE_CLASS);
  if (selectedNode.classList.contains(LABEL_TAB_CLASS)) {
    document.body.contentEditable = "false";
  } else {
    document.body.contentEditable = "true";
  }
  broadcastSelectionData();
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

async function broadcastSelectionData() {
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

function deselectNode(node: HTMLElement | null) {
  if (!node) return;
  node.classList.remove(SELECTED_NODE_CLASS);
  chrome.runtime.sendMessage({
    type: "set-selected-node-attrs",
    payload: null,
  });
}

function getElementSiblings(element: HTMLElement) {
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

function getElementAncestors(element: HTMLElement) {
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

function addShowcase(node: HTMLElement) {
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

function removeShowcase(node: HTMLElement) {
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
  if (message.type === "select-parent") {
    selectNode(selectedNode?.parentElement!);
  } else if (message.type === "blur-selected-more" && selectedNode) {
    blurMore(selectedNode);
  } else if (message.type === "blur-selected-less" && selectedNode) {
    blurLess(selectedNode);
  } else if (message.type === "delete-selected" && selectedNode) {
    selectedNode.style.display = "none";
    deselectNode(selectedNode);
  } else if (message.type === "hide-selected" && selectedNode) {
    selectedNode.style.visibility = "hidden";
  } else if (message.type === "show-selected" && selectedNode) {
    selectedNode.style.visibility = "visible";
  } else if (message.type === "showcase-selected" && selectedNode) {
    addShowcase(selectedNode);
  } else if (message.type === "unshowcase-selected" && selectedNode) {
    removeShowcase(selectedNode);
  } else if (message.type === "obscure-pii") {
    obscurePii(document);
  } else if (message.type === "select-none") {
    deselectNode(selectedNode);
  } else if (message.type === "set-extension-is-active") {
    extensionIsActive = message.payload;
    if (!extensionIsActive) {
      deselectNode(selectedNode);
      document.body.contentEditable = "false";
    } else {
      document.body.contentEditable = "true";
      addPageEventListeners();
    }
  } else if (message.type === "label-selected") {
    if (!selectedNode) return;
    const labelNode = addLabel(selectedNode);
    selectNode(labelNode);
  } else if (message.type === "unlabel-selected") {
    if (!selectedNode) return;
    removeLabel(selectedNode);
  }
  // await broadcastSelectionData();
  // sendResponse(buildSelectedNodeAttrs());
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
    const target = e.target as HTMLElement;
    selectNode(target);
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
