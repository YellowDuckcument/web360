import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { Drawer, Switch, Tree } from "antd";
import { SettingOutlined, ZoomInOutlined } from "@ant-design/icons";
import MeasureToolbar from "./MeasureToolbar";
import ClippingPlaneControl from "./ClippingPlaneControl";
import PositionControl from "./PositionControl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome } from "@fortawesome/free-solid-svg-icons";

function MasterMap() {
  const cesiumContainerRef = useRef(null);
  const viewerRef = useRef(null);
  const isInitialized = useRef(false);
  const tileSetsRef = useRef({});
  const [loadedTileset, setLoadedTileset] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [tilesState, setTilesState] = useState({
    tiles3D: true,
    wmts: true,
  });

  // ✅ Toggle Drawer
  const toggleDrawer = () => {
    setIsDrawerOpen((prev) => !prev);
  };

  useEffect(() => {
    async function initCesium() {
      if (!cesiumContainerRef.current || isInitialized.current) return;
      isInitialized.current = true;
      Cesium.Ion.defaultAccessToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiZTY1N2NkNC03NjUyLTRjZWMtOGQ0MS1jZTI4MTQ3Zjk5YTUiLCJpZCI6Mjc2MjU3LCJpYXQiOjE3NTMyODAxODh9.dtI1O5YpwJx74URLAE8KyrJyk-f42tBoSfUACRRZ3Io";

      const viewer = new Cesium.Viewer(cesiumContainerRef.current, {
        scene3DOnly: true,
        requestRenderMode: true,
        timeline: false,
        animation: false,
        baseLayerPicker: false,
      });

      viewerRef.current = viewer;

      const tileset = await Cesium.Cesium3DTileset.fromUrl(
        "https://gis.daces.vn/models/KTXHQG_KHUB_CESIUM/Scene/Production_2.json"
      );
      Object.assign(tileset, {
        maximumScreenSpaceError: 4,
        maximumMemoryUsage: 2048,
      });

      viewer.scene.primitives.add(tileset);
      await tileset.readyPromise;

      viewer.camera.flyToBoundingSphere(tileset.boundingSphere, {
        duration: 1.5,
        offset: new Cesium.HeadingPitchRange(
          Cesium.Math.toRadians(210),
          Cesium.Math.toRadians(-20),
          150
        ),
      });

      tileSetsRef.current.tiles3D = tileset;
      setLoadedTileset(tileset);
      tileset.show = tilesState.tiles3D;
      await tileSetsRef.current.tiles3D.readyPromise;

      const boundingSphere = tileset.boundingSphere;
      const cartographic = Cesium.Cartographic.fromCartesian(
        boundingSphere.center
      );
      const surface = Cesium.Cartesian3.fromRadians(
        cartographic.longitude,
        cartographic.latitude,
        0.0
      );
      const offset = Cesium.Cartesian3.fromRadians(
        cartographic.longitude,
        cartographic.latitude,
        0
      );
      const translation = Cesium.Cartesian3.subtract(
        offset,
        surface,
        new Cesium.Cartesian3()
      );
      tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);

      viewer.camera.flyToBoundingSphere(tileset.boundingSphere, {
        duration: 0,
        offset: new Cesium.HeadingPitchRange(
          Cesium.Math.toRadians(140.9),
          Cesium.Math.toRadians(-41.47),
          180
        ),
      });

      const wmtsLayer = viewer.imageryLayers.addImageryProvider(
        new Cesium.WebMapTileServiceImageryProvider({
          url: "https://model.3dscan.vn/api_wmts/geoserver/KTX/gwc/service/wmts",
          layer: "KTX:AnhTrucGiao",
          style: "",
          format: "image/png",
          tileMatrixSetID: "WebMercatorQuadx2",
          maximumLevel: 22,
          tilingScheme: new Cesium.WebMercatorTilingScheme(),
          tileMatrixLabels: Array.from({ length: 23 }, (_, i) => `${i}`),
        })
      );

      tileSetsRef.current.wmts = wmtsLayer;
      wmtsLayer.show = tilesState.wmts;

      viewer.camera.changed.addEventListener(() => {
        const camera = viewer.camera;
        const cartographic = Cesium.Cartographic.fromCartesian(camera.position);
        const longitude = Cesium.Math.toDegrees(cartographic.longitude).toFixed(
          6
        );
        const latitude = Cesium.Math.toDegrees(cartographic.latitude).toFixed(
          6
        );
        const height = cartographic.height.toFixed(2);
        console.log({
          destination: { longitude, latitude, height },
          orientation: {
            heading: Cesium.Math.toDegrees(camera.heading).toFixed(2),
            pitch: Cesium.Math.toDegrees(camera.pitch).toFixed(2),
            roll: Cesium.Math.toDegrees(camera.roll).toFixed(2),
          },
        });
      });
    }

    initCesium();

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
        isInitialized.current = false;
      }
    };
  }, []);

  useEffect(() => {
    if (!tileSetsRef.current.tiles3D) return;
    tileSetsRef.current.tiles3D.show = tilesState.tiles3D;
    viewerRef.current.scene.requestRender();
  }, [tilesState.tiles3D]);

  useEffect(() => {
    if (!tileSetsRef.current.wmts) return;
    tileSetsRef.current.wmts.show = tilesState.wmts;
    viewerRef.current.scene.requestRender();
  }, [tilesState.wmts]);

  const zoomToTileSet = useCallback((key) => {
    if (viewerRef.current && tileSetsRef.current[key]) {
      viewerRef.current.zoomTo(tileSetsRef.current[key]);
    }
  }, []);

  const treeData = useMemo(
    () => [
      {
        title: "3D Layers",
        key: "3d-layers",
        children: [
          {
            title: (
              <span>
                Model
                <Switch
                  style={{ marginLeft: 10 }}
                  size="small"
                  checked={tilesState.tiles3D}
                  onChange={(checked) =>
                    setTilesState((prev) => ({ ...prev, tiles3D: checked }))
                  }
                />
                <ZoomInOutlined
                  onClick={() => zoomToTileSet("tiles3D")}
                  style={{ marginLeft: 10, cursor: "pointer" }}
                />
              </span>
            ),
            key: "tiles3D",
          },
          {
            title: (
              <span>
                WMTS: Ảnh Trực Giao
                <Switch
                  style={{ marginLeft: 10 }}
                  size="small"
                  checked={tilesState.wmts}
                  onChange={(checked) =>
                    setTilesState((prev) => ({ ...prev, wmts: checked }))
                  }
                />
              </span>
            ),
            key: "wmtsLayer",
          },
        ],
      },
    ],
    [tilesState, zoomToTileSet]
  );

  return (
    <div className="cesium-container">
      <div ref={cesiumContainerRef} className="cesium-viewer"></div>

      {/* ✅ Khung chứa Home + Setting */}
      <div
        style={{
          position: "absolute",
          top: 50,
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
        }}
      >
        {/* Nút Home */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => zoomToTileSet("tiles3D")}
            style={{
              backgroundColor: "transparent",
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
              color: "#333",
            }}
            onMouseEnter={() => setShowTooltip("home")}
            onMouseLeave={() => setShowTooltip(null)}
          >
            <FontAwesomeIcon icon={faHome} />
          </button>
          {/* Tooltip */}
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
              opacity: showTooltip === "home" ? 0.95 : 0,
              pointerEvents: "none",
              transition: "opacity 0.2s",
            }}
          >
            Vị trí ban đầu
          </div>
        </div>

        {/* Nút Setting */}
        <div style={{ position: "relative" }}>
          <button
            onClick={toggleDrawer}
            style={{
              backgroundColor: "transparent",
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
              color: "#333",
            }}
            onMouseEnter={() => setShowTooltip("setting")}
            onMouseLeave={() => setShowTooltip(null)}
          >
            <SettingOutlined />
          </button>
          {/* Tooltip */}
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
              opacity: showTooltip === "setting" ? 0.95 : 0,
              pointerEvents: "none",
              transition: "opacity 0.2s",
            }}
          >
            Cài đặt
          </div>
        </div>
      </div>

      {viewerRef.current && <MeasureToolbar viewer={viewerRef.current} />}

      {viewerRef.current && loadedTileset && (
        <ClippingPlaneControl
          viewer={viewerRef.current}
          tileset={loadedTileset}
        />
      )}

      {viewerRef.current && loadedTileset && (
        <PositionControl viewer={viewerRef.current} tileset={loadedTileset} />
      )}

      {/* Drawer cấu hình lớp */}
      <Drawer
        title="Tùy chỉnh lớp hiển thị"
        placement="left"
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        mask={false}
        zIndex={1002}
        width={300}
        className="custom-drawer"
      >
        <Tree
          showLine
          defaultExpandAll
          treeData={treeData}
          selectable={false}
        />
      </Drawer>
    </div>
  );
}

export default MasterMap;
