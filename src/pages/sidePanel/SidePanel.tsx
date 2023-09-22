import React, { useState } from "react";
import "@pages/panel/Panel.css";
import Switch from "@mui/material/Switch";
import Button from "@mui/material/Button";
import BlurOnIcon from "@mui/icons-material/BlurOn";
import DeblurIcon from "@mui/icons-material/Deblur";
import LabelIcon from "@mui/icons-material/Label";
import LabelOffIcon from "@mui/icons-material/LabelOff";
import FeaturedVideoIcon from "@mui/icons-material/FeaturedVideo";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import PreviewIcon from "@mui/icons-material/Preview";
import DeleteIcon from "@mui/icons-material/Delete";
import AspectRatioIcon from "@mui/icons-material/AspectRatio";
import DeselectIcon from "@mui/icons-material/Deselect";

const sendMessage = async (message: { type: string; payload?: any }) => {
  console.log("Attempting to send message from side panel:", message);
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  const response = await chrome.tabs.sendMessage(tab.id, message);
  return response;
};

/* TODO: The result of the sendMessage function needs to
be used as the new selectedNodeAttrs state. */

const SelectionMenu = ({
  selectedNodeAttrs,
}: {
  selectedNodeAttrs: Record<string, any>;
}) => {
  return (
    <div>
      <p className="mt-4 mb-1 text-base text-center">Select ...</p>
      <Button
        sx={{ width: "50%", marginBottom: "3px" }}
        variant="outlined"
        startIcon={<AspectRatioIcon />}
        onClick={() => {
          sendMessage({ type: "select-parent" });
        }}
      >
        Parent
      </Button>
      <Button
        sx={{ width: "50%", marginBottom: "3px" }}
        variant="outlined"
        startIcon={<DeselectIcon />}
        onClick={() => {
          sendMessage({ type: "select-none" });
        }}
      >
        None
      </Button>
      <p className="mt-4 mb-1 text-base text-center">Edit selected content:</p>
      <Button
        sx={{ width: "50%", marginBottom: "3px" }}
        variant="outlined"
        startIcon={<BlurOnIcon />}
        onClick={() => {
          sendMessage({ type: "blur-selected-more" });
        }}
      >
        Blur more
      </Button>
      <Button
        disabled={!selectedNodeAttrs.isBlurred}
        startIcon={<DeblurIcon />}
        sx={{ width: "50%", marginBottom: "3px" }}
        variant="outlined"
        onClick={() => {
          sendMessage({ type: "blur-selected-less" });
        }}
      >
        Blur less
      </Button>
      <Button
        disabled={selectedNodeAttrs.isLabeled}
        sx={{ width: "50%", marginBottom: "3px" }}
        variant="outlined"
        startIcon={<LabelIcon />}
        onClick={() => {
          sendMessage({ type: "label-selected" });
        }}
      >
        Label
      </Button>
      <Button
        disabled={!selectedNodeAttrs.isLabeled}
        sx={{ width: "50%", marginBottom: "3px" }}
        variant="outlined"
        startIcon={<LabelOffIcon />}
        onClick={() => {
          sendMessage({ type: "unlabel-selected" });
        }}
      >
        Unlabel
      </Button>
      <div className="mt-2"></div>
      <Button
        disabled={selectedNodeAttrs.isShowcased}
        sx={{ width: "100%", marginBottom: "3px" }}
        variant="outlined"
        startIcon={<FeaturedVideoIcon />}
        onClick={() => {
          sendMessage({ type: "showcase-selected" });
        }}
      >
        Showcase
      </Button>
      <Button
        disabled={!selectedNodeAttrs.isShowcased}
        sx={{ width: "100%", marginBottom: "3px" }}
        variant="outlined"
        startIcon={<PreviewIcon />}
        onClick={() => {
          sendMessage({ type: "unshowcase-selected" });
        }}
      >
        Remove showcase
      </Button>
      <div className="mt-2"></div>
      <Button
        disabled={selectedNodeAttrs.isHidden}
        sx={{ width: "50%", marginBottom: "3px" }}
        variant="outlined"
        startIcon={<VisibilityOffIcon />}
        onClick={() => {
          sendMessage({ type: "hide-selected" });
        }}
      >
        Hide
      </Button>
      <Button
        disabled={!selectedNodeAttrs.isHidden}
        sx={{ width: "50%", marginBottom: "3px" }}
        variant="outlined"
        startIcon={<VisibilityIcon />}
        onClick={() => {
          sendMessage({ type: "show-selected" });
        }}
      >
        Show
      </Button>
      <Button
        sx={{ width: "100%", marginBottom: "3px" }}
        color="warning"
        variant="outlined"
        startIcon={<DeleteIcon />}
        onClick={() => {
          sendMessage({ type: "delete-selected" });
        }}
      >
        Delete
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
      {nodeIsSelected && (
        <>
          <SelectionMenu selectedNodeAttrs={selectedNodeAttrs} />
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
