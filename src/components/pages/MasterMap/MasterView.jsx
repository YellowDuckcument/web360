import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "../../../assets/styles/styles.css";
import { Button, Drawer, Switch, Tree } from "antd";
import { SettingOutlined, ZoomInOutlined } from "@ant-design/icons";

function MasterView() {
  const cesiumContainerRef = useRef(null);
  const viewerRef = useRef(null);
  const isInitialized = useRef(false);
  const terrainProviderRef = useRef(null);
  const tileSetsRef = useRef({});

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [tilesState, setTilesState] = useState({
    tiles3D: true,
  });

  const showDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  useEffect(() => {
    async function initCesium() {
      if (!cesiumContainerRef.current || isInitialized.current) return;
      isInitialized.current = true;

      if (!terrainProviderRef.current) {
        terrainProviderRef.current = await Cesium.createWorldTerrainAsync();
      }

      const viewer = new Cesium.Viewer(cesiumContainerRef.current, {
        imageryProvider: new Cesium.OpenStreetMapImageryProvider(),
        scene3DOnly: true,
        requestRenderMode: true,
        timeline: false,
        animation: false,
        vrButton: false,
        sceneModePicker: false,
        homeButton: false,
        baseLayerPicker: true,
        geocoder: false,
        infoBox: false,
      });

      viewerRef.current = viewer;

      // viewer.camera.changed.addEventListener(() => {
      // const camera = viewer.camera;
      // const cartographic = Cesium.Cartographic.fromCartesian(camera.position);
      // const longitude = Cesium.Math.toDegrees(cartographic.longitude).toFixed(6);
      // const latitude = Cesium.Math.toDegrees(cartographic.latitude).toFixed(6);
      // const height = cartographic.height.toFixed(2);
      //   console.log({
      //     destination: { longitude, latitude, height },
      //     orientation: {
      //       heading: Cesium.Math.toDegrees(camera.heading).toFixed(2),
      //       pitch: Cesium.Math.toDegrees(camera.pitch).toFixed(2),
      //       roll: Cesium.Math.toDegrees(camera.roll).toFixed(2),
      //     },
      //   });
      // });
      const position = Cesium.Cartesian3.fromDegrees(105.854444, 21.028511, 45);
      const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(position);

      const model = await Cesium.Model.fromGltfAsync({
        url: "/models/130NT_NgoaiNha.glb",
        modelMatrix,
        scale: 1.5,
      });
      
      model.style = new Cesium.Cesium3DTileStyle({
        color: "color('white') * 1.25",
      });

      viewer.scene.primitives.add(model);

      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(105.855459, 21.027410, 176.15),
        orientation: {
          heading: Cesium.Math.toRadians(321.60),     // hướng camera về phía Bắc
          pitch: Cesium.Math.toRadians(-37.43),     // nghiêng xuống 30 độ
          roll: 0,
          duration: 0, 
        },
      });
    }

    initCesium();

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!tileSetsRef.current.tiles3D) return;
    tileSetsRef.current.tiles3D.show = tilesState.tiles3D;
    viewerRef.current.scene.requestRender();
  }, [tilesState]);

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
                Cesium 3D Tiles
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
        ],
      },
    ],
    [tilesState, zoomToTileSet]
  );

  return (
    <div className="cesium-container">
      <div ref={cesiumContainerRef} className="cesium-viewer"></div>

      <div className="custom-credit">
        <img src="/src/assets/images/logoblack.png" alt="Logo 3D Scan" className="scan3d"  />
      </div>

      <Button type="primary" className="floating-button" onClick={showDrawer}>
        <SettingOutlined style={{ fontSize: "20px", zIndex: 1001 }} />
      </Button>

      <Drawer
        title="Tùy chỉnh lớp hiển thị"
        placement="left"
        onClose={closeDrawer}
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

export default MasterView;
