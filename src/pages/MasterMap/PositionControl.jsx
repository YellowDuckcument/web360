import { useEffect, useRef, useState } from "react";
import * as Cesium from "cesium";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRulerVertical,
  faCrosshairs,
} from "@fortawesome/free-solid-svg-icons";

const PositionControl = ({ tileset }) => {
  const [showSlider, setShowSlider] = useState(false);
  const [showXYZForm, setShowXYZForm] = useState(false);
  const [offsetHeight, setOffsetHeight] = useState(0);

  const baseHeightRef = useRef(null);
  const [xyz, setXyz] = useState({ x: 0, y: 0, z: 0 });

  // Lấy độ cao và tọa độ gốc khi load
  useEffect(() => {
    if (tileset && tileset.boundingSphere) {
      const carto = Cesium.Cartographic.fromCartesian(
        tileset.boundingSphere.center
      );
      baseHeightRef.current = carto.height;
      setOffsetHeight(0);

      const cartesian = tileset.boundingSphere.center;
      setXyz({
        x: cartesian.x.toFixed(2),
        y: cartesian.y.toFixed(2),
        z: cartesian.z.toFixed(2),
      });
    }
  }, [tileset]);

  // Hàm nâng/hạ theo slider
  const updateHeight = (offset) => {
    if (!tileset || baseHeightRef.current === null) return;

    const carto = Cesium.Cartographic.fromCartesian(
      tileset.boundingSphere.center
    );

    const surface = Cesium.Cartesian3.fromRadians(
      carto.longitude,
      carto.latitude,
      baseHeightRef.current
    );

    const newPosition = Cesium.Cartesian3.fromRadians(
      carto.longitude,
      carto.latitude,
      baseHeightRef.current + offset
    );

    const translation = Cesium.Cartesian3.subtract(
      newPosition,
      surface,
      new Cesium.Cartesian3()
    );

    tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
  };

  // Hàm di chuyển đến tọa độ mới từ form
  const updateXYZ = () => {
    if (!tileset) return;

    const newCartesian = new Cesium.Cartesian3(
      parseFloat(xyz.x),
      parseFloat(xyz.y),
      parseFloat(xyz.z)
    );

    const translation = Cesium.Cartesian3.subtract(
      newCartesian,
      tileset.boundingSphere.center,
      new Cesium.Cartesian3()
    );

    tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
  };

  const buttons = [
    {
      icon: faRulerVertical,
      tooltip: showSlider ? "Ẩn điều chỉnh độ cao" : "Hiện điều chỉnh độ cao",
      onClick: () => {
        setShowSlider(!showSlider);
        setShowXYZForm(false);
      },
      active: showSlider,
    },
    {
      icon: faCrosshairs,
      tooltip: showXYZForm ? "Ẩn nhập tọa độ" : "Hiện nhập tọa độ",
      onClick: () => {
        setShowXYZForm(!showXYZForm);
        setShowSlider(false);
      },
      active: showXYZForm,
    },
  ];

  return (
    <>
      {/* Nút điều khiển */}
      <div
        style={{
          position: "absolute",
          top: 380,
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
          width: 32,
        }}>
        {buttons.map((btn, idx) => (
          <button
            key={idx}
            onClick={btn.onClick}
            title={btn.tooltip}
            style={{
              backgroundColor: btn.active ? "#007BFF" : "transparent",
              color: btn.active ? "white" : "#333",
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
            }}>
            <FontAwesomeIcon icon={btn.icon} />
          </button>
        ))}
      </div>

      {/* Slider nâng/hạ */}
      {showSlider && (
        <div
          style={{
            position: "absolute",
            bottom: 80,
            left: "5%",
            width: "90vw",
            zIndex: 1000,
            background: "rgba(255, 255, 255, 0.85)",
            padding: "5px 10px",
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
            backdropFilter: "blur(6px)",
          }}>
          <div
            style={{
              fontSize: 14,
              marginBottom: 4,
              textAlign: "center",
              fontWeight: "bold",
              color: "darkgray",
            }}>
            Nâng/Hạ mô hình:{" "}
            {(baseHeightRef.current ?? 0 + offsetHeight).toFixed(2)} m
          </div>
          <input
            type="range"
            min={-200}
            max={200}
            value={offsetHeight}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setOffsetHeight(val);
              updateHeight(val);
            }}
            style={{ width: "100%", cursor: "pointer" }}
          />
        </div>
      )}

      {/* Form nhập tọa độ */}
      {showXYZForm && (
        <div
          style={{
            position: "absolute",
            bottom: 80,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            background: "rgba(255, 255, 255, 0.95)",
            padding: "10px 15px",
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
            backdropFilter: "blur(6px)",
          }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {["x", "y", "z"].map((coord) => (
              <div key={coord}>
                <label style={{ fontSize: 12, fontWeight: "bold" }}>
                  {coord.toUpperCase()}:
                </label>
                <input
                  type="number"
                  value={xyz[coord]}
                  onChange={(e) => setXyz({ ...xyz, [coord]: e.target.value })}
                  style={{
                    width: "100%",
                    padding: 4,
                    border: "1px solid #ccc",
                    borderRadius: 4,
                  }}
                />
              </div>
            ))}
            <button
              onClick={updateXYZ}
              style={{
                marginTop: 8,
                backgroundColor: "#007BFF",
                color: "white",
                padding: "6px 12px",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}>
              Cập nhật vị trí
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PositionControl;
