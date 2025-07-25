import "./Header.css";
import { NavLink } from "react-router-dom";
import { Popover } from "antd";

const Header = () => {
  return (
    <header className="header">
      <div className="container">
        {/* Logo */}
        <div className="logo">
            <img src="/images/logo3dscan.png" alt="logo3dscan" />
        </div>

        {/* Navigation */}
        <nav className="nav">
          <NavLink to="/">Master Map</NavLink>
          <NavLink to="/bim">3D Bim</NavLink>
          <NavLink to="/pointcloud">PointCloud</NavLink>
          <NavLink to="/360">Virtual 360</NavLink>
        </nav>

        {/* Address */}
        
        <Popover content={content} arrow={true} placement="top" overlayStyle={{ zIndex: 2000 }}>
        <div className="address" style={{fontWeight: "bold"}}>3DSCAN VIET NAM</div>
        </Popover>

      </div>
    </header>
  );
};

const content = (
  <div>
    {/* <div>- <strong>Tên công trình:</strong> Toà nhà Gtel - 103 Nguyễn Tuân</div>
    <div>- <strong>Chủ đầu tư:</strong> GTel</div>
    <div>- <strong>Địa chỉ:</strong> 103-105, Nguyễn Tuân, Phường Thanh Xuân Trung, Quận Thanh Xuân, Hà Nội.</div>
    <div>- <strong>Tel:</strong> 0692326569</div>
    <div>- <strong>Quy mô:</strong> </div>
    <div>- <strong>Chức năng:</strong> Hiển thị tour 360, Mô hình mesh, mô hình BIM</div> */}
  </div>
);

export default Header;