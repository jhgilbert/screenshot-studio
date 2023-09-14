console.log("content loaded");

document.addEventListener("click", function () {
  chrome.runtime.sendMessage({}, function () {
    console.log("document clicked");
  });
});

/**
 * @description
 * Chrome extensions don't support modules in content scripts.
 */
import("./components/Demo");
