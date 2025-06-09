import MasterView from "../MasterMap/MasterView";
import Header from "../../Nav/Header/Header";
import { Outlet, useLocation } from "react-router-dom";
import "./../../../assets/styles/styles.css";

function MasterMap() {
  const location = useLocation();
  return (
    <div className="app-container">
      {/* Header */}
      <div className="header-container">
        <Header />
      </div>

      {/* Main Content */}
      <div className="main_container">
        {location.pathname === "/" && <MasterView />}

        <div className="app-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default MasterMap;
