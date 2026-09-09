import {
  LayoutDashboard,
  Clock3,
  Network,
  Search,
  Database,
} from "lucide-react";

import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const navClass = ({ isActive }) =>
    `nav-item ${isActive ? "active" : ""}`;

  return (
    <aside className="sidebar">

      {/* =====================================================
          BRAND
      ===================================================== */}

      <div className="brand">

        <div className="brand-mark">
          <Network size={19} />
        </div>

        <div>
          <h1>ChronoGraph</h1>

          <span>
            TEMPORAL INTELLIGENCE
          </span>
        </div>

      </div>


      {/* =====================================================
          SYSTEM STATUS
      ===================================================== */}

      <div className="system-status">

        <span className="status-dot" />

        SYSTEM ONLINE

      </div>


      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <p className="sidebar-label">
        WORKSPACE
      </p>

      <nav>

        <NavLink
          to="/"
          end
          className={navClass}
        >
          <LayoutDashboard size={15} />
          Overview
        </NavLink>


        <NavLink
          to="/timeline"
          className={navClass}
        >
          <Clock3 size={15} />
          Timeline
        </NavLink>


        <NavLink
          to="/graph"
          className={navClass}
        >
          <Network size={15} />
          Graph Explorer
        </NavLink>


        <NavLink
          to="/investigation"
          className={navClass}
        >
          <Search size={15} />
          Investigation
        </NavLink>

      </nav>


      {/* =====================================================
          ACTIVE CASE
      ===================================================== */}

      <div className="case-card">

        <div className="case-label">
          ACTIVE CASE
        </div>

        <div className="case-id">
          CG-2026-001
        </div>

        <div className="case-name">
          Infrastructure Migration
        </div>

      </div>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <div className="sidebar-footer">

        <Database size={11} />

        TEMPORAL ENGINE · LOCAL

      </div>

    </aside>
  );
}