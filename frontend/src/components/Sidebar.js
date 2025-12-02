import React from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? "nav-item nav-discover active" : "nav-item nav-discover"
          }
          end
        >
          <span className="nav-icon">🔍</span>
          <span className="nav-text">Discover</span>
        </NavLink>

        <NavLink
          to="/collection"
          className={({ isActive }) =>
            isActive ? "nav-item nav-collection active" : "nav-item nav-collection"
          }
        >
          <span className="nav-icon">🖼️</span>
          <span className="nav-text">My Collection</span>
        </NavLink>

        <NavLink
          to="/mint"
          className={({ isActive }) =>
            isActive ? "nav-item nav-mint active" : "nav-item nav-mint"
          }
        >
          <span className="nav-icon">✨</span>
          <span className="nav-text">Mint</span>
        </NavLink>

        <NavLink
          to="/activity"
          className={({ isActive }) =>
            isActive ? "nav-item nav-activity active" : "nav-item nav-activity"
          }
        >
          <span className="nav-icon">📊</span>
          <span className="nav-text">Activity</span>
        </NavLink>

        <NavLink
          to="/withdraw"
          className={({ isActive }) =>
            isActive ? "nav-item nav-withdraw active" : "nav-item nav-withdraw"
          }
        >
          <span className="nav-icon">💰</span>
          <span className="nav-text">Withdraw</span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
