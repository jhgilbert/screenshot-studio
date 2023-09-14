console.log("content loaded");

let selectedNode: HTMLElement | null = null;
const SELECTED_NODE_CLASSNAME = "selected-page-node";

document.addEventListener("click", function (e: PointerEvent) {
  const target = e.target as HTMLElement;
  selectedNode?.classList.remove(SELECTED_NODE_CLASSNAME);
  console.log("Selected node classlist is ", selectedNode?.classList);
  selectedNode = target;
  target.classList.add(SELECTED_NODE_CLASSNAME);
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
import("./components/Demo");
