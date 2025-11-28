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
            isActive ? "nav-item active" : "nav-item"
          }
          end
        >
          <span className="nav-icon">🔍</span>
          <span className="nav-text">Discover</span>
        </NavLink>

        <NavLink
          to="/collection"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
        >
          <span className="nav-icon">🖼️</span>
          <span className="nav-text">My Collection</span>
        </NavLink>

        <NavLink
          to="/mint"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
        >
          <span className="nav-icon">✨</span>
          <span className="nav-text">Mint</span>
        </NavLink>

        <NavLink
          to="/activity"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
        >
          <span className="nav-icon">📊</span>
          <span className="nav-text">Activity</span>
        </NavLink>

        <NavLink
          to="/withdraw"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
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
