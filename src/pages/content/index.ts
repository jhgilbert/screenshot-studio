import {
  SelectedNodeAttrs,
  SELECTED_NODE_CLASS,
  LABEL_TAB_CLASS,
  LABELED_NODE_CLASS,
  SHOWCASED_NODE_CLASS,
} from "../../definitions";
import { z } from "zod";

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

/*
We don't want all content scripts to respond to the service worker's message,
just the content script that is active in the current tab.
*/

const buildSelectedNodeAttrs = (
  selectedNode: HTMLElement
): SelectedNodeAttrs => {
  const attrs: SelectedNodeAttrs = {
    innerText: selectedNode.innerText,
    isLabeled: elementHasLabel(selectedNode),
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

function elementHasLabel(node: HTMLElement) {
  return node.classList.contains(LABELED_NODE_CLASS);
}

function dragElement(elmnt: HTMLElement) {
  var pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  const header = document.getElementById(elmnt.id + "header");
  if (header) {
    // if present, the header is where you move the DIV from:
    header.onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e: MouseEvent) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e: MouseEvent) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = elmnt.offsetTop - pos2 + "px";
    elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

function unLabel(node: HTMLElement) {
  const label = node.getElementsByClassName(LABEL_TAB_CLASS)[0];
  if (label) {
    label.remove();
  }
  node.classList.remove(LABELED_NODE_CLASS);
  node.style.outline = "";
}

function addLabel(node: HTMLElement) {
  // add a hot pink outline to the node
  node.style.outline = "3px solid hotpink";
  const nodeTopPadding = parseInt(
    window.getComputedStyle(node).getPropertyValue("padding-top")
  );
  // prompt user to enter a label
  // TODO: Does prompt actually return null instead of an empty string?
  const labelInput = prompt(
    "Enter label text. Label will be draggable, but not editable."
  );
  // add a label div to the node
  const label = document.createElement("div");
  label.classList.add(LABEL_TAB_CLASS);
  label.innerText = labelInput as string;
  dragElement(label);
  label.style.position = "absolute";
  // put label on top of the node's border
  const rect = node.getBoundingClientRect();
  label.style.top = `${rect.top - 20 - nodeTopPadding}px`;
  label.style.height = "30px";
  label.style.left = `${rect.left + 5}px`;
  label.style.backgroundColor = "hotpink";
  label.style.lineHeight = "20px";
  label.style.color = "white";
  label.style.paddingLeft = "10px";
  label.style.paddingRight = "10px";
  label.style.paddingTop = "5px";
  label.style.paddingBottom = "5px";
  label.style.fontSize = "18px";
  label.style.fontWeight = "bold";
  label.style.fontFamily = "Arial, sans-serif";
  label.style.borderTopLeftRadius = "5px";
  label.style.borderTopRightRadius = "5px";
  node.classList.add(LABELED_NODE_CLASS);
  node.append(label);
  selectNode(label);
}

const blurFilterRegex = /blur\((\d+)px\)/;

const getCurrentBlurLevel = (node: HTMLElement) => {
  let currentBlurLevel: number = 0;
  if (blurFilterRegex.test(node.style.filter)) {
    const match = node.style.filter.match(blurFilterRegex) as RegExpMatchArray;
    currentBlurLevel = parseInt(match[1]);
  }
  return currentBlurLevel;
};

function blurMore() {
  if (!selectedNode) return;
  const currentBlurLevel = getCurrentBlurLevel(selectedNode);
  selectedNode.style.filter = `blur(${currentBlurLevel + 1}px)`;
}

function blurLess() {
  if (!selectedNode) return;
  const currentBlurLevel = getCurrentBlurLevel(selectedNode);
  if (currentBlurLevel > 0) {
    selectedNode.style.filter = `blur(${currentBlurLevel - 1}px)`;
  }
}

function deselectNode(node: HTMLElement | null) {
  if (!node) return;
  node.classList.remove(SELECTED_NODE_CLASS);
  chrome.runtime.sendMessage({
    type: "set-selected-node-attrs",
    payload: null,
  });
}

function temporarilyHighlightObscuredPii() {
  const obscuredPii = document.getElementsByClassName(
    "screenshot-studio-obscured-pii"
  );
  if (obscuredPii) {
    for (let i = 0; i < obscuredPii.length; i++) {
      const element = obscuredPii[i] as HTMLElement;
      element.style.backgroundColor = "yellow";
      setTimeout(() => {
        element.style.backgroundColor = "";
      }, 5000);
    }
  }
}

function obscureIpAddressesOnPage() {
  const ipRegex = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g;
  const ipAddresses = document.body.innerText.match(ipRegex);
  if (ipAddresses) {
    ipAddresses.forEach((ipAddress) => {
      document.body.innerHTML = document.body.innerHTML.replace(
        ipAddress,
        "<span class='screenshot-studio-obscured-pii'>0.0.0.0</span>"
      );
    });
  }
}

function obscureEmailAddressesOnPage() {
  const emailRegex = /\S+@\S+\.\S+/g;
  const emailAddresses = document.body.innerText.match(emailRegex);
  if (emailAddresses) {
    emailAddresses.forEach((emailAddress) => {
      document.body.innerHTML = document.body.innerHTML.replace(
        emailAddress,
        "<span class='screenshot-studio-obscured-pii'>user@example.com</span>"
      );
    });
  }
}

function obscurePii() {
  obscureIpAddressesOnPage();
  obscureEmailAddressesOnPage();
  temporarilyHighlightObscuredPii();
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

function showcaseSelected() {
  if (!selectedNode) return;
  const ancestors = getElementAncestors(selectedNode);

  // get the siblings of the selected element
  let siblings: HTMLElement[] = [];
  siblings = getElementSiblings(selectedNode);

  // get the siblings of all ancestors
  ancestors.forEach((ancestor) => {
    siblings = siblings.concat(getElementSiblings(ancestor));
  });

  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i] as HTMLElement;
    sibling.style.opacity = "0.25";
  }

  selectedNode.classList.add(SHOWCASED_NODE_CLASS);
}

function unshowcaseSelected() {
  if (!selectedNode) return;
  const ancestors = getElementAncestors(selectedNode);

  // get the siblings of the selected element
  let siblings: HTMLElement[] = [];
  siblings = getElementSiblings(selectedNode);

  // get the siblings of all ancestors
  ancestors.forEach((ancestor) => {
    siblings = siblings.concat(getElementSiblings(ancestor));
  });

  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i] as HTMLElement;
    sibling.style.opacity = "1";
  }

  selectedNode.classList.remove(SHOWCASED_NODE_CLASS);
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
    blurMore();
  } else if (message.type === "blur-selected-less" && selectedNode) {
    blurLess();
  } else if (message.type === "delete-selected" && selectedNode) {
    selectedNode.style.display = "none";
    deselectNode(selectedNode);
  } else if (message.type === "hide-selected" && selectedNode) {
    selectedNode.style.visibility = "hidden";
  } else if (message.type === "show-selected" && selectedNode) {
    selectedNode.style.visibility = "visible";
  } else if (message.type === "showcase-selected" && selectedNode) {
    showcaseSelected();
  } else if (message.type === "unshowcase-selected" && selectedNode) {
    unshowcaseSelected();
  } else if (message.type === "obscure-pii") {
    obscurePii();
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
    addLabel(selectedNode);
  } else if (message.type === "unlabel-selected") {
    if (!selectedNode) return;
    unLabel(selectedNode);
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
