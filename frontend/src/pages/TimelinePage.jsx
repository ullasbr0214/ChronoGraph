import { useEffect, useMemo, useState } from "react";
import {
  Clock3,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import EventCard from "../components/EventCard";
import { getEvents } from "../services/api";

export default function TimelinePage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");

  // ---------------------------------------------------------
  // Load events from backend
  // ---------------------------------------------------------

  const loadEvents = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await getEvents();

      const backendEvents =
        Array.isArray(response)
          ? response
          : Array.isArray(response?.events)
            ? response.events
            : [];

      setEvents(backendEvents);
    } catch (err) {
      console.error("Timeline event loading failed:", err);

      setError(
        err?.message ||
          "Unable to load events from the backend."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ---------------------------------------------------------
  // Initial load
  // ---------------------------------------------------------

  useEffect(() => {
    loadEvents();
  }, []);

  // ---------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------

  const getEventId = (event) =>
    event?.id ||
    event?.event_id ||
    "UNKNOWN";

  const getEventTitle = (event) =>
    event?.title ||
    event?.name ||
    "Untitled Event";

  const getEventSource = (event) =>
    event?.source ||
    "System";

  const getEventDescription = (event) =>
    event?.description ||
    "No description available.";

  const getValidDate = (timestamp) => {
    if (!timestamp) {
      return null;
    }

    const date = new Date(timestamp);

    return Number.isNaN(date.getTime())
      ? null
      : date;
  };

  const formatTime = (timestamp) => {
    const date = getValidDate(timestamp);

    if (!date) {
      return "--:--";
    }

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (timestamp) => {
    const date = getValidDate(timestamp);

    if (!date) {
      return "Unknown date";
    }

    return date.toLocaleDateString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ---------------------------------------------------------
  // Sort events chronologically
  // ---------------------------------------------------------

  const sortedEvents = useMemo(() => {
    return [...events]
      .filter((event) =>
        getValidDate(event?.timestamp)
      )
      .sort(
        (a, b) =>
          getValidDate(a.timestamp) -
          getValidDate(b.timestamp)
      );
  }, [events]);

  // ---------------------------------------------------------
  // Available sources
  // ---------------------------------------------------------

  const sources = useMemo(() => {
    const uniqueSources = new Set();

    events.forEach((event) => {
      if (event?.source) {
        uniqueSources.add(event.source);
      }
    });

    return ["ALL", ...Array.from(uniqueSources)];
  }, [events]);

  // ---------------------------------------------------------
  // Filter events
  // ---------------------------------------------------------

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return sortedEvents.filter((event) => {
      const source = getEventSource(event);

      const matchesSource =
        sourceFilter === "ALL" ||
        source === sourceFilter;

      if (!matchesSource) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchableText = [
        getEventId(event),
        getEventTitle(event),
        getEventSource(event),
        getEventDescription(event),
        event?.event_type || "",
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [
    sortedEvents,
    search,
    sourceFilter,
  ]);

  // ---------------------------------------------------------
  // Calculate timeline statistics
  // ---------------------------------------------------------

  const timelineStats = useMemo(() => {
    if (sortedEvents.length === 0) {
      return {
        total: 0,
        sources: 0,
        duration: 0,
      };
    }

    const first = getValidDate(
      sortedEvents[0]?.timestamp
    );

    const last = getValidDate(
      sortedEvents[sortedEvents.length - 1]
        ?.timestamp
    );

    const duration =
      first && last
        ? Math.round(
            (last.getTime() - first.getTime()) /
              60000
          )
        : 0;

    return {
      total: sortedEvents.length,
      sources: new Set(
        sortedEvents.map((event) =>
          getEventSource(event)
        )
      ).size,
      duration,
    };
  }, [sortedEvents]);

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------

  return (
    <div className="page-shell">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="hero-section">

        <div>

          <p className="eyebrow">
            TEMPORAL EVENT ANALYSIS
          </p>

          <h1>
            Timeline of the incident.
            <br />
            <span>Every event. Every transition.</span>
          </h1>

          <p className="hero-description">
            Explore the chronological sequence of
            evidence collected across connected systems.
          </p>

        </div>

        <div className="case-status">

          <span className="status-dot" />

          LIVE EVENT DATA

        </div>

      </section>


      {/* =====================================================
          TIMELINE METRICS
      ===================================================== */}

      <section className="metrics">

        <div className="metric-card">

          <span>
            TOTAL EVENTS
          </span>

          <strong>
            {timelineStats.total}
          </strong>

          <small>
            Events analyzed
          </small>

        </div>


        <div className="metric-card">

          <span>
            SOURCES
          </span>

          <strong>
            {timelineStats.sources}
          </strong>

          <small>
            Connected evidence sources
          </small>

        </div>


        <div className="metric-card">

          <span>
            TIME SPAN
          </span>

          <strong>
            {timelineStats.duration >= 60
              ? `${Math.floor(
                  timelineStats.duration / 60
                )}h ${
                  timelineStats.duration % 60
                }m`
              : `${timelineStats.duration}m`}
          </strong>

          <small>
            From first to last event
          </small>

        </div>


        <div className="metric-card accent">

          <span>
            DISPLAYED
          </span>

          <strong>
            {filteredEvents.length}
          </strong>

          <small>
            Matching current filters
          </small>

        </div>

      </section>


      {/* =====================================================
          TIMELINE PANEL
      ===================================================== */}

      <section className="panel">

        {/* HEADER */}

        <div className="panel-header">

          <div>

            <p className="eyebrow">
              INCIDENT TIMELINE
            </p>

            <h2>
              Chronological evidence
            </h2>

          </div>

          <button
            type="button"
            onClick={() => loadEvents(true)}
            disabled={refreshing}
          >

            <RefreshCw
              size={15}
              className={
                refreshing
                  ? "spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}

          </button>

        </div>


        {/* =================================================
            FILTER BAR
        ================================================= */}

        <div className="timeline-toolbar">

          <div className="timeline-search">

            <Search size={16} />

            <input
              type="text"
              placeholder="Search events, sources or descriptions..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

          </div>


          <div className="timeline-filter">

            <Filter size={15} />

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
                  {source === "ALL"
                    ? "All sources"
                    : source}
                </option>
              ))}

            </select>

          </div>

        </div>


        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <div className="timeline-state">

            <RefreshCw
              size={22}
              className="spin"
            />

            <h3>
              Loading timeline
            </h3>

            <p>
              Retrieving event evidence from ChronoGraph.
            </p>

          </div>
        )}


        {/* =================================================
            ERROR
        ================================================= */}

        {!loading && error && (
          <div className="timeline-state error">

            <AlertCircle size={24} />

            <h3>
              Unable to load timeline
            </h3>

            <p>
              {error}
            </p>

            <button
              type="button"
              onClick={() => loadEvents()}
            >
              Try again
            </button>

          </div>
        )}


        {/* =================================================
            EMPTY
        ================================================= */}

        {!loading &&
          !error &&
          filteredEvents.length === 0 && (
            <div className="timeline-state">

              <Clock3 size={24} />

              <h3>
                No events found
              </h3>

              <p>
                {events.length === 0
                  ? "The backend has not returned any events yet."
                  : "No events match the current search or source filter."}
              </p>

              {(search || sourceFilter !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSourceFilter("ALL");
                  }}
                >
                  Clear filters
                </button>
              )}

            </div>
          )}


        {/* =================================================
            EVENTS
        ================================================= */}

        {!loading &&
          !error &&
          filteredEvents.length > 0 && (
            <div className="timeline-container">

              <div className="timeline-line" />

              {filteredEvents.map(
                (event, index) => (

                  <div
                    className="timeline-item"
                    key={`${getEventId(event)}-${index}`}
                  >

                    {/* TIME MARKER */}

                    <div className="timeline-marker">

                      <span />

                    </div>


                    {/* TIME */}

                    <div className="timeline-time">

                      <strong>
                        {formatTime(
                          event.timestamp
                        )}
                      </strong>

                      <small>
                        {formatDate(
                          event.timestamp
                        )}
                      </small>

                    </div>


                    {/* EVENT */}

                    <div className="timeline-event-card">

                      <EventCard
                        event={event}
                      />

                    </div>

                  </div>

                )
              )}

            </div>
          )}

      </section>

    </div>
  );
}