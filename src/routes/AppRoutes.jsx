import { BrowserRouter, Routes, Route } from "react-router-dom";
import Vir360 from "../pages/Vir360/Vir360";
import MasterMap from "../pages/MasterMap/MasterMap";
import Bim from "../pages/BIM/BimModel";
import PointCloud from "../pages/PointCloud/PointCloud";

function AppRouter() {
  return (
    <BrowserRouter  basename="/KTX">
      <Routes>
        <Route path="/" element={<MasterMap />}>
          <Route index element={<div />} />
          <Route path="bim" element={<Bim />} />
          <Route path="pointcloud" element={<PointCloud />} />
          <Route path="360" element={<Vir360 />} />
        </Route>
        
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
