import { Search, Bell, Circle } from "lucide-react";

export default function TopBar() {
  return (
    <header className="topbar">

      <div>
        <p className="eyebrow">
          CASE / CG-2026-001
        </p>

        <h2>
          Investigation Console
        </h2>
      </div>

      <div className="topbar-actions">

        <div className="search-box">
          <Search size={15} />

          <input
            type="text"
            placeholder="Search events, sources..."
          />

          <span>⌘ K</span>
        </div>

        <button className="icon-button">
          <Bell size={16} />
        </button>

        <div className="live-status">
          <Circle size={7} fill="currentColor" />
          LIVE
        </div>

      </div>

    </header>
  );
}