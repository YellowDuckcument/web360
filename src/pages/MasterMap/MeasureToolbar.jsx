import { useEffect, useRef, useState } from "react";
import * as Cesium from "cesium";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRuler,
  faDrawPolygon,
  faLevelUpAlt,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

export default function MeasureToolbar({ viewer }) {
  const handlerRef = useRef(null);
  const entitiesRef = useRef([]);
  const [mode, setMode] = useState(null);
  const [hoveredTooltip, setHoveredTooltip] = useState(null);
  viewer.scene.requestRenderMode = false;

  useEffect(() => {
    if (!viewer) return;
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
    handlerRef.current = handler;
    return () => handler.destroy();
  }, [viewer]);

  const clearDrawings = () => {
    // Xóa toàn bộ entity đã lưu
    entitiesRef.current.forEach((e) => {
      try {
        viewer.entities.remove(e);
      } catch (err) {
        // Có thể log nếu cần
        console.warn("Lỗi khi xóa entityRef:", err);
      }
    });
    entitiesRef.current = [];

    // Xóa tất cả entity hiện tại trong viewer.entities mà không lọc
    const allEntities = viewer.entities.values.slice();
    allEntities.forEach((entity) => {
      try {
        viewer.entities.remove(entity);
      } catch (err) {
        // Có thể log nếu cần
        console.warn("Lỗi khi xóa entityRef:", err);
      }
    });

    // Xóa tất cả input actions
    if (handlerRef.current) {
      handlerRef.current.removeInputAction(
        Cesium.ScreenSpaceEventType.LEFT_CLICK
      );
      handlerRef.current.removeInputAction(
        Cesium.ScreenSpaceEventType.MOUSE_MOVE
      );
      handlerRef.current.removeInputAction(
        Cesium.ScreenSpaceEventType.RIGHT_CLICK
      );
    }

    // Gỡ tất cả event listener (ví dụ ESC)
    document.onkeydown = null;

    // Cho phép xoay lại camera
    viewer.scene.screenSpaceCameraController.enableRotate = true;

    // Reset mode
    setMode(null);

    // Render lại
    viewer.scene.requestRender();
  };

  const toggleMode = (newMode, actionFn) => {
    // Nếu đang ở cùng chế độ -> thoát chế độ đo
    if (mode === newMode) {
      // Xoay lại camera
      viewer.scene.screenSpaceCameraController.enableRotate = true;

      // Xóa input actions của chế độ hiện tại
      if (handlerRef.current) {
        handlerRef.current.removeInputAction(
          Cesium.ScreenSpaceEventType.LEFT_CLICK
        );
        handlerRef.current.removeInputAction(
          Cesium.ScreenSpaceEventType.MOUSE_MOVE
        );
        handlerRef.current.removeInputAction(
          Cesium.ScreenSpaceEventType.RIGHT_CLICK
        );
      }

      // Đặt lại chế độ
      setMode(null);
      return;
    }

    // Nếu đang ở chế độ khác → thoát chế độ cũ trước
    if (handlerRef.current) {
      handlerRef.current.removeInputAction(
        Cesium.ScreenSpaceEventType.LEFT_CLICK
      );
      handlerRef.current.removeInputAction(
        Cesium.ScreenSpaceEventType.MOUSE_MOVE
      );
      handlerRef.current.removeInputAction(
        Cesium.ScreenSpaceEventType.RIGHT_CLICK
      );
    }

    // Bật chế độ mới
    setMode(newMode);
    viewer.scene.screenSpaceCameraController.enableRotate = false;
    actionFn();
  };

  const startDistance = () => {
    const points = [];
    const temp = [];
    let previewLineEntity = null;
    let previewLabelEntity = null;

    const handler = handlerRef.current;

    // Dùng biến lưu B để liên tục cập nhật vị trí chuột
    let currentMousePosition = null;

    // Mouse move: cập nhật vị trí chuột hiện tại
    handler.setInputAction((e) => {
      if (points.length !== 1) return;

      const B = viewer.scene.pickPosition(e.endPosition);
      if (!B) return;

      currentMousePosition = B;
      viewer.scene.requestRender(); // bắt buộc render lại để cập nhật CallbackProperty
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // Left click: chọn điểm
    handler.setInputAction((e) => {
      const pos = viewer.scene.pickPosition(e.position);
      if (!pos) return;

      viewer.scene.requestRender();

      points.push(pos);

      temp.push(
        viewer.entities.add({
          position: pos,
          point: { pixelSize: 10, color: Cesium.Color.YELLOW },
          label: {
            text: points.length === 1 ? "A" : "B",
            font: "16px sans-serif",
            fillColor: Cesium.Color.WHITE,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 2,
            pixelOffset: new Cesium.Cartesian2(10, -20),
          },
        })
      );

      // Nếu mới click điểm A, khởi tạo previewLine & previewLabel
      if (points.length === 1) {
        previewLineEntity = viewer.entities.add({
          polyline: {
            positions: new Cesium.CallbackProperty(() => {
              if (!currentMousePosition) return [pos, pos];
              return [pos, currentMousePosition];
            }, false),
            width: 2,
            material: Cesium.Color.YELLOW.withAlpha(0.8),
            clampToGround: false,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        });

        previewLabelEntity = viewer.entities.add({
          position: new Cesium.CallbackProperty(() => {
            if (!currentMousePosition) return pos;
            return Cesium.Cartesian3.midpoint(
              pos,
              currentMousePosition,
              new Cesium.Cartesian3()
            );
          }, false),
          label: {
            text: new Cesium.CallbackProperty(() => {
              if (!currentMousePosition) return "";
              const distance = Cesium.Cartesian3.distance(
                pos,
                currentMousePosition
              );
              return `${distance.toFixed(2)} m`;
            }, false),
            font: "18px sans-serif",
            fillColor: Cesium.Color.YELLOW,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 2,
            outlineColor: Cesium.Color.BLACK,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -20),
            heightReference: Cesium.HeightReference.NONE,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        });
      }

      // Sau khi chọn điểm B -> hoàn tất đo
      if (points.length === 2) {
        const [A, B] = points;

        if (previewLineEntity) viewer.entities.remove(previewLineEntity);
        if (previewLabelEntity) viewer.entities.remove(previewLabelEntity);

        const A_carto = Cesium.Cartographic.fromCartesian(A);
        const B_carto = Cesium.Cartographic.fromCartesian(B);

        const C = Cesium.Cartesian3.fromRadians(
          A_carto.longitude,
          A_carto.latitude,
          0
        );
        const D = Cesium.Cartesian3.fromRadians(
          B_carto.longitude,
          B_carto.latitude,
          0
        );

        const dashedMaterial = new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.RED,
          dashLength: 16,
        });

        temp.push(
          viewer.entities.add({
            polyline: {
              positions: [A, B],
              width: 2,
              material: Cesium.Color.WHITE,
              clampToGround: false,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
          }),
          viewer.entities.add({
            polyline: {
              positions: [C, D],
              width: 2,
              material: dashedMaterial,
              clampToGround: false,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
          }),
          viewer.entities.add({
            polyline: {
              positions: [C, A],
              width: 2,
              material: dashedMaterial,
              clampToGround: false,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
          }),
          viewer.entities.add({
            polyline: {
              positions: [D, B],
              width: 2,
              material: dashedMaterial,
              clampToGround: false,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
          })
        );

        const dist = Cesium.Cartesian3.distance(A, B);
        const midpoint = Cesium.Cartesian3.midpoint(
          A,
          B,
          new Cesium.Cartesian3()
        );

        temp.push(
          viewer.entities.add({
            position: midpoint,
            label: {
              text: `${dist.toFixed(2)} m`,
              font: "20px sans-serif",
              fillColor: Cesium.Color.YELLOW,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              outlineWidth: 2,
              outlineColor: Cesium.Color.BLACK,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -20),
              heightReference: Cesium.HeightReference.NONE,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
          })
        );

        entitiesRef.current.push(...temp);

        // Cleanup
        handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
        handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        viewer.scene.screenSpaceCameraController.enableRotate = true;
        setMode(null);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  };

  const startArea = () => {
    const pts = [];
    const temp = [];

    let polygonEntity = null;
    let areaLabelEntity = null;

    handlerRef.current.setInputAction((e) => {
      const pos = viewer.scene.pickPosition(e.position);
      viewer.scene.requestRender();
      if (!pos) return;

      pts.push(pos);

      // Vẽ điểm
      temp.push(
        viewer.entities.add({
          position: pos,
          point: { pixelSize: 8, color: Cesium.Color.CYAN },
        })
      );

      const len = pts.length;

      if (len >= 2) {
        const a = pts[len - 2];
        const b = pts[len - 1];
        const mid = Cesium.Cartesian3.midpoint(a, b, new Cesium.Cartesian3());
        const distance = Cesium.Cartesian3.distance(a, b);

        // Vẽ đoạn thẳng
        temp.push(
          viewer.entities.add({
            polyline: {
              positions: [a, b],
              width: 2,
              material: Cesium.Color.RED,
              clampToGround: false,
            },
          })
        );

        // Ghi nhãn độ dài
        temp.push(
          viewer.entities.add({
            position: mid,
            label: {
              text: `${distance.toFixed(1)} m`,
              font: "18px sans-serif",
              fillColor: Cesium.Color.YELLOW,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              outlineWidth: 2,
              outlineColor: Cesium.Color.BLACK,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -20),
              heightReference: Cesium.HeightReference.NONE,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
          })
        );
      }

      // Cập nhật polygon nếu đủ 3 điểm
      if (len >= 3) {
        if (polygonEntity) {
          viewer.entities.remove(polygonEntity);
        }

        polygonEntity = viewer.entities.add({
          polygon: {
            hierarchy: new Cesium.PolygonHierarchy(pts),
            material: Cesium.Color.CYAN.withAlpha(0.4),
            heightReference: Cesium.HeightReference.NONE,
          },
        });
        temp.push(polygonEntity);

        // Tính diện tích
        const cartos = pts.map((p) =>
          Cesium.Ellipsoid.WGS84.cartesianToCartographic(p)
        );

        let area = 0;
        for (let i = 0; i < cartos.length; i++) {
          const c1 = cartos[i];
          const c2 = cartos[(i + 1) % cartos.length];
          area +=
            (c2.longitude - c1.longitude) *
            (2 + Math.sin(c1.latitude) + Math.sin(c2.latitude));
        }
        area = (Math.abs(area) * Cesium.Ellipsoid.WGS84.maximumRadius ** 2) / 2;

        // Tính tâm polygon
        const center = pts.reduce(
          (acc, cur) => Cesium.Cartesian3.add(acc, cur, acc),
          new Cesium.Cartesian3()
        );
        Cesium.Cartesian3.divideByScalar(center, pts.length, center);

        // Xóa label cũ
        if (areaLabelEntity) {
          viewer.entities.remove(areaLabelEntity);
        }

        areaLabelEntity = viewer.entities.add({
          position: center,
          label: {
            text: `Area: ${area.toFixed(2)} m²`,
            font: "20px sans-serif",
            fillColor: Cesium.Color.YELLOW,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 2,
            outlineColor: Cesium.Color.BLACK,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -20),
            heightReference: Cesium.HeightReference.NONE,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        });

        temp.push(areaLabelEntity);
      }

      entitiesRef.current = temp;
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  };

  const startHeight = () => {
    const pts = [];
    const temp = [];

    let previewLineEntity = null;
    let previewLabelEntity = null;

    const handler = handlerRef.current;

    viewer.scene.screenSpaceCameraController.enableRotate = false;

    handler.setInputAction((e) => {
      const pos = viewer.scene.pickPosition(e.position);
      if (!pos) return;
      pts.push(pos);

      // Vẽ điểm nhấn
      temp.push(
        viewer.entities.add({
          position: pos,
          point: {
            pixelSize: 10,
            color: Cesium.Color.MAGENTA,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        })
      );

      if (pts.length === 2) {
        const [p1, p2] = pts;

        const carto1 = Cesium.Ellipsoid.WGS84.cartesianToCartographic(p1);
        const carto2 = Cesium.Ellipsoid.WGS84.cartesianToCartographic(p2);

        const h1 = carto1.height;
        const h2 = carto2.height;

        const A = h1 < h2 ? p1 : p2;
        const B = h1 < h2 ? p2 : p1;

        const cartoA = Cesium.Ellipsoid.WGS84.cartesianToCartographic(A);
        const cartoB = Cesium.Ellipsoid.WGS84.cartesianToCartographic(B);

        const C_carto = new Cesium.Cartographic(
          cartoB.longitude,
          cartoB.latitude,
          cartoA.height
        );
        const C = Cesium.Ellipsoid.WGS84.cartographicToCartesian(C_carto);

        const CA = [C, A];
        const CB = [C, B];
        const AB = [A, B];

        const dashedMaterial = new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.BLUE,
          dashLength: 8,
        });

        temp.push(
          viewer.entities.add({
            polyline: { positions: CA, width: 2, material: dashedMaterial },
          })
        );

        temp.push(
          viewer.entities.add({
            polyline: { positions: CB, width: 2, material: Cesium.Color.BLUE },
          })
        );

        temp.push(
          viewer.entities.add({
            polyline: { positions: AB, width: 1, material: Cesium.Color.BLUE },
          })
        );

        const midCB = Cesium.Cartesian3.midpoint(C, B, new Cesium.Cartesian3());
        const deltaH = Math.abs(cartoB.height - cartoA.height);

        temp.push(
          viewer.entities.add({
            position: midCB,
            label: {
              text: `ΔH: ${deltaH.toFixed(2)} m`,
              font: "20px sans-serif",
              fillColor: Cesium.Color.YELLOW,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              outlineWidth: 2,
              outlineColor: Cesium.Color.BLACK,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -20),
              heightReference: Cesium.HeightReference.NONE,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
          })
        );

        const symbolSize = 1.0;
        const rightAngleSymbol = (() => {
          const v1 = Cesium.Cartesian3.subtract(A, C, new Cesium.Cartesian3());
          const v2 = Cesium.Cartesian3.subtract(B, C, new Cesium.Cartesian3());

          Cesium.Cartesian3.normalize(v1, v1);
          Cesium.Cartesian3.normalize(v2, v2);

          const p1 = Cesium.Cartesian3.add(
            C,
            Cesium.Cartesian3.multiplyByScalar(
              v1,
              symbolSize,
              new Cesium.Cartesian3()
            ),
            new Cesium.Cartesian3()
          );
          const p2 = Cesium.Cartesian3.add(
            C,
            Cesium.Cartesian3.multiplyByScalar(
              v2,
              symbolSize,
              new Cesium.Cartesian3()
            ),
            new Cesium.Cartesian3()
          );
          const corner = Cesium.Cartesian3.add(
            p1,
            Cesium.Cartesian3.subtract(p2, C, new Cesium.Cartesian3()),
            new Cesium.Cartesian3()
          );

          return [p1, corner, p2];
        })();

        temp.push(
          viewer.entities.add({
            polyline: {
              positions: rightAngleSymbol,
              width: 2,
              material: Cesium.Color.MAGENTA,
            },
          })
        );

        // Cleanup
        entitiesRef.current.push(...temp);
        handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
        handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        document.removeEventListener("keydown", escListener);
        if (previewLineEntity) viewer.entities.remove(previewLineEntity);
        if (previewLabelEntity) viewer.entities.remove(previewLabelEntity);
        viewer.scene.screenSpaceCameraController.enableRotate = true;
        setMode(null);
        viewer.scene.requestRender();
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // === Preview Đường CA và ΔH khi rê chuột ===
    handler.setInputAction((movement) => {
      if (pts.length !== 1) return;

      const current = viewer.scene.pickPosition(movement.endPosition);
      if (!current) return;

      const A = pts[0];
      const cartoA = Cesium.Ellipsoid.WGS84.cartesianToCartographic(A);
      const cartoCursor =
        Cesium.Ellipsoid.WGS84.cartesianToCartographic(current);

      const C_carto = new Cesium.Cartographic(
        cartoCursor.longitude,
        cartoCursor.latitude,
        cartoA.height
      );
      const C = Cesium.Ellipsoid.WGS84.cartographicToCartesian(C_carto);

      const dashedMaterial = new Cesium.PolylineDashMaterialProperty({
        color: Cesium.Color.YELLOW,
        dashLength: 8,
      });

      // Update hoặc tạo preview line
      if (previewLineEntity) {
        previewLineEntity.polyline.positions = new Cesium.CallbackProperty(
          () => [C, A],
          false
        );
      } else {
        previewLineEntity = viewer.entities.add({
          polyline: {
            positions: [C, A],
            width: 2,
            material: dashedMaterial,
          },
        });
      }

      const mid = Cesium.Cartesian3.midpoint(
        C,
        current,
        new Cesium.Cartesian3()
      );
      const deltaH = Math.abs(cartoCursor.height - cartoA.height);

      if (previewLabelEntity) {
        previewLabelEntity.position = mid;
        previewLabelEntity.label.text = new Cesium.CallbackProperty(
          () => `ΔH: ${deltaH.toFixed(2)} m`,
          false
        );
      } else {
        previewLabelEntity = viewer.entities.add({
          position: mid,
          label: {
            text: `ΔH: ${deltaH.toFixed(2)} m`,
            font: "20px sans-serif",
            fillColor: Cesium.Color.YELLOW,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 2,
            outlineColor: Cesium.Color.BLACK,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -20),
            heightReference: Cesium.HeightReference.NONE,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        });
      }

      viewer.scene.requestRender();
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // === ESC để hủy ===
    const escListener = (e) => {
      if (e.key === "Escape") {
        handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
        handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        document.removeEventListener("keydown", escListener);
        if (previewLineEntity) viewer.entities.remove(previewLineEntity);
        if (previewLabelEntity) viewer.entities.remove(previewLabelEntity);
        temp.forEach((ent) => viewer.entities.remove(ent));
        viewer.scene.screenSpaceCameraController.enableRotate = true;
        setMode(null);
      }
    };
    document.addEventListener("keydown", escListener);
  };

  const buttons = [
    {
      icon: faRuler,
      mode: "distance",
      action: () => toggleMode("distance", startDistance),
      tooltip: "Đo khoảng cách",
    },
    {
      icon: faDrawPolygon,
      mode: "area",
      action: () => toggleMode("area", startArea),
      tooltip: "Đo diện tích",
    },
    {
      icon: faLevelUpAlt,
      mode: "height",
      action: () => toggleMode("height", startHeight),
      tooltip: "Đo độ cao",
    },
    {
      icon: faTrash,
      mode: null,
      action: clearDrawings,
      tooltip: "Xóa đo đạc",
      color: "red",
    },
  ];

  return (
    <div
      style={{
        position: "absolute",
        top: 132,
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
      }}
    >
      {buttons.map((btn, idx) => {
        const isDelete = btn.icon === faTrash;
        const isActive = isDelete ? mode === null : mode === btn.mode;

        return (
          <div
            key={idx}
            style={{ position: "relative" }}
            onMouseEnter={() => setHoveredTooltip(idx)}
            onMouseLeave={() => setHoveredTooltip(null)}
          >
            <button
              onClick={btn.action}
              style={{
                backgroundColor: isActive
                  ? isDelete
                    ? "#ff4d4f" // đỏ active cho nút xóa
                    : "#007BFF" // xanh dương active cho các nút còn lại
                  : isDelete
                  ? "rgba(255,0,0,0.1)"
                  : "transparent",
                color: isDelete
                  ? isActive
                    ? "white"
                    : "#d00"
                  : isActive
                  ? "white"
                  : "#333",
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
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = isDelete
                    ? "rgba(255,0,0,0.2)"
                    : "#f0f0f0";
                }
              }}
              onMouseOut={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = isDelete
                    ? "rgba(255,0,0,0.1)"
                    : "transparent";
                }
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
  );
}
