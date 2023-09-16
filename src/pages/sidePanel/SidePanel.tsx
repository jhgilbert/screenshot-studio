import React, { useState } from "react";
import "@pages/panel/Panel.css";
import Switch from "@mui/material/Switch";
import Button from "@mui/material/Button";

const sendMessage = async (message: { type: string; payload?: any }) => {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  await chrome.tabs.sendMessage(tab.id, message);
};

const SelectionMenu = ({
  extensionIsActive,
  selectedNodeAttrs,
}: {
  extensionIsActive: boolean;
  selectedNodeAttrs: Record<string, any>;
}) => {
  return (
    <div>
      <div>{JSON.stringify(selectedNodeAttrs)}</div>
      <Button
        disabled={!extensionIsActive}
        sx={{ width: "100%", marginBottom: "3px" }}
        variant="outlined"
        onClick={() => {
          sendMessage({ type: "select-parent" });
        }}
      >
        Select parent
      </Button>
      <Button
        disabled={!extensionIsActive}
        sx={{ width: "100%", marginBottom: "3px" }}
        variant="outlined"
        onClick={() => {
          sendMessage({ type: "select-none" });
        }}
      >
        Select none
      </Button>
      <br />
      <br />
      <Button
        disabled={!extensionIsActive}
        sx={{ width: "100%", marginBottom: "3px" }}
        variant="outlined"
        onClick={() => {
          sendMessage({ type: "blur-selected" });
        }}
      >
        Blur selected
      </Button>
      <Button
        disabled={!extensionIsActive}
        sx={{ width: "100%", marginBottom: "3px" }}
        variant="outlined"
        onClick={() => {
          sendMessage({ type: "delete-selected" });
        }}
      >
        Delete selected
      </Button>
      <Button
        disabled={!extensionIsActive}
        sx={{ width: "100%", marginBottom: "3px" }}
        variant="outlined"
        onClick={() => {
          sendMessage({ type: "hide-selected" });
        }}
      >
        Hide selected
      </Button>
      <Button
        disabled={!extensionIsActive}
        sx={{ width: "100%", marginBottom: "3px" }}
        variant="outlined"
        onClick={() => {
          sendMessage({ type: "label-selected" });
        }}
      >
        Label selected
      </Button>
      <Button
        disabled={!extensionIsActive}
        sx={{ width: "100%", marginBottom: "3px" }}
        variant="outlined"
        onClick={() => {
          sendMessage({ type: "showcase-selected" });
        }}
      >
        Showcase selected
      </Button>
    </div>
  );
};

const SidePanel: React.FC = () => {
  const [selectedNodeAttrs, setSelectedNodeAttrs] = useState(null);
  const [extensionIsActive, setExtensionIsActive] = useState(false);

  chrome.runtime.onMessage.addListener(function (
    message: { type: string; payload?: any },
    sender,
    sendResponse
  ) {
    if (message.type === "set-selected-node-attrs") {
      setSelectedNodeAttrs(message.payload);
    }
    sendResponse("ack");
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
      {selectedNodeAttrs && (
        <>
          <br />
          <br />
          <SelectionMenu
            extensionIsActive={extensionIsActive}
            selectedNodeAttrs={selectedNodeAttrs}
          />
        </>
      )}
    </div>
  );
};

export default SidePanel;
