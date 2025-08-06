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
      return;
    }
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

      // Gán điểm A hoặc B
      points.push(pos);
      temp.push(
        viewer.entities.add({
          position: pos,
          point: { pixelSize: 10, color: Cesium.Color.YELLOW },
          label: {
            text: points.length === 1 ? "A" : "B",
            font: "16px sans-serif",
            fillColor: Cesium.Color.BLACK,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 2,
            outlineColor: Cesium.Color.WHITE,
            pixelOffset: new Cesium.Cartesian2(10, -20),
          },
        })
      );

      if (points.length === 2) {
        const [A, B] = points;

        // Tạo điểm C và D với Y = 0 (trên mặt đất)
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
        viewer.scene.globe.depthTestAgainstTerrain = false;

        temp.push(
          viewer.entities.add({
            polyline: {
              positions: [A, B],
              width: 2,
              material: Cesium.Color.WHITE,
              // Cho phép hiển thị xuyên qua vật thể
              clampToGround: false,
              disableDepthTestDistance: Number.POSITIVE_INFINITY, // Hiển thị ưu tiên
            },
          })
        );

        // Đường nét đứt: C - A và D - B (vuông góc từ mặt đất lên điểm đo)
        const dashedMaterial = new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.RED,
          dashLength: 16,
        });

        // Đường nét liền: C - D (trên mặt đất)
        temp.push(
          viewer.entities.add({
            polyline: {
              positions: [C, D],
              width: 2,
              material: dashedMaterial,
              // Cho phép hiển thị xuyên qua vật thể
              clampToGround: false,
              disableDepthTestDistance: Number.POSITIVE_INFINITY, // Hiển thị ưu tiên
            },
          })
        );

        temp.push(
          viewer.entities.add({
            polyline: {
              positions: [C, A],
              width: 2,
              material: dashedMaterial,
              // Cho phép hiển thị xuyên qua vật thể
              clampToGround: false,
              disableDepthTestDistance: Number.POSITIVE_INFINITY, // Hiển thị ưu tiên
            },
          }),
          viewer.entities.add({
            polyline: {
              positions: [D, B],
              width: 2,
              material: dashedMaterial,
              // Cho phép hiển thị xuyên qua vật thể
              clampToGround: false,
              disableDepthTestDistance: Number.POSITIVE_INFINITY, // Hiển thị ưu tiên
            },
          })
        );

        // Hiển thị khoảng cách AB
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
              text: `${(dist / 1000).toFixed(2)} km`,
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

        // Lưu tất cả entity để sau này có thể clear
        entitiesRef.current.push(...temp);

        // Kết thúc đo
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

      entitiesRef.current.push(...temp);
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

        // Lấy tọa độ Cartographic để xác định độ cao
        const carto1 = Cesium.Ellipsoid.WGS84.cartesianToCartographic(p1);
        const carto2 = Cesium.Ellipsoid.WGS84.cartesianToCartographic(p2);

        const h1 = carto1.height;
        const h2 = carto2.height;

        // Xác định điểm A (thấp hơn) và B (cao hơn)
        const A = h1 < h2 ? p1 : p2;
        const B = h1 < h2 ? p2 : p1;

        const cartoA = Cesium.Ellipsoid.WGS84.cartesianToCartographic(A);
        const cartoB = Cesium.Ellipsoid.WGS84.cartesianToCartographic(B);

        // Tạo điểm C (kế thừa kinh độ & vĩ độ của B, nhưng cao độ của A)
        const C_carto = new Cesium.Cartographic(
          cartoB.longitude,
          cartoB.latitude,
          cartoA.height
        );
        const C = Cesium.Ellipsoid.WGS84.cartographicToCartesian(C_carto);

        // Nối tam giác A–C–B
        const CA = [C, A];
        const CB = [C, B];
        const AB = [A, B];

        const dashedMaterial = new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.BLUE,
          dashLength: 8,
        });

        // Vẽ đường nét đứt CA
        temp.push(
          viewer.entities.add({
            polyline: {
              positions: CA,
              width: 2,
              material: dashedMaterial,
            },
          })
        );

        // Vẽ đường nét liền CB
        temp.push(
          viewer.entities.add({
            polyline: {
              positions: CB,
              width: 2,
              material: Cesium.Color.BLUE,
            },
          })
        );

        // Vẽ đường nét liền AB
        temp.push(
          viewer.entities.add({
            polyline: {
              positions: AB,
              width: 1,
              material: Cesium.Color.BLUE,
            },
          })
        );

        // Label ΔH tại trung điểm CB
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

        // Vẽ ký hiệu góc vuông tại C (một đoạn nhỏ tạo hình chữ L)
        const symbolSize = 1.0;

        const rightAngleSymbol = (() => {
          const v1 = Cesium.Cartesian3.subtract(A, C, new Cesium.Cartesian3());
          const v2 = Cesium.Cartesian3.subtract(B, C, new Cesium.Cartesian3());

          Cesium.Cartesian3.normalize(v1, v1);
          Cesium.Cartesian3.normalize(v2, v2);

          // Tạo 2 điểm nhỏ dọc theo v1 và v2 để vẽ ký hiệu
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

        // Lưu và dọn
        entitiesRef.current.push(...temp);
        handlerRef.current.removeInputAction(
          Cesium.ScreenSpaceEventType.LEFT_CLICK
        );
        viewer.scene.screenSpaceCameraController.enableRotate = true;
        setMode(null);
        viewer.scene.requestRender();
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
