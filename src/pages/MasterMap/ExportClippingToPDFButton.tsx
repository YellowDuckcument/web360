import { useRef } from "react";
import { jsPDF } from "jspdf";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf } from "@fortawesome/free-solid-svg-icons";

import { useState } from "react";
import * as Cesium from "cesium";

type Props = {
  viewer: Cesium.Viewer;
  clipEntities: Cesium.Entity[];
};

export default function ExportClippingToPDFButton({
  viewer,
  clipEntities,
}: Props) {
  const [exporting, setExporting] = useState(false);

  const captureEntityImage = async (entity: Cesium.Entity): Promise<string> => {
    return new Promise((resolve) => {
      const scene = viewer.scene;

      // Zoom đến entity
      viewer.flyTo(entity, { duration: 0.5 }).then(() => {
        scene.render(); // render lại trước khi chụp
        setTimeout(() => {
          const canvas = scene.canvas;
          const imageData = canvas.toDataURL("image/png");
          resolve(imageData);
        }, 300); // delay nhẹ để đảm bảo flyTo xong
      });
    });
  };

  const handleExport = async () => {
    if (!viewer || clipEntities.length === 0) {
      alert("Không có điểm nào để xuất!");
      return;
    }

    setExporting(true);

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    for (let i = 0; i < clipEntities.length; i++) {
      const entity = clipEntities[i];
      const imageData = await captureEntityImage(entity);

      // Chèn ảnh vào PDF, vừa với khổ A4 (landscape)
      pdf.addImage(imageData, "PNG", 10, 10, 277, 190);

      if (i < clipEntities.length - 1) pdf.addPage();
    }

    pdf.save("clipping_points.pdf");
    setExporting(false);
  };

  //   return (
  //     <Button
  //       variant="contained"
  //       color="primary"
  //       onClick={handleExport}
  //       disabled={exporting}>
  //       {exporting ? "Đang xuất..." : "Xuất ảnh PDF từ các điểm cắt"}
  //     </Button>
  //   );
  // }

  return (
    <div
      style={{
        position: "absolute",
        bottom: 70,
        left: 20,
        zIndex: 1000,
        background: "white",
        padding: "8px 12px",
        borderRadius: 8,
        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
      }}
    >
      <button
        onClick={handleExport}
        disabled={exporting}
        style={{
          border: "1px solid rgba(0,0,0,0.1)",
          cursor: "pointer",
          padding: "6px 12px",
          borderRadius: 5,
          transition: "background 0.2s, color 0.2s",
          fontSize: 14,
          background: "#f0f0f0",
        }}
      >
        <FontAwesomeIcon icon={faFilePdf} style={{ marginRight: 6 }} />

        {exporting ? "Đang xuất..." : "Xuất ảnh PDF từ các điểm cắt"}
      </button>
    </div>
  );
}
