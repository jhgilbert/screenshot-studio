console.log("content loaded");

let selectedNode: HTMLElement | null = null;
let extensionIsActive: boolean = false;

const SELECTED_NODE_CLASS = "screenshot-studio-selected-element";
const LABEL_DIV_CLASS = "screenshot-studio-label";
const LABELED_NODE_CLASS = "screenshot-studio-labeled-element";
const SHOWCASED_NODE_CLASS = "screenshot-studio-showcased-element";

function selectNode(node: HTMLElement) {
  deselectNode(selectedNode);
  selectedNode = node;
  selectedNode.classList.add(SELECTED_NODE_CLASS);
  if (selectedNode.classList.contains(LABEL_DIV_CLASS)) {
    document.body.contentEditable = "false";
  } else {
    document.body.contentEditable = "true";
  }
  broadcastSelectionData();
}

const buildSelectedNodeAttrs = () => {
  if (!selectedNode) return null;
  const attrs: Record<string, any> = {
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
    await chrome.runtime.sendMessage({
      type: "set-selected-node-attrs",
      payload: null,
    });
    return;
  }

  await chrome.runtime.sendMessage({
    type: "set-selected-node-attrs",
    payload: {
      innerText: selectedNode.innerText,
      isLabeled: elementHasLabel(selectedNode),
      isHidden: selectedNode.style.visibility === "hidden",
      isBlurred: getCurrentBlurLevel(selectedNode) > 0,
      isShowcased: selectedNode.classList.contains(SHOWCASED_NODE_CLASS),
    },
  });
}

function elementHasLabel(node: HTMLElement) {
  return node.classList.contains(LABELED_NODE_CLASS);
}

function dragElement(elmnt) {
  var pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
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
  const label = node.getElementsByClassName(LABEL_DIV_CLASS)[0];
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
  const labelInput = prompt(
    "Enter label text. Label will be draggable, but not editable."
  );
  // add a label div to the node
  const label = document.createElement("div");
  label.classList.add(LABEL_DIV_CLASS);
  label.innerText = labelInput;
  dragElement(label);
  label.style.position = "absolute";
  // put label on top of the node's border
  const rect = node.getBoundingClientRect();
  label.style.top = `${rect.top - 20 - nodeTopPadding}px`;
  label.style.height = "20px";
  label.style.left = `${rect.left + 5}px`;
  label.style.backgroundColor = "hotpink";
  label.style.color = "white";
  label.style.paddingLeft = "10px";
  label.style.paddingRight = "10px";
  label.style.paddingTop = "5px";
  label.style.paddingBottom = "5px";
  label.style.fontSize = "18px";
  label.style.fontWeight = "bold";
  label.style.borderTopLeftRadius = "5px";
  label.style.borderTopRightRadius = "5px";
  node.append(label);
  selectNode(label);
}

const blurFilterRegex = /blur\((\d+)px\)/;

const getCurrentBlurLevel = (node: HTMLElement) => {
  let currentBlurLevel: number = 0;
  if (blurFilterRegex.test(node.style.filter)) {
    currentBlurLevel = parseInt(node.style.filter.match(blurFilterRegex)[1]);
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

document.addEventListener("click", function (e: PointerEvent) {
  if (!extensionIsActive) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  const target = e.target as HTMLElement;
  selectNode(target);
  return false;
});

/**
 * @description
 * Chrome extensions don't support modules in content scripts.
 */
// import("./components/Demo");
