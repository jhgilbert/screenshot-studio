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

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!tab.url) return;
  const url = new URL(tab.url);
  const chromeRegex = /chrome:\/\/.*/;
  // if the url contains the string "chrome", close the side panel
  if (url.href.match(chromeRegex)) {
    await chrome.sidePanel.setOptions({
      tabId,
      enabled: false,
    });
  }
  console.log(url);
});
