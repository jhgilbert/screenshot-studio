import reloadOnUpdate from "virtual:reload-on-update-in-background-script";

reloadOnUpdate("pages/background");

/**
 * Extension reloading is necessary because the browser automatically caches the css.
 * If you do not use the css of the content script, please delete it.
 */
reloadOnUpdate("pages/content/style.scss");

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

/**
 * Only enable the side panel on tabs that support it.
 * If a tab doesn't answer, it doesn't have a content script enabled,
 * and the side panel should not be shown on that page.
 *
 * Most tabs support the extension, but chrome:// pages
 * such as chrome://newtab do not.
 */
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const activeTabId = activeInfo.tabId;
  if (!activeTabId) return;
  chrome.tabs
    .sendMessage(activeTabId, { type: "confirm-sidepanel-support" })
    .then(async (response) => {
      if (response.sidePanelIsSupported) {
        chrome.sidePanel.setOptions({ enabled: true });
      }
    })
    .catch(async (e) => {
      chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
      chrome.sidePanel.setOptions({ enabled: false });
    });
});

/**
 * If the user closes the side panel, send a message to every tab
 * to deactivate the extension.
 */
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

/**
 * Handle requests from content scripts to update the side panel.
 */
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
