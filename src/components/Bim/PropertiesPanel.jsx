import React, { useState, useEffect } from "react";
import { LuClipboardList } from "react-icons/lu";

const PropertiesPanel = ({ viewer }) => {
  const [visible, setVisible] = useState(false);
  const [selectedProps, setSelectedProps] = useState(null);

  const togglePanel = () => setVisible(!visible);

  useEffect(() => {
    const handleTreeClick = (e) => {
      const span = e.target.closest("span[data-xeokit-entity-id]");
      if (span && viewer) {
        const entityId = span.getAttribute("data-xeokit-entity-id");
        const entity = viewer.scene.objects[entityId];

        if (entity) {
          // Highlight entity
          Object.values(viewer.scene.objects).forEach((obj) => {
            obj.selected = false;
            obj.highlighted = false;
          });

          entity.selected = true;
          entity.highlighted = true;

          const props = entity.metaObject?.props || null;
          setSelectedProps(props);
          setVisible(true);
        }
      }
    };

    document.addEventListener("click", handleTreeClick);
    return () => document.removeEventListener("click", handleTreeClick);
  }, [viewer]);

  // Tách General + PropertySet
  const generalProps = {};
  const propertySets = selectedProps?.PropertySet || {};
  if (selectedProps) {
    for (const [key, value] of Object.entries(selectedProps)) {
      if (key !== "PropertySet") {
        generalProps[key] = value;
      }
    }
  }

  const mergedProps = {
    ...(Object.keys(generalProps).length > 0 && { General: generalProps }),
    ...propertySets,
  };

  return (
    <>
      <button
        onClick={togglePanel}
        className="tree-toggle-btn"
        style={{
          position: "absolute",
          top: "10px",
          left: "50px",
          zIndex: 1000,
          background: "#333",
          color: "white",
          border: "none",
          padding: "6px 10px",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "14px",
        }}
        title="Toggle Properties Panel"
      >
        <LuClipboardList />
      </button>

      {visible && (
        <div
          id="propertiesPanel"
          style={{
            position: "absolute",
            top: "50px",
            right: "180px",
            maxHeight: "80vh",
            width: "360px",
            overflowY: "auto",
            background: "rgba(28,28,28,0.95)",
            color: "#eee",
            borderRadius: "10px",
            fontSize: "14px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.6)",
            backdropFilter: "blur(6px)",
            padding: "10px",
            zIndex: 999,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "10px",
              fontWeight: "bold",
              fontSize: "15px",
            }}
          >
            <LuClipboardList />
            Properties
          </div>

          {mergedProps && Object.keys(mergedProps).length > 0 ? (
            Object.entries(mergedProps).map(([category, attrs]) => (
              <div key={category} style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    fontWeight: "bold",
                    fontSize: "13px",
                    color: "#ccc",
                    marginBottom: "6px",
                    borderBottom: "1px solid #444",
                    paddingBottom: "4px",
                  }}
                >
                  {category}
                </div>
                <table
                  style={{
                    width: "100%",
                    fontSize: "13px",
                    borderCollapse: "collapse",
                  }}
                >
                  <tbody>
                    {Object.entries(attrs).map(([key, value]) => (
                      <tr key={key}>
                        <td
                          style={{
                            padding: "4px 6px",
                            borderBottom: "1px solid #444",
                            color: "#bbb",
                            width: "40%",
                          }}
                        >
                          {key}
                        </td>
                        <td
                          style={{
                            padding: "4px 6px",
                            borderBottom: "1px solid #444",
                            color: "#eee",
                          }}
                        >
                          {String(value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          ) : (
            <div style={{ color: "#aaa", fontStyle: "italic" }}>
              No properties selected.
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default PropertiesPanel;
