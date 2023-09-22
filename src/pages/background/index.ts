import reloadOnUpdate from "virtual:reload-on-update-in-background-script";

reloadOnUpdate("pages/background");

/**
 * Extension reloading is necessary because the browser automatically caches the css.
 * If you do not use the css of the content script, please delete it.
 */
reloadOnUpdate("pages/content/style.scss");

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .then(() => console.log("background loaded"));

// send message on tab change
chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  await chrome.tabs
    .sendMessage(tabId, {
      type: "tab-updated",
    })
    .catch((e) => console.log(e));
});
