console.log("content loaded");

let selectedNode: HTMLElement | null = null;
let extensionIsActive: boolean = false;

function selectNode(node: HTMLElement) {
  deselectNode(selectedNode);
  selectedNode = node;
  node.style.outline = "2px dotted hotpink";
  chrome.runtime.sendMessage({
    type: "set-selected-node-attrs",
    payload: {
      innerText: selectedNode.innerText,
    },
  });
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
  node.style.outline = "";
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
    sibling.style.opacity = "0.3";
  }
}

chrome.runtime.onMessage.addListener(function (
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
  } else if (message.type === "hide-selected" && selectedNode) {
    selectedNode.style.visibility = "hidden";
  } else if (message.type === "showcase-selected" && selectedNode) {
    showcaseSelected();
  } else if (message.type === "obscure-pii") {
    obscurePii();
  } else if (message.type === "select-none") {
    deselectNode(selectedNode);
  } else if (message.type === "set-extension-is-active") {
    extensionIsActive = message.payload;
    if (!extensionIsActive) {
      deselectNode(selectedNode);
    } else {
      document.body.contentEditable = "true";
    }
  }
  sendResponse("ack");
});

document.addEventListener("click", function (e: PointerEvent) {
  if (!extensionIsActive) return;
  e.preventDefault();
  const target = e.target as HTMLElement;
  selectNode(target);
});

/**
 * @description
 * Chrome extensions don't support modules in content scripts.
 */
// import("./components/Demo");
