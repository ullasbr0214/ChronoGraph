import {
  LayoutDashboard,
  Clock3,
  Network,
  Search,
  Database,
} from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="sidebar">

      <div className="brand">
        <div className="brand-mark">
          <Network size={19} />
        </div>

        <div>
          <h1>ChronoGraph</h1>
          <span>TEMPORAL INTELLIGENCE</span>
        </div>
      </div>

      <div className="system-status">
        <span className="status-dot" />
        SYSTEM ONLINE
      </div>

      <p className="sidebar-label">WORKSPACE</p>

      <nav>

        <a href="/" className="nav-item active">
          <LayoutDashboard size={15} />
          Overview
        </a>

        <a href="/timeline" className="nav-item">
          <Clock3 size={15} />
          Timeline
        </a>

        <a href="/graph" className="nav-item">
          <Network size={15} />
          Graph Explorer
        </a>

        <a href="/investigation" className="nav-item">
          <Search size={15} />
          Investigation
        </a>

      </nav>

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

      <div className="sidebar-footer">
        <Database size={11} /> TEMPORAL ENGINE · LOCAL
      </div>

    </aside>
  );
}