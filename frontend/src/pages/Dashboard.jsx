import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import EventCard from "../components/EventCard";
import IncidentReplay from "../components/IncidentReplay";
import MissingEvidence from "../components/MissingEvidence";
import RootCausePath from "../components/RootCausePath";

import { getGraph } from "../services/api";

export default function Dashboard() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // LOAD GRAPH DATA FROM BACKEND
  // =========================================================

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setIsLoading(true);
        setError("");

        const response = await getGraph();

        console.log(
          "DASHBOARD GRAPH RESPONSE:",
          JSON.stringify(response, null, 2)
        );

        const backendEvents = Array.isArray(response)
          ? response
          : response?.nodes || response?.events || [];

        const backendRelationships = Array.isArray(response)
          ? []
          : response?.relationships || [];

        const sortedEvents = [...backendEvents].sort(
          (a, b) =>
            new Date(a.timestamp) - new Date(b.timestamp)
        );

        setEvents(sortedEvents);
        setRelationships(backendRelationships);
      } catch (error) {
        console.error(
          "Failed to load dashboard data:",
          error
        );

        setError(
          error.message ||
            "Failed to load dashboard data"
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // =========================================================
  // CALCULATE TIME WINDOW
  // =========================================================

  const timeWindow = useMemo(() => {
    if (events.length < 2) {
      return "—";
    }

    const timestamps = events
      .map((event) => new Date(event.timestamp).getTime())
      .filter((time) => !Number.isNaN(time));

    if (timestamps.length < 2) {
      return "—";
    }

    const earliest = Math.min(...timestamps);
    const latest = Math.max(...timestamps);

    const differenceMinutes =
      Math.round((latest - earliest) / 60000);

    const hours = Math.floor(
      differenceMinutes / 60
    );

    const minutes =
      differenceMinutes % 60;

    if (hours === 0) {
      return `${minutes}m`;
    }

    if (minutes === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${minutes}m`;
  }, [events]);

  // =========================================================
  // CASE DATE
  // =========================================================

  const caseDate = useMemo(() => {
    if (!events.length) {
      return "No event data";
    }

    const timestamp = events[0]?.timestamp;

    if (!timestamp) {
      return "No event date";
    }

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return "No event date";
    }

    return date.toLocaleDateString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [events]);

  // =========================================================
  // SEQUENCE CONFIDENCE
  // =========================================================
  //
  // This is currently a UI-level score.
  // Later we can replace this with the real AI score
  // returned by the backend.
  // =========================================================

  const sequenceConfidence =
    events.length > 0 ? 87 : 0;

  // =========================================================
  // RECENT EVENTS
  // =========================================================

  const recentEvents = useMemo(() => {
    return [...events]
      .sort(
        (a, b) =>
          new Date(b.timestamp) -
          new Date(a.timestamp)
      )
      .slice(0, 6);
  }, [events]);

  // =========================================================
  // EVENT DATE FOR INCIDENT REPLAY
  // =========================================================

  const replayEvents = useMemo(() => {
    return events.map((event) => ({
      ...event,

      // Keep compatibility with older components
      // that may still expect event_id.
      event_id:
        event.event_id ||
        event.id,

      source:
        event.source ||
        "System",

      title:
        event.title ||
        event.name ||
        "Unknown Event",

      description:
        event.description ||
        "",

      timestamp:
        event.timestamp,
    }));
  }, [events]);

  // =========================================================
  // LOADING STATE
  // =========================================================

  if (isLoading) {
    return (
      <div className="page-shell">

        <section className="hero-section">

          <div>
            <p className="eyebrow">
              TEMPORAL GRAPH ANALYSIS
            </p>

            <h1>
              Reconstruct what happened.
              <br />
              <span>Understand why.</span>
            </h1>

            <p className="hero-description">
              ChronoGraph connects events across time,
              systems and evidence to reconstruct how
              an incident unfolded.
            </p>
          </div>

          <div className="case-status">
            <span className="status-dot" />
            LOADING ANALYSIS
          </div>

        </section>

        <div className="dashboard-loading">
          Loading evidence graph...
        </div>

      </div>
    );
  }

  return (
    <div className="page-shell">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="hero-section">

        <div>

          <p className="eyebrow">
            TEMPORAL GRAPH ANALYSIS
          </p>

          <h1>
            Reconstruct what happened.
            <br />
            <span>Understand why.</span>
          </h1>

          <p className="hero-description">
            ChronoGraph connects events across time,
            systems and evidence to reconstruct how
            an incident unfolded.
          </p>

        </div>

        <div className="case-status">

          <span
            className={`status-dot ${
              error ? "error-dot" : ""
            }`}
          />

          {error
            ? "ANALYSIS ERROR"
            : "ANALYSIS READY"}

        </div>

      </section>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="dashboard-error">
          {error}
        </div>
      )}


      {/* =====================================================
          CASE METRICS
      ===================================================== */}

      <section className="metrics">

        <div className="metric-card">

          <span>
            TOTAL EVENTS
          </span>

          <strong>
            {events.length}
          </strong>

          <small>
            Live Neo4j evidence
          </small>

        </div>


        <div className="metric-card">

          <span>
            RELATIONSHIPS
          </span>

          <strong>
            {relationships.length}
          </strong>

          <small>
            Connected graph links
          </small>

        </div>


        <div className="metric-card">

          <span>
            TIME WINDOW
          </span>

          <strong>
            {timeWindow}
          </strong>

          <small>
            {caseDate}
          </small>

        </div>


        <div className="metric-card accent">

          <span>
            SEQUENCE SCORE
          </span>

          <strong>
            {sequenceConfidence}%
          </strong>

          <small>
            Evidence correlation
          </small>

        </div>

      </section>


      {/* =====================================================
          INVESTIGATION AREA
      ===================================================== */}

      <section className="dashboard-grid">


        {/* ===================================================
            INCIDENT REPLAY
        =================================================== */}

        <IncidentReplay
          events={replayEvents}
        />


        {/* ===================================================
            MISSING EVIDENCE
        =================================================== */}

        <MissingEvidence
          events={replayEvents}
        />


        {/* ===================================================
            ROOT CAUSE PATH
        =================================================== */}

        <RootCausePath
          events={replayEvents}
        />


        {/* ===================================================
            EVENT STREAM
        =================================================== */}

        <div className="panel">

          <div className="panel-header">

            <div>

              <p className="eyebrow">
                TEMPORAL SEQUENCE
              </p>

              <h2>
                Recent Activity
              </h2>

            </div>

            <button
              onClick={() =>
                navigate("/timeline")
              }
            >
              Explore timeline →
            </button>

          </div>


          <div className="event-list">

            {recentEvents.length === 0 ? (

              <div className="empty-state">
                No events available.
              </div>

            ) : (

              recentEvents.map((event) => (

                <EventCard
                  key={
                    event.id ||
                    event.event_id
                  }
                  event={{
                    ...event,

                    event_id:
                      event.event_id ||
                      event.id,

                    source:
                      event.source ||
                      "System",

                    title:
                      event.title ||
                      event.name ||
                      "Unknown Event",
                  }}
                />

              ))

            )}

          </div>

        </div>


        {/* ===================================================
            AI RECONSTRUCTION
        =================================================== */}

        <aside className="panel insight-panel">

          <p className="eyebrow">
            AI RECONSTRUCTION
          </p>

          <div className="insight-symbol">
            ◈
          </div>

          <h2>
            {events.length > 0
              ? "A connected"
              : "No connected"}
            <br />
            sequence emerged.
          </h2>

          <p>
            {events.length > 0
              ? `${events.length} events across independent sources appear to form one operational sequence.`
              : "No evidence events are currently available for analysis."}
          </p>


          <div className="confidence">

            <div>

              <span>
                SEQUENCE CONFIDENCE
              </span>

              <strong>
                {sequenceConfidence}%
              </strong>

            </div>


            <div className="confidence-bar">

              <div
                style={{
                  width: `${sequenceConfidence}%`,
                }}
              />

            </div>

          </div>


          <button
            className="investigate-button"
            onClick={() =>
              navigate("/investigation")
            }
          >
            Investigate sequence →
          </button>

        </aside>

      </section>

    </div>
  );
}