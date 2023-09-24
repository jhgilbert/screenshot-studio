import reloadOnUpdate from "virtual:reload-on-update-in-background-script";

reloadOnUpdate("pages/background");

/**
 * Extension reloading is necessary because the browser automatically caches the css.
 * If you do not use the css of the content script, please delete it.
 */
reloadOnUpdate("pages/content/style.scss");

chrome.sidePanel.setOptions({
  enabled: false,
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Only enable the side panel on supported tabs
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const activeTabId = activeInfo.tabId;
  if (!activeTabId) return;
  chrome.tabs
    .sendMessage(activeTabId, { type: "confirm-sidepanel-support" })
    .then((response) => {
      if (response.sidePanelIsSupported) {
        chrome.sidePanel.setOptions({ enabled: true });
      }
    })
    .catch(async (e) => {
      await chrome.sidePanel.setOptions({ enabled: false });
    });
});

chrome.runtime.onConnect.addListener(function (port) {
  if (port.name === "sidepanel") {
    port.onDisconnect.addListener(async () => {
      chrome.tabs.query({}, function (tabs) {
        var message = { type: "sidepanel-closed" };
        for (var i = 0; i < tabs.length; ++i) {
          chrome.tabs.sendMessage(tabs[i].id as number, message).catch((e) => {
            console.log(e);
          });
        }
      });
    });
  }
});

chrome.runtime.onMessage.addListener(async function (
  message: { type: string; payload?: any },
  sender,
  sendResponse
) {
  if (message.type === "enable-sidepanel") {
    await chrome.sidePanel.setOptions({ enabled: true });
    return;
  }
});
