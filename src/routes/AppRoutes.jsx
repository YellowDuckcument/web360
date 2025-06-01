import { BrowserRouter, Routes, Route } from "react-router-dom";
import Vir360 from "../components/pages/Vir360/Vir360";
import MasterMap from "../components/pages/MasterMap/MasterMap";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MasterMap />}>
          <Route index element={<div />} />
          <Route path="pointcloud" element={<Vir360 />} />
          <Route path="360" element={<Vir360 />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
