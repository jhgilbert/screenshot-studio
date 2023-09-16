console.log("content loaded");

let selectedNode: HTMLElement | null = null;
let extensionIsActive: boolean = false;

function selectNode(node: HTMLElement) {
  deselectNode(selectedNode);
  selectedNode = node;
  node.style.outline = "2px dotted hotpink";
  chrome.runtime.sendMessage({ type: "set-item-is-selected", payload: true });
}

function deselectNode(node: HTMLElement | null) {
  if (!node) return;
  node.style.outline = "";
  chrome.runtime.sendMessage({ type: "set-item-is-selected", payload: false });
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

chrome.runtime.onMessage.addListener(function (
  message: { type: string; payload?: any },
  sender,
  sendResponse
) {
  if (message.type === "select-parent") {
    selectNode(selectedNode?.parentElement!);
  } else if (message.type === "blur-selected" && selectedNode) {
    selectedNode.style.filter = "blur(5px)";
  } else if (message.type === "obscure-pii") {
    obscurePii();
  } else if (message.type === "set-extension-is-active") {
    extensionIsActive = message.payload;
  }
  sendResponse("ack");
});

document.addEventListener("click", function (e: PointerEvent) {
  if (!extensionIsActive) return;
  e.preventDefault();
  const target = e.target as HTMLElement;
  selectNode(target);
  chrome.runtime.sendMessage("document-clicked", function (response) {
    console.log("event is ", e);
    console.log("selectedNode is ", selectedNode);
    console.log("document clicked");
    console.log("response is ", response);
  });
});

/**
 * @description
 * Chrome extensions don't support modules in content scripts.
 */
// import("./components/Demo");
