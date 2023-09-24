import { makeDraggable } from "./drag";
import { LABELED_NODE_CLASS, LABEL_TAB_CLASS } from "@root/src/definitions";

export function hasLabel(node: HTMLElement) {
  return node.classList.contains(LABELED_NODE_CLASS);
}

export function removeLabel(node: HTMLElement) {
  const label = node.getElementsByClassName(LABEL_TAB_CLASS)[0];
  if (label) {
    label.remove();
  }
  node.classList.remove(LABELED_NODE_CLASS);
  node.style.outline = "";
}

export function addLabel(node: HTMLElement) {
  node.style.outline = "3px solid hotpink";
  node.classList.add(LABELED_NODE_CLASS);
  // prompt user to enter a label
  // TODO: Does prompt actually return null instead of an empty string?
  const labelInput = prompt(
    "Enter label text. Label will be draggable, but not editable."
  );
  // add a label div to the node
  const label = document.createElement("div");
  label.classList.add(LABEL_TAB_CLASS);
  label.innerText = labelInput as string;
  makeDraggable(label);
  label.style.position = "absolute";
  // put label on top of the node's border
  const rect = node.getBoundingClientRect();
  const labelStyle = {
    top: `-30px`,
    height: "20px",
    left: `5px`,
    backgroundColor: "hotpink",
    lineHeight: "20px",
    color: "white",
    letterSpacing: "0.4",
    paddingLeft: "10px",
    paddingRight: "10px",
    paddingTop: "5px",
    paddingBottom: "5px",
    fontSize: "18px",
    fontWeight: "bold",
    fontFamily: "Arial, sans-serif",
    borderTopLeftRadius: "5px",
    borderTopRightRadius: "5px",
    boxSizing: "content-box",
    zIndex: "10000",
    textAlign: "center",
    textTransform: "none",
  };
  Object.assign(label.style, labelStyle);
  node.append(label);
  return label;
}
