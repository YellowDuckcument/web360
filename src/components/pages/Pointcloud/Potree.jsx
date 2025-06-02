import { useEffect } from "react";
import * as THREE from "three";

function Potree() {
  useEffect(() => {
    const loadCSS = (href) =>
      new Promise((resolve, reject) => {
        if (document.querySelector(`link[href="${href}"]`)) {
          resolve();
          return;
        }
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`Không load được CSS: ${href}`));
        document.head.appendChild(link);
      });

    const loadScript = (src) =>
      new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.async = false;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Không load được script: ${src}`));
        document.body.appendChild(script);
      });

    const loadAllAssetsAndInit = async () => {
      try {
        const cssList = [
          "/src/components/pages/PointCloud/build/potree/potree.css",
          "/src/libs/openlayers3/ol.css",
          "/src/libs/spectrum/spectrum.css",
          "/src/libs/jstree/themes/mixed/style.css",
          "/src/libs/jquery-ui/jquery-ui.min.css",
        ];
        await Promise.all(cssList.map(loadCSS));

        const scripts = [
          "/src/libs/jquery/jquery-3.1.1.min.js",
          "/src/libs/spectrum/spectrum.js",
          "/src/libs/jquery-ui/jquery-ui.min.js",
          "/src/libs/other/BinaryHeap.js",
          "/src/libs/tween/tween.min.js",
          "/src/libs/d3/d3.js",
          "/src/libs/proj4/proj4.js",
          "/src/libs/openlayers3/ol.js",
          "/src/libs/i18next/i18next.js",
          "/src/libs/jstree/jstree.js",
          "/src/components/pages/PointCloud/build/potree/potree.js",
          "/src/libs/plasio/js/laslaz.js",
        ];
        for (const src of scripts) {
          await loadScript(src);
        }

        const viewer = new window.Potree.Viewer(document.getElementById("potree_render_area"));

        viewer.setEDLEnabled(true);
        viewer.setFOV(60);
        viewer.setPointBudget(500000);
        viewer.loadSettingsFromURL();

        // Chỉ load GUI nếu chưa tồn tại sidebar
        if (!document.querySelector("#potree_sidebar_container")) {
          viewer.loadGUI(() => {
            viewer.setLanguage("en");
            window.$("#menu_tools").next().show();
            window.$("#menu_scene").next().show();
          });
        }

        window.Potree.loadPointCloud(
          "/public/models/pointcloud/test02/metadata.json",
          "Tòa nhà",
          (e) => {
            const scene = viewer.scene;
            scene.addPointCloud(e.pointcloud);

            const material = e.pointcloud.material;
            material.size = 1;
            material.pointSizeType = window.Potree.PointSizeType.ADAPTIVE;
            viewer.fitToScreen();
          }
        );

        // Thêm ánh sáng
        const directional = new THREE.DirectionalLight(0xffffff, 1.0);
        directional.position.set(10, 10, 10);
        directional.lookAt(0, 0, 0);

        const ambient = new THREE.AmbientLight(0x555555);

        viewer.scene.scene.add(directional);
        viewer.scene.scene.add(ambient);

      } catch (error) {
        console.error("Lỗi khi khởi tạo Potree:", error);
      }
    };

    loadAllAssetsAndInit();
  }, []);

  return (
    <div
      className="potree_container"
      style={{ position: "absolute", width: "100%", height: "100%" }}
    >
      <div id="potree_render_area" />
    </div>
  );
}

export default Potree;
