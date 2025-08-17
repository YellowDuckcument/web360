import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { Drawer, Switch, Tree } from "antd";
import { SettingOutlined, ZoomInOutlined } from "@ant-design/icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome } from "@fortawesome/free-solid-svg-icons";

import MeasureToolbar from "./MeasureToolbar";
import ClippingPlaneControl from "./ClippingPlaneControl";
import PositionControl from "./PositionControl";

const TOOLTIP_BTN_STYLE = {
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
};

const TooltipButton = ({ icon, tooltip, onClick, active, onHover }) => (
  <div style={{ position: "relative" }}>
    <button
      onClick={onClick}
      style={{
        ...TOOLTIP_BTN_STYLE,
        backgroundColor: active ? "rgba(0,0,0,0.05)" : "transparent",
      }}
      onMouseEnter={() => onHover(tooltip)}
      onMouseLeave={() => onHover(null)}
    >
      {icon}
    </button>
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
        opacity: active === tooltip ? 0.95 : 0,
        pointerEvents: "none",
        transition: "opacity 0.2s",
      }}
    >
      {tooltip}
    </div>
  </div>
);

function MasterMap() {
  const cesiumContainerRef = useRef(null);
  const viewerRef = useRef(null);
  const isInitialized = useRef(false);
  const tileSetsRef = useRef({});
  const [loadedTileset, setLoadedTileset] = useState(null);
  const [hoverTooltip, setHoverTooltip] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [tilesState, setTilesState] = useState({ tiles3D: true, wmts: true });

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen((prev) => !prev);
  }, []);

  const zoomToTileSet = useCallback((key) => {
    if (viewerRef.current && tileSetsRef.current[key]) {
      viewerRef.current.zoomTo(tileSetsRef.current[key]);
    }
  }, []);

  useEffect(() => {
    async function initCesium() {
      if (!cesiumContainerRef.current || isInitialized.current) return;
      isInitialized.current = true;

      Cesium.Ion.defaultAccessToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiZTY1N2NkNC03NjUyLTRjZWMtOGQ0MS1jZTI4MTQ3Zjk5YTUiLCJpZCI6Mjc2MjU3LCJpYXQiOjE3NTMyODAxODh9.dtI1O5YpwJx74URLAE8KyrJyk-f42tBoSfUACRRZ3Io";
      // Cesium.Ion.defaultAccessToken = "YOUR_TOKEN_HERE";
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
      tileset.maximumScreenSpaceError = 4;
      tileset.maximumMemoryUsage = 2048;
      viewer.scene.primitives.add(tileset);
      await tileset.readyPromise;

      tileSetsRef.current.tiles3D = tileset;
      setLoadedTileset(tileset);
      tileset.show = tilesState.tiles3D;

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

      viewer.camera.flyToBoundingSphere(tileset.boundingSphere, {
        duration: 1.5,
        offset: new Cesium.HeadingPitchRange(
          Cesium.Math.toRadians(210),
          Cesium.Math.toRadians(-20),
          150
        ),
      });
    }

    initCesium();
    return () => {
      viewerRef.current?.destroy();
      viewerRef.current = null;
      isInitialized.current = false;
    };
  }, []);

  // Gộp effect show/hide layer
  useEffect(() => {
    Object.entries(tilesState).forEach(([key, value]) => {
      if (tileSetsRef.current[key]) {
        tileSetsRef.current[key].show = value;
      }
    });
    viewerRef.current?.scene.requestRender();
  }, [tilesState]);

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

      {/* Panel nút chức năng */}
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
        <TooltipButton
          icon={<FontAwesomeIcon icon={faHome} />}
          tooltip="Vị trí ban đầu"
          onClick={() => zoomToTileSet("tiles3D")}
          active={hoverTooltip}
          onHover={setHoverTooltip}
        />
        <TooltipButton
          icon={<SettingOutlined />}
          tooltip="Cài đặt"
          onClick={toggleDrawer}
          active={hoverTooltip}
          onHover={setHoverTooltip}
        />
      </div>

      {viewerRef.current && <MeasureToolbar viewer={viewerRef.current} />}
      {viewerRef.current && loadedTileset && (
        <>
          <ClippingPlaneControl
            viewer={viewerRef.current}
            tileset={loadedTileset}
          />
          <PositionControl viewer={viewerRef.current} tileset={loadedTileset} />
        </>
      )}

      {/* Drawer */}
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
