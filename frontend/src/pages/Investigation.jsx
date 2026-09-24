import React, { useEffect, useMemo, useState } from "react";

const API_URL = "http://127.0.0.1:8000/api/v1/graph/events";

/* =========================================================
   DEMO DATA
   Used only when backend/Neo4j is unavailable.
========================================================= */

const DEMO_EVENTS = [
  {
    id: "EVT-001",
    source: "System Log",
    title: "Login Attempt",
    description: "A user login attempt was detected.",
    timestamp: "2026-09-06T09:00:00",
    event_type: "AUTH",
  },
  {
    id: "EVT-002",
    source: "Security Log",
    title: "Multiple Failed Logins",
    description: "Multiple failed login attempts were detected.",
    timestamp: "2026-09-06T09:05:00",
    event_type: "SECURITY",
  },
  {
    id: "EVT-003",
    source: "Network Log",
    title: "Unknown IP Connection",
    description: "A connection was detected from an unknown IP address.",
    timestamp: "2026-09-06T09:10:00",
    event_type: "NETWORK",
  },
  {
    id: "EVT-004",
    source: "Application Log",
    title: "Account Access",
    description:
      "The account was accessed after the suspicious connection.",
    timestamp: "2026-09-06T09:15:00",
    event_type: "APPLICATION",
  },
];

/* =========================================================
   HELPERS
========================================================= */

function normalizeEvents(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.events)) {
    return payload.events;
  }

  return [];
}

function sortEvents(events) {
  return [...events].sort(
    (a, b) =>
      new Date(a.timestamp).getTime() -
      new Date(b.timestamp).getTime()
  );
}

function buildRelationships(events) {
  const sorted = sortEvents(events);

  return sorted.slice(0, -1).map((event, index) => {
    const next = sorted[index + 1];

    return {
      id: `${event.id}-${next.id}`,
      source: event.id,
      target: next.id,
      relationship:
        index === 0
          ? "LEADS_TO"
          : index === 1
          ? "CAUSED_BY"
          : "LEADS_TO",
    };
  });
}

function formatTime(timestamp) {
  if (!timestamp) return "--:--";

  const date = new Date(timestamp);

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDate(timestamp) {
  if (!timestamp) return "";

  const date = new Date(timestamp);

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function minutesBetween(first, second) {
  const a = new Date(first).getTime();
  const b = new Date(second).getTime();

  return Math.max(0, Math.round((b - a) / 60000));
}

/* =========================================================
   ICONS
========================================================= */

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function Investigation() {
  const [events, setEvents] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);
  const [selectedSource, setSelectedSource] = useState("All Sources");
  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);

  /* =====================================================
     LOAD DATA
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    async function loadInvestigation() {
      console.log("Loading ChronoGraph investigation...");

      try {
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error(`Backend returned ${response.status}`);
        }

        const payload = await response.json();

        console.log("CHRONOGRAPH EVENTS RESPONSE:", payload);

        const backendEvents = normalizeEvents(payload);

        if (!backendEvents.length) {
          throw new Error("No events returned from backend");
        }

        const sorted = sortEvents(backendEvents);
        const links = buildRelationships(sorted);

        if (mounted) {
          setEvents(sorted);
          setRelationships(links);
          setBackendError(false);
        }

        console.log("CHRONOGRAPH INVESTIGATION EVENTS:", sorted);
        console.log("CHRONOGRAPH REAL RELATIONSHIPS:", links);
      } catch (error) {
        console.warn(
          "Backend graph unavailable. Using ChronoGraph demo evidence.",
          error
        );

        if (mounted) {
          const sorted = sortEvents(DEMO_EVENTS);
          const links = buildRelationships(sorted);

          setEvents(sorted);
          setRelationships(links);
          setBackendError(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadInvestigation();

    return () => {
      mounted = false;
    };
  }, []);

  /* =====================================================
     DERIVED DATA
  ===================================================== */

  const sources = useMemo(() => {
    return ["All Sources", ...new Set(events.map((e) => e.source))];
  }, [events]);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesSource =
        selectedSource === "All Sources" ||
        event.source === selectedSource;

      const matchesSearch =
        !query ||
        event.id?.toLowerCase().includes(query) ||
        event.title?.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.source?.toLowerCase().includes(query);

      return matchesSource && matchesSearch;
    });
  }, [events, selectedSource, search]);

  const timeWindow = useMemo(() => {
    if (events.length < 2) return 0;

    return minutesBetween(
      events[0].timestamp,
      events[events.length - 1].timestamp
    );
  }, [events]);

  const unexplainedGaps = useMemo(() => {
    let gaps = 0;

    for (let i = 0; i < events.length - 1; i++) {
      const gap = minutesBetween(
        events[i].timestamp,
        events[i + 1].timestamp
      );

      if (gap > 10) {
        gaps++;
      }
    }

    return gaps;
  }, [events]);

  const confidence = useMemo(() => {
    if (!events.length) return 0;

    if (events.length >= 4 && relationships.length >= 3) {
      return 100;
    }

    return Math.min(
      99,
      Math.round(
        ((events.length + relationships.length) /
          Math.max(1, events.length * 2)) *
          100
      )
    );
  }, [events, relationships]);

  /* =====================================================
     LOADING SCREEN
  ===================================================== */

  if (loading) {
    return (
      <div className="investigation-page">
        <div className="investigation-loading">
          <div className="loading-orbit">
            <div />
          </div>

          <div className="loading-title">
            INITIALIZING CHRONOGRAPH
          </div>

          <div className="loading-text">
            Reconstructing temporal evidence...
          </div>
        </div>
      </div>
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="investigation-page">
      {/* ================================================
          TOP BAR
      ================================================ */}

      <header className="investigation-topbar">
        <div>
          <div className="case-label">
            CASE / CG-2026-001
          </div>

          <h2>Investigation Console</h2>
        </div>

        <div className="topbar-actions">
          <div className="global-search">
            <SearchIcon />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events, sources..."
            />

            <span className="shortcut">⌘ K</span>
          </div>

          <button className="icon-button">
            <BellIcon />
          </button>

          <div className="live-indicator">
            <span />
            LIVE
          </div>
        </div>
      </header>

      {/* ================================================
          MAIN
      ================================================ */}

      <main className="investigation-content">
        {/* HERO */}

        <section className="investigation-hero">
          <div className="eyebrow">
            TEMPORAL GRAPH ANALYSIS
          </div>

          <h1>
            Reconstruct what happened.
            <br />
            <span>Understand why.</span>
          </h1>

          <p>
            ChronoGraph connects events across time, systems
            and evidence to reconstruct how an incident unfolded.
          </p>

          <div
            className={
              backendError
                ? "analysis-status demo"
                : "analysis-status"
            }
          >
            <span className="status-dot" />

            {backendError
              ? "INVESTIGATION READY · LOCAL EVIDENCE"
              : "INVESTIGATION READY · LIVE EVIDENCE"}
          </div>
        </section>

        {/* METRICS */}

        <section className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">
              TOTAL EVENTS
            </div>

            <div className="metric-value">
              {events.length}
            </div>

            <div className="metric-description">
              Across {sources.length - 1} sources
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">
              GRAPH RELATIONSHIPS
            </div>

            <div className="metric-value">
              {relationships.length}
            </div>

            <div className="metric-description">
              Connected evidence links
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">
              UNEXPLAINED GAPS
            </div>

            <div className="metric-value">
              {unexplainedGaps}
            </div>

            <div className="metric-description">
              Potential investigation points
            </div>
          </div>

          <div className="metric-card confidence-card">
            <div className="metric-label">
              SEQUENCE CONFIDENCE
            </div>

            <div className="metric-value">
              {confidence}%
            </div>

            <div className="metric-description">
              Evidence correlation
            </div>
          </div>
        </section>

        {/* FILTER */}

        <section className="evidence-filter-section">
          <div>
            <div className="eyebrow">
              EVIDENCE FILTER
            </div>

            <h3>Filter investigation evidence</h3>
          </div>

          <select
            value={selectedSource}
            onChange={(e) =>
              setSelectedSource(e.target.value)
            }
          >
            {sources.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </section>

        {/* TEMPORAL EVIDENCE */}

        <section className="timeline-section">
          <div className="section-heading">
            <div>
              <div className="eyebrow">
                TEMPORAL EVIDENCE
              </div>

              <h2>Incident sequence</h2>
            </div>

            <div className="time-window">
              {timeWindow}m
            </div>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="empty-state">
              No evidence matches your search.
            </div>
          ) : (
            <div className="incident-timeline">
              {filteredEvents.map((event, index) => {
                const nextEvent = filteredEvents[index + 1];

                const gap = nextEvent
                  ? minutesBetween(
                      event.timestamp,
                      nextEvent.timestamp
                    )
                  : null;

                return (
                  <React.Fragment key={event.id}>
                    <div
                      className={
                        selectedEvent?.id === event.id
                          ? "timeline-event selected"
                          : "timeline-event"
                      }
                      onClick={() =>
                        setSelectedEvent(event)
                      }
                    >
                      <div className="timeline-marker">
                        <span />
                      </div>

                      <div className="timeline-time">
                        {formatTime(event.timestamp)}
                      </div>

                      <div className="event-card">
                        <div className="event-card-top">
                          <span className="event-source">
                            {event.source}
                          </span>

                          <span className="event-id">
                            {event.id}
                          </span>
                        </div>

                        <h3>{event.title}</h3>

                        <p>{event.description}</p>

                        <div className="event-footer">
                          <span>
                            {formatDate(event.timestamp)}
                          </span>

                          <span>
                            {event.event_type || "EVIDENCE"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {gap !== null && (
                      <div className="timeline-connection">
                        <div className="connection-line" />

                        <div className="connection-label">
                          <ArrowIcon />
                          {gap} min
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </section>

        {/* RELATIONSHIPS */}

        <section className="relationships-section">
          <div className="eyebrow">
            GRAPH RELATIONSHIPS
          </div>

          <div className="section-heading">
            <div>
              <h2>Evidence connections</h2>

              <p>
                ChronoGraph reconstructed the temporal
                relationships between observed events.
              </p>
            </div>

            <div className="relationship-count">
              {relationships.length} LINKS
            </div>
          </div>

          <div className="relationship-list">
            {relationships.map((relation) => {
              const from = events.find(
                (event) => event.id === relation.source
              );

              const to = events.find(
                (event) => event.id === relation.target
              );

              return (
                <div
                  className="relationship-card"
                  key={relation.id}
                >
                  <div className="relationship-node">
                    <span>{relation.source}</span>
                    <strong>{from?.title}</strong>
                  </div>

                  <div className="relationship-arrow">
                    <span>{relation.relationship}</span>
                    <ArrowIcon />
                  </div>

                  <div className="relationship-node">
                    <span>{relation.target}</span>
                    <strong>{to?.title}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* INVESTIGATION SUMMARY */}

        <section className="investigation-summary">
          <div className="summary-icon">
            ◈
          </div>

          <div className="summary-content">
            <div className="eyebrow">
              INVESTIGATION SUMMARY
            </div>

            <h2>
              A continuous incident sequence was reconstructed.
            </h2>

            <p>
              The available evidence forms a chronological
              chain from the initial login attempt through
              failed authentication, an unknown network
              connection and subsequent account access.
            </p>
          </div>

          <div className="summary-confidence">
            <span>CONFIDENCE</span>
            <strong>{confidence}%</strong>
          </div>
        </section>

        {/* SELECTED EVENT */}

        {selectedEvent && (
          <section className="selected-evidence">
            <div className="eyebrow">
              SELECTED EVIDENCE
            </div>

            <div className="selected-evidence-grid">
              <div>
                <span>EVENT ID</span>
                <strong>{selectedEvent.id}</strong>
              </div>

              <div>
                <span>SOURCE</span>
                <strong>{selectedEvent.source}</strong>
              </div>

              <div>
                <span>TIMESTAMP</span>
                <strong>
                  {formatDate(selectedEvent.timestamp)}{" "}
                  {formatTime(selectedEvent.timestamp)}
                </strong>
              </div>

              <div>
                <span>TYPE</span>
                <strong>
                  {selectedEvent.event_type || "EVIDENCE"}
                </strong>
              </div>
            </div>

            <div className="selected-description">
              {selectedEvent.description}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}