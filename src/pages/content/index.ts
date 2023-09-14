console.log("content loaded");

document.addEventListener("click", function (e: PointerEvent) {
  const target = e.target as HTMLElement;
  target.classList.add("selected-page-node");
  chrome.runtime.sendMessage("document-clicked", function (response) {
    console.log("event is ", e);
    console.log("document clicked");
    console.log("response is ", response);
  });
});

/**
 * @description
 * Chrome extensions don't support modules in content scripts.
 */
import("./components/Demo");
