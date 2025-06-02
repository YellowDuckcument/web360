import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { Button, Drawer, Switch, Tree } from "antd";
import { SettingOutlined, ZoomInOutlined } from "@ant-design/icons";
import { accessToken, assetIds } from "./CesiumConfig";

function MasterMap() {
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

      Cesium.Ion.defaultAccessToken = accessToken;

      if (!terrainProviderRef.current) {
        terrainProviderRef.current = await Cesium.createWorldTerrainAsync();
      }

      const viewer = new Cesium.Viewer(cesiumContainerRef.current, {
        terrainProvider: terrainProviderRef.current,
        scene3DOnly: true,
        requestRenderMode: true,
        timeline: false,
        animation: false,
        homeButton: false,
      });

      viewerRef.current = viewer;

      const createTileSet = async (id, options = {}) => {
        const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(id);
        Object.assign(tileset, {
          maximumScreenSpaceError: 2.5,
          maximumMemoryUsage: 512,
          ...options,
        });
        viewer.scene.primitives.add(tileset);
        return tileset;
      };

      tileSetsRef.current.tiles3D = await createTileSet(assetIds.tiles3D);

      tileSetsRef.current.tiles3D.show = tilesState.tiles3D;

      await tileSetsRef.current.tiles3D.readyPromise;

      const boundingSphere = tileSetsRef.current.tiles3D.boundingSphere;

      viewer.camera.flyToBoundingSphere(boundingSphere, {
              duration: 0,
              offset: new Cesium.HeadingPitchRange(
                Cesium.Math.toRadians(137.24),     //  hướng
                Cesium.Math.toRadians(-30),     //  nhìn từ trên xuống
                250                             //  khoảng cách camera
              )
            });

    // viewer.camera.changed.addEventListener(() => {
    //   const camera = viewer.camera;
    //   const cartographic = Cesium.Cartographic.fromCartesian(camera.position);
    //   const longitude = Cesium.Math.toDegrees(cartographic.longitude).toFixed(6);
    //   const latitude = Cesium.Math.toDegrees(cartographic.latitude).toFixed(6);
    //   const height = cartographic.height.toFixed(2);
    //     console.log({
    //       destination: { longitude, latitude, height },
    //       orientation: {
    //         heading: Cesium.Math.toDegrees(camera.heading).toFixed(2),
    //         pitch: Cesium.Math.toDegrees(camera.pitch).toFixed(2),
    //         roll: Cesium.Math.toDegrees(camera.roll).toFixed(2),
    //       },
    //     });
    //   });

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
    if (
      !tileSetsRef.current.tiles3D ||
      !tileSetsRef.current.google3DTiles ||
      !tileSetsRef.current.pointCloud
    )
      return;

    tileSetsRef.current.tiles3D.show = tilesState.tiles3D;
    tileSetsRef.current.google3DTiles.show = tilesState.google3DTiles;

    if (tilesState.pointCloud) {
      tileSetsRef.current.pointCloud.show = true;
      tileSetsRef.current.pointCloud.style = new Cesium.Cesium3DTileStyle({
        show: "true",
      });
    } else {
      tileSetsRef.current.pointCloud.style = new Cesium.Cesium3DTileStyle({
        show: "false",
      });
      setTimeout(() => {
        tileSetsRef.current.pointCloud.show = false;
        viewerRef.current.scene.requestRender();
      }, 100);
    }

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
                City 3D Tiles
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
      
      <Button type="primary" className="floating-button" onClick={showDrawer}>
        <SettingOutlined style={{ fontSize: "20px",zIndex: 1001}} />
      </Button>

      <Drawer
        title="Tùy chỉnh lớp hiển thị"
        placement="left"
        onClose={closeDrawer}
        open={isDrawerOpen}
        mask={false}
        zIndex={1002}
        width={300}
        className="custom-drawer">
          
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
