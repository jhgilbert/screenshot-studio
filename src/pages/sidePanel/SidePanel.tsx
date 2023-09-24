import React, { useState } from "react";
import "@pages/panel/Panel.css";
import Switch from "@mui/material/Switch";
import Button from "@mui/material/Button";
import { SelectedNodeAttrs, ExtensionState } from "../../definitions";
import SelectionMenu from "./SelectionMenu";

const SidePanel: React.FC = () => {
  const [selectedNodeAttrs, setSelectedNodeAttrs] =
    useState<SelectedNodeAttrs | null>(null);
  const [nodeIsSelected, setNodeIsSelected] = useState<boolean>(false);
  const [extensionIsActive, setExtensionIsActive] = useState<boolean>(false);

  const sendMessage = async (message: { type: string; payload?: any }) => {
    console.log("Attempting to send message from side panel:", message);
    const [tab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });
    if (tab === undefined || tab.id === undefined) {
      console.log("No active tab found, message canceled.");
      return;
    }
    const {
      nodeIsSelected,
      extensionIsActive,
      selectedNodeAttrs,
    }: ExtensionState = await chrome.tabs.sendMessage(tab.id, message);
    setNodeIsSelected(nodeIsSelected);
    setExtensionIsActive(extensionIsActive);
    setSelectedNodeAttrs(selectedNodeAttrs || null);
  };

  chrome.runtime.onMessage.addListener(function (message: {
    type: string;
    payload?: any;
  }) {
    if (message.type === "set-selected-node-attrs") {
      console.log("set-selected-node-attrs", message.payload);
      if (message.payload !== null) {
        setNodeIsSelected(true);
        setSelectedNodeAttrs(message.payload);
      } else {
        setNodeIsSelected(false);
        setSelectedNodeAttrs(null);
      }
    } else if (message.type === "set-extension-is-active") {
      setExtensionIsActive(message.payload);
    }
  });

  return (
    <div>
      <div>
        <Switch
          checked={extensionIsActive}
          onChange={(event) => {
            setExtensionIsActive(event.target.checked);
            sendMessage({
              type: "set-extension-is-active",
              payload: event.target.checked,
            });
          }}
          inputProps={{ "aria-label": "controlled" }}
        />{" "}
      </div>
      <Button
        disabled={!extensionIsActive}
        sx={{ width: "100%", marginBottom: "3px" }}
        variant="outlined"
        onClick={() => {
          sendMessage({ type: "obscure-pii" });
        }}
      >
        Obscure PII on page
      </Button>
      {nodeIsSelected && selectedNodeAttrs !== null && (
        <>
          <SelectionMenu
            selectedNodeAttrs={selectedNodeAttrs}
            sendMessageCallback={sendMessage}
          />
        </>
      )}
      {!nodeIsSelected && extensionIsActive && (
        <p className="text-base text-center mt-2">
          Click on an element to select it.
        </p>
      )}
    </div>
  );
};

export default SidePanel;
