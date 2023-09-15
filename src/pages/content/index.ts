console.log("content loaded");

let selectedNode: HTMLElement | null = null;

function selectNode(node: HTMLElement) {
  deselectNode(selectedNode);
  selectedNode = node;
  node.style.outline = "2px dotted hotpink";
}

chrome.runtime.onMessage.addListener(function (
  message: { type: string },
  sender,
  sendResponse
) {
  if (message.type === "select-parent") {
    selectNode(selectedNode?.parentElement!);
  } else if (message.type === "blur-selected" && selectedNode) {
    console.log("blurSelected message received");
    selectedNode.style.filter = "blur(5px)";
  }
  sendResponse("ack");
});

function deselectNode(node: HTMLElement | null) {
  if (!node) return;
  node.style.outline = "";
}

document.addEventListener("click", function (e: PointerEvent) {
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
