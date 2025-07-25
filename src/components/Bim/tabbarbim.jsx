import { useState } from "react";

const TabBar = ({ onChange }) => {
  const [activeTab, setActiveTab] = useState("Models");
  const tabs = ["Models", "Class", "Storey"];

  const handleClick = (tab) => {
    setActiveTab(tab);
    onChange(tab);
  };

  return (
    <div style={{
      display: "flex",
      background: "#1e1e1e",
      borderBottom: "1px solid #333"
    }}>
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => handleClick(tab)}
          style={{
            flex: 1,
            padding: "10px 0",
            background: activeTab === tab ? "#2c2c2c" : "transparent",
            color: activeTab === tab ? "rgb(223, 227, 229)" : "#aaa",
            border: "none",
            fontWeight: "bold",
            fontSize: "14px",
            borderBottom: activeTab === tab ? "3px solid rgb(223, 227, 229)" : "3px solid transparent",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default TabBar;
