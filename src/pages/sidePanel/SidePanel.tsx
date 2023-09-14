import React from "react";
import "@pages/panel/Panel.css";

const blurSelected = async () => {
  console.log("Sending blurSelected message");
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  await chrome.tabs.sendMessage(tab.id, { type: "blur-selected" });
};

const selectParent = async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  await chrome.tabs.sendMessage(tab.id, { type: "select-parent" });
};

const SidePanel: React.FC = () => {
  return (
    <div>
      <p>4</p>
      <button onClick={blurSelected}>Blur selected</button>
      <button onClick={selectParent}>Select parent</button>
      <hr />
      <div>"Edit mode" toggle.</div>
      <div>Page menu</div>
      <ul>
        <li>Obscure PII</li>
      </ul>
      <div>Select menu:</div>
      <ul>
        <li>Select none</li>
        <li>Select parent</li>
      </ul>
      <div>Selected item menu:</div>
      <ul>
        <li>Blur button</li>
        <li>Reset</li>
      </ul>
    </div>
  );
};

export default SidePanel;
