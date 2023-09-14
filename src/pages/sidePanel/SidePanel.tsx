import React from "react";
import "@pages/panel/Panel.css";

const handleClick = () => {
  console.log("Clicked!");
};

const SidePanel: React.FC = () => {
  return (
    <div>
      <div>This is where image editing stuff will go.</div>
      <button onClick={handleClick}>Click me!</button>
    </div>
  );
};

export default SidePanel;
