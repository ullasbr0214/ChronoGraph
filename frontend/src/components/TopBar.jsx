import { Search, Bell, Circle } from "lucide-react";

export default function TopBar() {
  return (
    <header className="topbar">

      {/* =====================================================
          CASE INFORMATION
      ===================================================== */}

      <div className="topbar-title">

        <p className="eyebrow">
          CASE / CG-2026-001
        </p>

        <h2>
          Investigation Console
        </h2>

      </div>


      {/* =====================================================
          ACTIONS
      ===================================================== */}

      <div className="topbar-actions">

        {/* SEARCH */}

        <div className="search-box">

          <Search size={15} />

          <input
            type="search"
            placeholder="Search events, sources..."
            aria-label="Search events and sources"
          />

          <span>
            ⌘ K
          </span>

        </div>


        {/* NOTIFICATIONS */}

        <button
          type="button"
          className="icon-button"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={16} />
        </button>


        {/* LIVE STATUS */}

        <div
          className="live-status"
          aria-label="System live"
        >

          <Circle
            size={7}
            fill="currentColor"
          />

          LIVE

        </div>

      </div>

    </header>
  );
}