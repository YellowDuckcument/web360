import "./Header.css";
import { NavLink } from "react-router-dom";

const Header = () => {
  return (
    <header className="header">
      <div className="container">
        {/* Logo */}
        <div className="logo">
            <img src="/src/assets/images/logo_gtel.jpg" alt="logo3dscan" />
        </div>

        {/* Navigation */}
        <nav className="nav">
          <NavLink to="/">Master Map</NavLink>
          <NavLink to="/360">Virtual 360</NavLink>
        </nav>

        {/* Address */}
        <div className="address" style={{fontWeight: "bold"}}>Toà nhà Gtel - 103 Nguyễn Tuân</div>
      </div>
    </header>
  );
};

export default Header;