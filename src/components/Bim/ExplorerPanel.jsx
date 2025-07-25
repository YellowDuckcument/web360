import React, { useState } from "react";
import { ImTree } from "react-icons/im";
import TabBar from "./tabbarbim";

const ExplorerPanel = () => {
  const [visible, setVisible] = useState(true);

  const togglePanel = () => {
    setVisible(!visible);
    const tree = document.getElementById("treeViewContainer");
    if (tree) tree.style.display = visible ? "none" : "block";
  };

  const handleTabChange = (tab) => {
    document.getElementById("tree-models").style.display =
      tab === "Models" ? "block" : "none";
    document.getElementById("tree-types").style.display =
      tab === "Class" ? "block" : "none";
    document.getElementById("tree-storeys").style.display =
      tab === "Storey" ? "block" : "none";
  };

  return (
    <>
      <button
        onClick={togglePanel}
        className="tree-toggle-btn"
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          zIndex: 1000,
          background: "#333",
          color: "white",
          border: "none",
          padding: "6px 10px",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "14px",
        }}
      >
        <ImTree />
      </button>

      <div
        id="treeViewContainer"
        style={{
          position: "absolute",
          top: "50px",
          left: "10px",
          maxHeight: "80vh",
          width: "360px",
          overflow: "hidden",
          background: "rgba(28,28,28,0.95)",
          color: "#eee",
          borderRadius: "10px",
          fontSize: "14px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.6)",
          transition: "opacity 0.3s ease, transform 0.3s ease",
          backdropFilter: "blur(6px)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 12px",
            background: "#222",
            borderBottom: "1px solid #444",
            fontWeight: "bold",
            fontSize: "15px",
          }}
        >
          <span role="img" aria-label="tree">
            <ImTree />
          </span>
          Explorer
        </div>

        <TabBar onChange={handleTabChange} />

        {/* Tree Content */}
        <div
          id="tree-models"
          style={{
            display: "block",
            overflowY: "auto",
            maxHeight: "calc(100vh - 50px)",
            padding: "10px",
          }}
        ></div>
        <div
          id="tree-types"
          style={{
            display: "none",
            padding: "10px",
            overflowY: "auto",
            maxHeight: "calc(80vh - 100px)",
          }}
        ></div>
        <div
          id="tree-storeys"
          style={{
            display: "none",
            padding: "10px",
            overflowY: "auto",
            maxHeight: "calc(80vh - 100px)",
          }}
        ></div>

        <style>
          {`
            .tree-toggle-btn {
                position: absolute;
                top: 10px;
                left: 10px;
                z-index: 1000;
                background: #333;
                color: white;
                border: none;
                padding: 6px 10px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.15s ease-in-out;
            }

            .tree-toggle-btn:hover {
                background: #444;
                transform: scale(1.05);
            }

            .tree-toggle-btn:active {
                background: #555;
                transform: scale(0.95);
            }
            `}
        </style>
      </div>
    </>
  );
};

export default ExplorerPanel;
