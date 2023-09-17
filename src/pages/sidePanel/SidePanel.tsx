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
      <p className="mt-4 mb-1 text-base text-center">Change selection</p>
      <Button
        sx={{ width: "100%", marginBottom: "3px" }}
        variant="outlined"
        onClick={() => {
          sendMessage({ type: "select-parent" });
        }}
      >
        Select parent
      </Button>
      <Button
        sx={{ width: "100%", marginBottom: "3px" }}
        variant="outlined"
        onClick={() => {
          sendMessage({ type: "select-none" });
        }}
      >
        Select none
      </Button>
      <p className="mt-4 mb-1 text-base text-center">Edit selected content</p>
      <Button
        sx={{ width: "100%", marginBottom: "3px" }}
        variant="outlined"
        onClick={() => {
          sendMessage({ type: "blur-selected-more" });
        }}
      >
        Blur more
      </Button>
      <Button
        disabled={!selectedNodeAttrs.isBlurred}
        sx={{ width: "100%", marginBottom: "3px" }}
        variant="outlined"
        onClick={() => {
          sendMessage({ type: "blur-selected-less" });
        }}
      >
        Blur less
      </Button>
      <Button
        sx={{ width: "100%", marginBottom: "3px" }}
        variant="outlined"
        onClick={() => {
          sendMessage({ type: "delete-selected" });
        }}
      >
        Delete
      </Button>
      <Button
        disabled={selectedNodeAttrs.isHidden}
        sx={{ width: "100%", marginBottom: "3px" }}
        variant="outlined"
        onClick={() => {
          sendMessage({ type: "hide-selected" });
        }}
      >
        Hide
      </Button>
      <Button
        disabled={selectedNodeAttrs.isLabeled}
        sx={{ width: "100%", marginBottom: "3px" }}
        variant="outlined"
        onClick={() => {
          sendMessage({ type: "label-selected" });
        }}
      >
        Label
      </Button>
      <Button
        disabled={!selectedNodeAttrs.isLabeled}
        sx={{ width: "100%", marginBottom: "3px" }}
        variant="outlined"
        onClick={() => {
          sendMessage({ type: "unlabel-selected" });
        }}
      >
        Unlabel
      </Button>
      <Button
        disabled={selectedNodeAttrs.isShowcased}
        sx={{ width: "100%", marginBottom: "3px" }}
        variant="outlined"
        onClick={() => {
          sendMessage({ type: "showcase-selected" });
        }}
      >
        Showcase
      </Button>
      <p className="text-base text-center mt-2">
        You can edit the text of most selections.
      </p>
    </div>
  );
};

const SidePanel: React.FC = () => {
  const [selectedNodeAttrs, setSelectedNodeAttrs] = useState(null);
  const [nodeIsSelected, setNodeIsSelected] = useState(false);
  const [extensionIsActive, setExtensionIsActive] = useState(false);

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
      {nodeIsSelected && (
        <>
          <SelectionMenu
            extensionIsActive={extensionIsActive}
            selectedNodeAttrs={selectedNodeAttrs}
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
