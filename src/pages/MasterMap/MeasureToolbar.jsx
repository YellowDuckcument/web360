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
  viewer.scene.requestRenderMode = false;

  useEffect(() => {
    if (!viewer) return;
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
    handlerRef.current = handler;
    return () => handler.destroy();
  }, [viewer]);

  const clearDrawings = () => {
    entitiesRef.current.forEach((e) => viewer.entities.remove(e));
    entitiesRef.current = [];
    setMode(null);
    if (handlerRef.current) {
      handlerRef.current.removeInputAction(
        Cesium.ScreenSpaceEventType.LEFT_CLICK
      );
    }

    viewer.scene.requestRender();
    viewer.scene.screenSpaceCameraController.enableRotate = true;
  };

  const toggleMode = (newMode, actionFn) => {
    if (mode === newMode) {
      clearDrawings();
      return;
    }
    clearDrawings();
    setMode(newMode);
    viewer.scene.screenSpaceCameraController.enableRotate = false;
    actionFn();
  };

  const startDistance = () => {
    const points = [];
    const temp = [];
    handlerRef.current.setInputAction((e) => {
      const pos = viewer.scene.pickPosition(e.position);
      viewer.scene.requestRender();
      if (!pos) return;
      points.push(pos);
      temp.push(
        viewer.entities.add({
          position: pos,
          point: { pixelSize: 10, color: Cesium.Color.YELLOW },
        })
      );
      if (points.length === 2) {
        temp.push(
          viewer.entities.add({
            polyline: {
              positions: points,
              width: 3,
              material: Cesium.Color.RED,
            },
          })
        );
        const dist = Cesium.Cartesian3.distance(points[0], points[1]);
        const midpoint = Cesium.Cartesian3.midpoint(
          points[0],
          points[1],
          new Cesium.Cartesian3()
        );
        temp.push(
          viewer.entities.add({
            position: midpoint,
            label: {
              text: `${(dist / 1000).toFixed(2)} km`,
              font: "20px sans-serif",
              fillColor: Cesium.Color.YELLOW,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              outlineWidth: 2,
              outlineColor: Cesium.Color.BLACK,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -20),
              heightReference: Cesium.HeightReference.NONE, // hoặc RELATIVE_TO_GROUND nếu cần dính mặt đất
              disableDepthTestDistance: Number.POSITIVE_INFINITY, // 🔥 Cực kỳ quan trọng để không bị che
            },
          })
        );
        entitiesRef.current = temp;
        handlerRef.current.removeInputAction(
          Cesium.ScreenSpaceEventType.LEFT_CLICK
        );
        viewer.scene.screenSpaceCameraController.enableRotate = true;
        setMode(null);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  };

  const startArea = () => {
    const pts = [];
    const temp = [];

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
        if (temp.poly) viewer.entities.remove(temp.poly);
        const poly = viewer.entities.add({
          polygon: {
            hierarchy: new Cesium.PolygonHierarchy(pts),
            material: Cesium.Color.CYAN.withAlpha(0.4),
          },
        });

        temp.push(poly);

        // Vẽ đoạn thẳng
        temp.push(
          viewer.entities.add({
            polyline: {
              positions: [a, b],
              width: 2,
              material: Cesium.Color.RED,
            },
          })
        );

        // Ghi nhãn độ dài đoạn thẳng
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

      // Tính diện tích (khép tạm để tính)
      if (len >= 3) {
        const cartos = pts.map((p) =>
          Cesium.Ellipsoid.WGS84.cartesianToCartographic(p)
        );

        cartos.push(cartos[0]); // khép kín tạm thời

        let area = 0;
        for (let i = 0; i < cartos.length - 1; i++) {
          const c1 = cartos[i],
            c2 = cartos[i + 1];
          area +=
            (c2.longitude - c1.longitude) *
            (2 + Math.sin(c1.latitude) + Math.sin(c2.latitude));
        }
        area = (Math.abs(area) * Cesium.Ellipsoid.WGS84.maximumRadius ** 2) / 2;

        // Tính center (tâm)
        const center = pts.reduce(
          (acc, cur) => Cesium.Cartesian3.add(acc, cur, acc),
          new Cesium.Cartesian3()
        );
        Cesium.Cartesian3.divideByScalar(center, pts.length, center);

        // Xóa nhãn diện tích cũ (nếu có)
        temp.forEach((ent) => {
          if (ent.properties?.type?.getValue() === "areaLabel") {
            viewer.entities.remove(ent);
          }
        });

        // Thêm nhãn diện tích mới
        temp.push(
          viewer.entities.add({
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
            properties: {
              type: "areaLabel", // ✅ để xóa sau này
            },
          })
        );
      }

      entitiesRef.current = temp;
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  };

  const startHeight = () => {
    const pts = [];
    const temp = [];
    handlerRef.current.setInputAction((e) => {
      const pos = viewer.scene.pickPosition(e.position);
      viewer.scene.requestRender();
      if (!pos) return;
      pts.push(pos);

      viewer.scene.requestRender();
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
        const h1 = Cesium.Ellipsoid.WGS84.cartesianToCartographic(
          pts[0]
        ).height;
        const h2 = Cesium.Ellipsoid.WGS84.cartesianToCartographic(
          pts[1]
        ).height;
        const dh = Math.abs(h1 - h2);
        temp.push(
          viewer.entities.add({
            polyline: {
              positions: pts,
              width: 2,
              material: Cesium.Color.MAGENTA,
            },
          })
        );

        viewer.scene.requestRender();
        const mid = Cesium.Cartesian3.midpoint(
          pts[0],
          pts[1],
          new Cesium.Cartesian3()
        );

        viewer.scene.requestRender();
        temp.push(
          viewer.entities.add({
            position: mid,
            label: {
              text: `ΔH: ${dh.toFixed(2)} m`,
              font: "20px sans-serif",
              fillColor: Cesium.Color.YELLOW,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              outlineWidth: 2,
              outlineColor: Cesium.Color.BLACK,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -20),
              heightReference: Cesium.HeightReference.NONE, // hoặc RELATIVE_TO_GROUND nếu cần dính mặt đất
              disableDepthTestDistance: Number.POSITIVE_INFINITY, // 🔥 Cực kỳ quan trọng để không bị che
            },
          })
        );
        viewer.scene.requestRender();
        entitiesRef.current = temp;
        handlerRef.current.removeInputAction(
          Cesium.ScreenSpaceEventType.LEFT_CLICK
        );
        viewer.scene.screenSpaceCameraController.enableRotate = true;
        setMode(null);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 10,
        left: 10,
        zIndex: 1000,
        background: "rgba(255,255,255,0.9)",
        padding: 10,
        borderRadius: 6,
      }}>
      <button
        onClick={() => toggleMode("distance", startDistance)}
        style={{ backgroundColor: mode === "distance" ? "#ddd" : "" }}>
        <FontAwesomeIcon icon={faRuler} /> Khoảng cách
      </button>
      <button
        onClick={() => toggleMode("area", startArea)}
        style={{
          marginLeft: 6,
          backgroundColor: mode === "area" ? "#ddd" : "",
        }}>
        <FontAwesomeIcon icon={faDrawPolygon} /> Diện tích
      </button>
      <button
        onClick={() => toggleMode("height", startHeight)}
        style={{
          marginLeft: 6,
          backgroundColor: mode === "height" ? "#ddd" : "",
        }}>
        <FontAwesomeIcon icon={faLevelUpAlt} /> Độ cao
      </button>
      <button onClick={clearDrawings} style={{ marginLeft: 6, color: "red" }}>
        <FontAwesomeIcon icon={faTrash} /> Xóa đo đạc
      </button>
    </div>
  );
}
