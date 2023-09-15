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

const SelectionMenu: React.FC = () => {
  return (
    <div>
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
      <br />
      <br />
      <Button
        sx={{ width: "100%", marginBottom: "3px" }}
        variant="outlined"
        onClick={() => {
          sendMessage({ type: "blur-selected" });
        }}
      >
        Blur selected
      </Button>
      <Button
        sx={{ width: "100%", marginBottom: "3px" }}
        variant="outlined"
        onClick={() => {
          sendMessage({ type: "delete-selected" });
        }}
      >
        Delete selected
      </Button>
      <Button
        sx={{ width: "100%", marginBottom: "3px" }}
        variant="outlined"
        onClick={() => {
          sendMessage({ type: "hide-selected" });
        }}
      >
        Hide selected
      </Button>
      <Button
        sx={{ width: "100%", marginBottom: "3px" }}
        variant="outlined"
        onClick={() => {
          sendMessage({ type: "label-selected" });
        }}
      >
        Label selected
      </Button>
      <Button
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
  const [userIsEditing, setUserIsEditing] = useState(false);
  const [selectionIsActive, setSelectionIsActive] = useState(false);

  chrome.runtime.onMessage.addListener(function (
    message: { type: string; payload?: any },
    sender,
    sendResponse
  ) {
    if (message.type === "item-is-selected") {
      setSelectionIsActive(message.payload);
    }
    sendResponse("ack");
  });

  return (
    <div>
      <div>
        <Switch
          checked={userIsEditing}
          onChange={(event) => {
            setUserIsEditing(event.target.checked);
            sendMessage({
              type: "set-user-is-editing",
              payload: event.target.checked,
            });
          }}
          inputProps={{ "aria-label": "controlled" }}
        />{" "}
      </div>
      <Button
        sx={{ width: "100%", marginBottom: "3px" }}
        variant="outlined"
        onClick={() => {
          sendMessage({ type: "obscure-pii" });
        }}
      >
        Obscure PII on page
      </Button>
      {selectionIsActive && (
        <>
          <br />
          <br />
          <SelectionMenu />
        </>
      )}
    </div>
  );
};

export default SidePanel;
