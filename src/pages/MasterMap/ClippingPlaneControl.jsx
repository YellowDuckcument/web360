import { useEffect, useRef, useState } from "react";
import * as Cesium from "cesium";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsAltV,
  faArrowsAltH,
  faArrowsAlt,
} from "@fortawesome/free-solid-svg-icons";

const ClippingPlaneControl = ({ viewer, tileset }) => {
  const [activeAxis, setActiveAxis] = useState(null); // "Z", "X", "Y", or null
  const [hoveredTooltip, setHoveredTooltip] = useState(null);
  const [distanceState, setDistanceState] = useState(0);

  const clippingPlanesRef = useRef(null);
  const planeEntityRef = useRef(null);
  const handlerRef = useRef(null);
  const selectedPlane = useRef(null);
  const targetDistance = useRef(0);
  const currentNormal = useRef(new Cesium.Cartesian3(0, 0, -1));
  const maxOffset = useRef(200); // limit for dragging and slider

  const createClippingPlane = () => {
    if (!viewer || !tileset) return;

    const scene = viewer.scene;
    const boundingSphere = tileset.boundingSphere;
    const radius = boundingSphere.radius;
    // maxOffset.current = radius * 2;

    const clippingPlane = new Cesium.ClippingPlane(currentNormal.current, 0);
    const clippingPlanes = new Cesium.ClippingPlaneCollection({
      planes: [clippingPlane],
      edgeWidth: 1.0,
      unionClippingRegions: true,
    });

    clippingPlanesRef.current = clippingPlanes;
    tileset.clippingPlanes = clippingPlanes;

    const planeEntity = viewer.entities.add({
      position: boundingSphere.center,
      plane: {
        dimensions: new Cesium.Cartesian2(radius * 1.5, radius * 1.5),
        material: Cesium.Color.WHITE.withAlpha(0.1),
        outline: true,
        outlineColor: Cesium.Color.WHITE,
        plane: new Cesium.CallbackProperty(() => {
          const plane = clippingPlanesRef.current?.get(0);
          if (plane) {
            plane.distance = targetDistance.current;
            return plane;
          }
          return new Cesium.ClippingPlane(currentNormal.current, 0);
        }, false),
      },
    });

    planeEntityRef.current = planeEntity;

    const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    handler.setInputAction((movement) => {
      const picked = scene.pick(movement.position);
      if (Cesium.defined(picked?.id?.plane)) {
        selectedPlane.current = picked.id.plane;
        selectedPlane.current.material = Cesium.Color.WHITE.withAlpha(0.05);
        scene.screenSpaceCameraController.enableInputs = false;
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    handler.setInputAction(() => {
      if (selectedPlane.current) {
        selectedPlane.current.material = Cesium.Color.WHITE.withAlpha(0.1);
        selectedPlane.current = null;
      }
      scene.screenSpaceCameraController.enableInputs = true;
    }, Cesium.ScreenSpaceEventType.LEFT_UP);

    handler.setInputAction((movement) => {
      if (selectedPlane.current) {
        const deltaY = movement.startPosition.y - movement.endPosition.y;
        targetDistance.current = Math.max(
          -maxOffset.current,
          Math.min(maxOffset.current, targetDistance.current + deltaY)
        );
        setDistanceState(targetDistance.current);
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    handlerRef.current = handler;
  };

  const removeClippingPlane = () => {
    try {
      if (tileset.clippingPlanes) {
        tileset.clippingPlanes.removeAll();
        tileset.clippingPlanes.enabled = false;
        tileset.clippingPlanes = undefined;
      }

      if (planeEntityRef.current) {
        viewer.entities.remove(planeEntityRef.current);
        planeEntityRef.current = null;
      }

      if (handlerRef.current) {
        handlerRef.current.destroy();
        handlerRef.current = null;
      }

      selectedPlane.current = null;
      clippingPlanesRef.current = null;
      targetDistance.current = 0;
      setDistanceState(0);
    } catch (err) {
      console.error("Error cleaning up clipping plane:", err);
    }
  };

  const toggleClippingPlane = (axis) => {
    const normal =
      axis === "Z"
        ? new Cesium.Cartesian3(0, 0, -1)
        : axis === "X"
        ? new Cesium.Cartesian3(-1, 0, 0)
        : axis === "Y"
        ? new Cesium.Cartesian3(0, -1, 0)
        : null;

    if (activeAxis === axis) {
      setActiveAxis(null);
    } else {
      setActiveAxis(axis);
      currentNormal.current = normal;
    }
  };

  useEffect(() => {
    removeClippingPlane();
    if (activeAxis) {
      createClippingPlane();
    }
    return () => removeClippingPlane();
  }, [activeAxis]);

  const buttons = [
    {
      axis: "Z",
      icon: faArrowsAltV,
      tooltip: activeAxis === "Z" ? "Tắt Z Plane" : "Bật Z Plane",
    },
    {
      axis: "X",
      icon: faArrowsAltH,
      tooltip: activeAxis === "X" ? "Tắt X Plane" : "Bật X Plane",
    },
    {
      axis: "Y",
      icon: faArrowsAlt,
      tooltip: activeAxis === "Y" ? "Tắt Y Plane" : "Bật Y Plane",
    },
  ];

  return (
    <>
      {/* NÚT CHỌN TRỤC */}
      <div
        style={{
          position: "absolute",
          top: 290,
          right: 8,
          zIndex: 1000,
          background: "rgba(255, 255, 255, 0.8)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          padding: 5,
          borderRadius: 5,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          alignItems: "center",
          backdropFilter: "blur(6px)",
          width: 32, // giữ độ rộng gọn gàng như cũ
        }}
      >
        {buttons.map((btn, idx) => {
          const isActive = activeAxis === btn.axis;
          return (
            <div
              key={btn.axis}
              style={{ position: "relative" }}
              onMouseEnter={() => setHoveredTooltip(idx)}
              onMouseLeave={() => setHoveredTooltip(null)}
            >
              <button
                onClick={() => toggleClippingPlane(btn.axis)}
                style={{
                  backgroundColor: isActive ? "#007BFF" : "transparent",
                  color: isActive ? "white" : "#333",
                  border: "1px solid rgba(0,0,0,0.1)",
                  cursor: "pointer",
                  padding: 10,
                  borderRadius: 5,
                  transition: "background 0.2s, color 0.2s",
                  fontSize: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 30,
                  height: 30,
                }}
                onMouseOver={(e) => {
                  if (!isActive)
                    e.currentTarget.style.backgroundColor = "#f0f0f0";
                }}
                onMouseOut={(e) => {
                  if (!isActive)
                    e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <FontAwesomeIcon icon={btn.icon} />
              </button>

              {hoveredTooltip === idx && (
                <div
                  style={{
                    position: "absolute",
                    right: "110%",
                    top: "50%",
                    transform: "translateY(-50%)",
                    backgroundColor: "black",
                    color: "white",
                    padding: "5px 10px",
                    borderRadius: 6,
                    fontSize: 12,
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    zIndex: 1001,
                    opacity: 0.95,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                  }}
                >
                  {btn.tooltip}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* THANH SLIDER RIÊNG BIỆT */}
      {activeAxis && (
        <div
          style={{
            position: "absolute",
            bottom: 80, // cách đáy 20px
            left: "5%", // cách lề trái 10%
            width: "90vw", // chiếm 80% chiều rộng
            zIndex: 1000,
            background: "rgba(255, 255, 255, 0.85)",
            padding: "5px 10px",
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
            backdropFilter: "blur(6px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              fontSize: 14,
              marginBottom: 4,
              textAlign: "center",
              fontWeight: "bold",
              color: "darkgray",
            }}
          >
            Độ sâu mặt cắt: {distanceState.toFixed(1)}
          </div>
          <input
            type="range"
            min={-maxOffset.current}
            max={maxOffset.current}
            value={distanceState}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              targetDistance.current = val;
              setDistanceState(val);
            }}
            style={{
              width: "100%",
              cursor: "pointer",
            }}
          />
        </div>
      )}
    </>
  );
};

export default ClippingPlaneControl;
