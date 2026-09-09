import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Database,
  Shield,
  Network,
  Server,
  AlertCircle,
  Clock,
  RefreshCw,
} from "lucide-react";

import { getEvents } from "../services/api";


// ---------------------------------------------------------
// Event icon
// ---------------------------------------------------------

function EventIcon({ eventType, source }) {
  const value = `${eventType || ""} ${source || ""}`.toLowerCase();

  if (
    value.includes("security") ||
    value.includes("failed") ||
    value.includes("login")
  ) {
    return <Shield size={18} />;
  }

  if (
    value.includes("network") ||
    value.includes("ip") ||
    value.includes("connection")
  ) {
    return <Network size={18} />;
  }

  if (
    value.includes("application") ||
    value.includes("account")
  ) {
    return <Server size={18} />;
  }

  return <Database size={18} />;
}


// ---------------------------------------------------------
// Format time
// ---------------------------------------------------------

function formatTime(timestamp) {
  if (!timestamp) return "--:--";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}


// ---------------------------------------------------------
// Format date
// ---------------------------------------------------------

function formatDate(timestamp) {
  if (!timestamp) return "Unknown date";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}


// ---------------------------------------------------------
// Normalize API response
// ---------------------------------------------------------

function normalizeEvents(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.events)) {
    return data.events;
  }

  if (Array.isArray(data?.nodes)) {
    return data.nodes;
  }

  return [];
}


// ---------------------------------------------------------
// Timeline Page
// ---------------------------------------------------------

export default function TimelinePage() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("All sources");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // -------------------------------------------------------
  // Load events from Neo4j
  // -------------------------------------------------------

  async function loadEvents() {
    try {
      setLoading(true);
      setError("");

      const data = await getEvents();

      const normalized = normalizeEvents(data);

      setEvents(normalized);
    } catch (err) {
      console.error("Failed to load timeline events:", err);

      setError(
        err?.message ||
          "Unable to load timeline events."
      );
    } finally {
      setLoading(false);
    }
  }

  // -------------------------------------------------------
  // Initial load
  // -------------------------------------------------------

  useEffect(() => {
    loadEvents();
  }, []);

  // -------------------------------------------------------
  // Sources
  // -------------------------------------------------------

  const sources = useMemo(() => {
    const uniqueSources = [
      ...new Set(
        events
          .map((event) => event.source)
          .filter(Boolean)
      ),
    ];

    return ["All sources", ...uniqueSources];
  }, [events]);

  // -------------------------------------------------------
  // Filter
  // -------------------------------------------------------

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesSearch =
        !query ||
        [
          event.id,
          event.source,
          event.title,
          event.description,
          event.event_type,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(query)
          );

      const matchesSource =
        sourceFilter === "All sources" ||
        event.source === sourceFilter;

      return matchesSearch && matchesSource;
    });
  }, [events, search, sourceFilter]);

  // -------------------------------------------------------
  // Render
  // -------------------------------------------------------

  return (
    <div className="timeline-page">

      {/* ---------------------------------------------------
          Header
      --------------------------------------------------- */}

      <div className="timeline-header">

        <div>
          <p className="eyebrow">
            TEMPORAL EVIDENCE
          </p>

          <h1>Incident Timeline</h1>

          <p>
            Trace evidence across time, systems and
            event sources.
          </p>
        </div>

        <button
          className="timeline-refresh"
          onClick={loadEvents}
          disabled={loading}
        >
          <RefreshCw
            size={14}
            className={loading ? "spin" : ""}
          />

          {loading ? "Refreshing..." : "Refresh"}
        </button>

      </div>


      {/* ---------------------------------------------------
          Search / Filter
      --------------------------------------------------- */}

      <div className="timeline-toolbar">

        <div className="timeline-search">

          <Search size={17} />

          <input
            type="text"
            placeholder="Search events, sources or evidence..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

        </div>


        <select
          value={sourceFilter}
          onChange={(event) =>
            setSourceFilter(event.target.value)
          }
        >
          {sources.map((source) => (
            <option
              key={source}
              value={source}
            >
              {source}
            </option>
          ))}
        </select>

      </div>


      {/* ---------------------------------------------------
          Error
      --------------------------------------------------- */}

      {error && (
        <div className="timeline-error">

          <AlertCircle size={18} />

          <div>
            <strong>
              Failed to load timeline
            </strong>

            <p>{error}</p>
          </div>

        </div>
      )}


      {/* ---------------------------------------------------
          Loading
      --------------------------------------------------- */}

      {loading && (
        <div className="timeline-state">
          Loading evidence from Neo4j...
        </div>
      )}


      {/* ---------------------------------------------------
          Empty
      --------------------------------------------------- */}

      {!loading &&
        !error &&
        filteredEvents.length === 0 && (
          <div className="timeline-state">

            <Database size={22} />

            <p>
              No timeline events found.
            </p>

          </div>
        )}


      {/* ---------------------------------------------------
          Timeline
      --------------------------------------------------- */}

      {!loading &&
        filteredEvents.length > 0 && (

          <div className="timeline-container">

            <div className="timeline-line" />

            {filteredEvents.map(
              (event, index) => (

                <article
                  className="timeline-event"
                  key={
                    event.id ||
                    `${event.timestamp}-${index}`
                  }
                >

                  {/* Time */}

                  <div className="timeline-time">

                    <strong>
                      {formatTime(
                        event.timestamp
                      )}
                    </strong>

                    <span>
                      {formatDate(
                        event.timestamp
                      )}
                    </span>

                  </div>


                  {/* Node */}

                  <div className="timeline-node">

                    <EventIcon
                      eventType={
                        event.event_type
                      }
                      source={
                        event.source
                      }
                    />

                  </div>


                  {/* Event */}

                  <div className="timeline-card">

                    <div className="timeline-card-header">

                      <div>

                        <span className="timeline-source">
                          {event.source ||
                            "UNKNOWN SOURCE"}
                        </span>

                        <h3>
                          {event.title ||
                            "Untitled Event"}
                        </h3>

                      </div>

                      <span className="timeline-type">
                        {event.event_type ||
                          "Evidence Event"}
                      </span>

                    </div>


                    <p className="timeline-description">
                      {event.description ||
                        "No description available."}
                    </p>


                    <div className="timeline-meta">

                      <span>
                        ID: {event.id || "N/A"}
                      </span>

                      <span>
                        <Clock size={11} />

                        {formatTime(
                          event.timestamp
                        )}
                      </span>

                    </div>

                  </div>

                </article>

              )
            )}

          </div>
        )}


      {/* ---------------------------------------------------
          Footer stats
      --------------------------------------------------- */}

      {!loading && (
        <div className="timeline-footer">

          <span>
            {filteredEvents.length} events
          </span>

          <span>
            {sources.length - 1} sources
          </span>

          <span>
            Live Neo4j evidence
          </span>

        </div>
      )}

    </div>
  );
}