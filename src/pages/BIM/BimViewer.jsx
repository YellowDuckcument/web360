import { LuHouse  } from "react-icons/lu";
import React, { useLayoutEffect, useRef } from "react";
import {
  Viewer,
  XKTLoaderPlugin,
  NavCubePlugin,
  TreeViewPlugin,
  KTX2TextureTranscoder,
  FastNavPlugin,
  ContextMenu,
} from "@xeokit/xeokit-sdk";
import ExplorerPanel from "../../components/Bim/ExplorerPanel";
import PropertiesPanel from "../../components/Bim/PropertiesPanel";

const XeokitViewer = () => {
  const canvasRef = useRef(null);
  const navCubeRef = useRef(null);
  const viewerRef = useRef(null);

  useLayoutEffect(() => {
    if (!canvasRef.current || !navCubeRef.current) return;

    const viewer = new Viewer({
      canvasId: "myCanvas",
      transparent: true,
      dtxEnabled: false,
    });
    viewerRef.current = viewer;

    const textureTranscoder = new KTX2TextureTranscoder({
      viewer,
      transcoderPath:
        "https://cdn.jsdelivr.net/npm/@xeokit/xeokit-sdk/dist/basis/",
    });

    viewer.cameraControl.enablePivotSphere({ size: 1 });

    new NavCubePlugin(viewer, {
      canvasId: "myNavCubeCanvas",
      visible: true,
      size: 150,
      alignment: "bottomRight",
      bottomMargin: 100,
      rightMargin: 10,
      shadowVisible: false,
      color: "lightgrey",
    });

    new FastNavPlugin(viewer, {
      hideEdges: true,
      hideSAO: true,
      hidePBR: true,
      hideTransparentObjects: false,
      scaleCanvasResolution: false,
      scaleCanvasResolutionFactor: 0.5,
      delayBeforeRestore: true,
      delayBeforeRestoreSeconds: 0.1,
    });

    const createTree = (id, hierarchy) =>
      new TreeViewPlugin(viewer, {
        containerElement: document.getElementById(id),
        hierarchy,
        autoExpandDepth: 1,
      });

    const treeTypes = createTree("tree-types", "types");
    const treeStoreys = createTree("tree-storeys", "storeys");

    const xktLoader = new XKTLoaderPlugin(viewer, {
      textureTranscoder,
    });

    const sceneModel = xktLoader.load({
      id: "Tòa nhà Gtel - Nguyễn Tuân",
      src: "/models/xkt/scenetest.xkt",
      // src: "/models/ifc/HolterTower.ifc.xkt",
      edges: true,
      objectDefaults: {
        IfcWindow: {
          colorize: [0.337255, 0.303922, 0.870588], // Blue
          opacity: 0.3,
        },
        IfcSpace: { opacity: 0.4 },
      },
    });

    Object.assign(viewer.scene.camera, {
      eye: [14.91, 14.39, 5.43],
      look: [6.6, 8.34, -4.16],
      up: [-0.28, 0.9, -0.32],
    });

    const objectContextMenu = new ContextMenu({
      enabled: true,
      items: [
        // View
        [
          {
            getTitle: () => "View/Show",
            items: [
              [
                {
                  title: "View Fit",
                  doAction: ({ viewer, entity }) =>
                    viewer.cameraFlight.flyTo({
                      aabb: entity.aabb,
                      duration: 1,
                    }),
                },
                {
                  title: "Show All",
                  getEnabled: ({ viewer }) =>
                    viewer.scene.numVisibleObjects < viewer.scene.numObjects,
                  doAction: ({ viewer }) =>
                    viewer.scene.setObjectsVisible(
                      viewer.scene.objectIds,
                      true
                    ),
                },
              ],
            ],
          },
        ],
        // X-Ray
        [
          {
            getTitle: () => "X-Ray",
            items: [
              [
                {
                  getTitle: ({ entity }) =>
                    !entity.xrayed ? "X-Ray" : "Undo X-Ray",
                  doAction: ({ entity }) => (entity.xrayed = !entity.xrayed),
                },
                {
                  title: "Reset X-Ray",
                  getEnabled: ({ viewer }) => viewer.scene.numXRayedObjects > 0,
                  doAction: ({ viewer }) =>
                    viewer.scene.setObjectsXRayed(
                      viewer.scene.xrayedObjectIds,
                      false
                    ),
                },
              ],
            ],
          },
        ],
        // Select
        [
          {
            getTitle: () => "Select",
            items: [
              [
                {
                  getTitle: ({ entity }) =>
                    !entity.selected ? "Select" : "Unselect",
                  doAction: ({ entity }) =>
                    (entity.selected = !entity.selected),
                },
                {
                  title: "Clear Selection",
                  getEnabled: ({ viewer }) =>
                    viewer.scene.numSelectedObjects > 0,
                  doAction: ({ viewer }) =>
                    viewer.scene.setObjectsSelected(
                      viewer.scene.selectedObjectIds,
                      false
                    ),
                },
              ],
            ],
          },
        ],
        // Hide
        [
          {
            getTitle: () => "Hide",
            items: [
              [
                {
                  title: "Hide",
                  doAction: ({ entity }) => (entity.visible = false),
                },
                {
                  title: "Hide All",
                  getEnabled: ({ viewer }) =>
                    viewer.scene.numVisibleObjects > 0,
                  doAction: ({ viewer }) =>
                    viewer.scene.setObjectsVisible(
                      viewer.scene.visibleObjectIds,
                      false
                    ),
                },
              ],
            ],
          },
        ],
      ],
    });

    viewer.scene.canvas.canvas.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      const hit = viewer.scene.pick({
        canvasPos: [event.offsetX, event.offsetY],
      });
      const context = { viewer, entity: hit?.entity };
      objectContextMenu.context = context;
      objectContextMenu.show(event.pageX, event.pageY);
    });

    let lastEntity = null;
    let selectedEntity = null;

    viewer.scene.input.on("mousemove", function (coords) {
      const hit = viewer.scene.pick({
        canvasPos: coords,
      });

      if (hit && hit.entity) {
        if (!lastEntity || hit.entity.id !== lastEntity.id) {
          // Unhighlight entity trước đó (trừ khi nó đang được chọn)
          if (lastEntity && lastEntity !== selectedEntity) {
            lastEntity.highlighted = false;
          }

          lastEntity = hit.entity;

          // Chỉ highlight nếu không trùng entity đang được chọn
          if (hit.entity !== selectedEntity) {
            hit.entity.highlighted = true;
          }
        }
      } else {
        if (lastEntity && lastEntity !== selectedEntity) {
          lastEntity.highlighted = false;
        }
        lastEntity = null;
      }
    });

    sceneModel.on("loaded", () => {
      viewer.cameraFlight.flyTo({
        aabb: sceneModel.aabb,
        duration: 1,
        fit: true,
      });
      renderModelVisibilityUI(viewer);
      cleanTreeLabels("tree-types");
      cleanTreeLabels("tree-storeys");
    });

    return () => {
      viewer.destroy();
      treeTypes.destroy();
      treeStoreys.destroy();
    };
  }, []);

  const renderModelVisibilityUI = (viewer) => {
    const container = document.getElementById("tree-models");
    if (!container) return;

    container.innerHTML = "";
    Object.values(viewer.scene.models).forEach((model) => {
      const wrapper = document.createElement("div");
      wrapper.style.marginBottom = "6px";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = true;
      checkbox.onchange = () => (model.visible = checkbox.checked);

      const label = document.createElement("label");
      label.innerText = `${model.id} (${model.numEntities} objs)`;
      label.style.marginLeft = "8px";
      label.style.cursor = "pointer";
      wrapper.append(checkbox, label);
      container.appendChild(wrapper);
    });
  };

  const cleanTreeLabels = (treeId) => {
    const treeEl = document.getElementById(treeId);
    if (!treeEl) return;
    treeEl.querySelectorAll("span").forEach((label) => {
      label.textContent = label.textContent.replace(/^Ifc/, "");
    });
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(to bottom, #e3f2fd, #cfd8dc)",
      }}
    >
      <canvas
        id="myCanvas"
        ref={canvasRef}
        style={{ width: "100%", height: "100%" }}
      />
      <canvas
        id="myNavCubeCanvas"
        ref={navCubeRef}
        style={{
          position: "absolute",
          top: "2px",
          right: "2px",
          width: "150px",
          height: "150px",
          pointerEvents: "auto",
          cursor: "pointer",
        }}
      />

      <button
        onClick={() => {
          const viewer = viewerRef.current;
          if (!viewer) return;
          viewer.cameraFlight.flyTo({
            aabb: viewer.scene.getAABB(),
            duration: 1,
            fit: true,
          });
        }}
        style={{
          position: "absolute",
          top: "10px",
          left: "90px",
          backgroundColor: "#333",
          color: "#fff",
          border: "none",
          padding: "6px 10px",
          borderRadius: "6px",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          fontSize: "14px",
        }}
      >
        <LuHouse />
      </button>

      <ExplorerPanel />
      <PropertiesPanel />

      <style>{`
        #tree-models ul, #tree-models li,
        #tree-types ul, #tree-types li,
        #tree-storeys ul, #tree-storeys li {
          list-style: none;
          margin: 0;
          padding-left: 4px;
        }
        #tree-models span, #tree-types span, #tree-storeys span {
          color: #ddd;
          font-size: 13px;
        }

        .xeokit-context-menu {
          background: #1e1e1e !important;
          color: #f1f1f1 !important;
          font-size: 16px;
          border-radius: 2.5px !important;
          border: 1px solid rgba(215, 215, 215, 0.1) !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6) !important;
          width: 120px;
          overflow: hidden;
          backdrop-filter: blur(6px);
        }

        .xeokit-context-menu ul,
        .xeokit-context-menu li {
          list-style: none !important;
          margin: 0 !important;
          padding: 5px !important;
        }

        .xeokit-context-menu-item {
          cursor: pointer;
          display: flex;
          align-items: center;
          width: 105px;
          justify-content: space-between;
          transition: background 0.2s ease;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 2.5px !important;
        }

        .xeokit-context-menu-item:hover {
          background-color: #444 !important;
          border-radius: 2.5px !important;
          border: 1px solid rgba(215, 215, 215, 0.1) !important;
        }

      `}</style>
    </div>
  );
};

export default XeokitViewer;
