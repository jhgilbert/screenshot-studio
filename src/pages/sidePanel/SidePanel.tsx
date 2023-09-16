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

const PageTextEditor = ({
  text,
  editCallback,
}: {
  text: string;
  editCallback: (newText: string) => void;
}) => {
  console.log("re-rendering page text editor, text is", text);
  const style = {
    width: "100%",
    padding: "5px",
  };
  // const [value, setValue] = useState(text);
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    // setValue(event.target.value);
    editCallback(event.target.value);
  };
  return <textarea style={style} defaultValue={text} onChange={handleChange} />;
};

const SelectionMenu = ({
  extensionIsActive,
  selectedNodeText,
}: {
  extensionIsActive: boolean;
  selectedNodeText: string;
}) => {
  return (
    <div>
      <PageTextEditor
        text={selectedNodeText}
        editCallback={(newText) => {
          sendMessage({ type: "edit-selected-inner-text", payload: newText });
        }}
      />
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
  const [selectedNodeText, setSelectedNodeText] = useState(null);
  const [nodeIsSelected, setNodeIsSelected] = useState(false);
  const [extensionIsActive, setExtensionIsActive] = useState(false);

  chrome.runtime.onMessage.addListener(function (message: {
    type: string;
    payload?: any;
  }) {
    if (message.type === "set-selected-node-attrs") {
      console.log("set-selected-node-attrs", message.payload);
      if (message.payload !== null) {
        setSelectedNodeText(message.payload.innerText);
        setNodeIsSelected(true);
      } else {
        setSelectedNodeText(null);
        setNodeIsSelected(false);
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
          <br />
          <br />
          <SelectionMenu
            extensionIsActive={extensionIsActive}
            selectedNodeText={selectedNodeText}
          />
        </>
      )}
    </div>
  );
};

export default SidePanel;
