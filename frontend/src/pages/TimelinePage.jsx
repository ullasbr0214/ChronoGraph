import { useEffect, useMemo, useState } from "react";
import {
  MessageSquare,
  GitBranch,
  Mail,
  ArrowRight,
  Zap,
  Shield,
  Network,
  Server,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getEvents } from "../services/api";

const sourceIcons = {
  Slack: MessageSquare,
  GitHub: GitBranch,
  Email: Mail,
  "System Log": Server,
  "Security Log": Shield,
  "Network Log": Network,
  "Application Log": Server,
};

function formatTime(timestamp) {
  if (!timestamp) return "--:--";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(timestamp) {
  if (!timestamp) return "--";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function TimelinePage() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---------------------------------------------------------
  // Load events from Neo4j through FastAPI
  // ---------------------------------------------------------

  async function loadEvents() {
    try {
      setLoading(true);
      setError("");

      const data = await getEvents();

      console.log("ChronoGraph events received:", data);

      if (!data || !Array.isArray(data.events)) {
        throw new Error("Invalid event data received from backend");
      }

      setEvents(data.events);
    } catch (err) {
      console.error("Failed to load ChronoGraph events:", err);

      setError(
        err?.message ||
          "Unable to connect to the ChronoGraph backend."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  // ---------------------------------------------------------
  // Sort events chronologically
  // ---------------------------------------------------------

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      return (
        new Date(a.timestamp).getTime() -
        new Date(b.timestamp).getTime()
      );
    });
  }, [events]);

  const firstEvent = sortedEvents[0];
  const lastEvent = sortedEvents[sortedEvents.length - 1];

  // ---------------------------------------------------------
  // Navigate to investigation
  // ---------------------------------------------------------

  function inspectEvent(event) {
    if (!event?.id) {
      console.warn("Cannot inspect event without an ID:", event);
      return;
    }

    navigate(
      `/investigation?event=${encodeURIComponent(event.id)}`
    );
  }

  function openInvestigation() {
    if (firstEvent?.id) {
      navigate(
        `/investigation?event=${encodeURIComponent(firstEvent.id)}`
      );
    } else {
      navigate("/investigation");
    }
  }

  return (
    <main className="timeline-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="page-header timeline-header">

        <div>
          <p className="eyebrow">
            TEMPORAL SEQUENCE
          </p>

          <h1>
            Incident Timeline
          </h1>

          <p className="page-description">
            Follow the chain of events and discover how the
            incident evolved across different systems.
          </p>
        </div>

        <div className="timeline-live">
          <span className="status-dot" />
          TIMELINE ACTIVE
        </div>

      </section>


      {/* =====================================================
          TIMELINE SUMMARY
      ===================================================== */}

      <section className="timeline-summary">

        <div className="timeline-stat">

          <span>
            START
          </span>

          <strong>
            {firstEvent
              ? formatTime(firstEvent.timestamp)
              : "--:--"}
          </strong>

          <small>
            {firstEvent
              ? formatDate(firstEvent.timestamp)
              : "No events"}
          </small>

        </div>


        <div className="timeline-stat">

          <span>
            END
          </span>

          <strong>
            {lastEvent
              ? formatTime(lastEvent.timestamp)
              : "--:--"}
          </strong>

          <small>
            {lastEvent
              ? formatDate(lastEvent.timestamp)
              : "No events"}
          </small>

        </div>


        <div className="timeline-stat">

          <span>
            EVENTS
          </span>

          <strong>
            {events.length}
          </strong>

          <small>
            Events detected
          </small>

        </div>


        <div className="timeline-stat highlight">

          <span>
            CONFIDENCE
          </span>

          <strong>
            87%
          </strong>

          <small>
            AI correlation
          </small>

        </div>

      </section>


      {/* =====================================================
          MAIN TIMELINE WORKSPACE
      ===================================================== */}

      <section className="timeline-workspace">

        {/* ===================================================
            TIMELINE PANEL
        =================================================== */}

        <div className="timeline-panel">

          {/* PANEL HEADER */}

          <div className="timeline-panel-header">

            <div>

              <p className="eyebrow">
                CASE CG-2026-001
              </p>

              <h2>
                Infrastructure Migration
              </h2>

            </div>

            <div className="timeline-filter">

              <span>
                ALL SOURCES
              </span>

              <span>
                {events.length} EVENTS
              </span>

            </div>

          </div>


          {/* =================================================
              LOADING
          ================================================= */}

          {loading && (
            <div className="timeline-empty">

              <RefreshCw
                size={22}
                className="loading-icon"
              />

              <p>
                Loading events from Neo4j...
              </p>

              <small>
                ChronoGraph is retrieving the latest event sequence.
              </small>

            </div>
          )}


          {/* =================================================
              ERROR
          ================================================= */}

          {!loading && error && (
            <div className="timeline-empty">

              <AlertCircle size={24} />

              <p>
                Failed to load events.
              </p>

              <small>
                {error}
              </small>

              <button
                type="button"
                className="timeline-retry-button"
                onClick={loadEvents}
              >
                <RefreshCw size={15} />
                Retry connection
              </button>

            </div>
          )}


          {/* =================================================
              NO EVENTS
          ================================================= */}

          {!loading &&
            !error &&
            sortedEvents.length === 0 && (
              <div className="timeline-empty">

                <Zap size={24} />

                <p>
                  No events found in Neo4j.
                </p>

                <small>
                  Create or import events to build the incident
                  timeline.
                </small>

              </div>
            )}


          {/* =================================================
              TIMELINE
          ================================================= */}

          {!loading &&
            !error &&
            sortedEvents.length > 0 && (

              <div className="timeline">

                {sortedEvents.map((event, index) => {

                  const Icon =
                    sourceIcons[event.source] || Zap;

                  return (

                    <div
                      className="timeline-event"
                      key={event.id || `event-${index}`}
                    >

                      {/* =====================================
                          TIME
                      ===================================== */}

                      <div className="timeline-time">

                        <strong>
                          {formatTime(event.timestamp)}
                        </strong>

                        <span>
                          {formatDate(event.timestamp)}
                        </span>

                      </div>


                      {/* =====================================
                          LINE + NODE
                      ===================================== */}

                      <div className="timeline-marker">

                        <div className="timeline-node">

                          <Icon size={17} />

                        </div>

                        {index !==
                          sortedEvents.length - 1 && (
                          <div className="timeline-line" />
                        )}

                      </div>


                      {/* =====================================
                          EVENT CARD
                      ===================================== */}

                      <div className="timeline-card">

                        <div className="timeline-card-top">

                          <div className="timeline-source">

                            <Icon size={14} />

                            <span>
                              {event.source || "Unknown Source"}
                            </span>

                          </div>

                          <span className="event-id">
                            {event.id || "UNKNOWN"}
                          </span>

                        </div>


                        <h3>
                          {event.title || "Untitled Event"}
                        </h3>


                        <p>
                          {event.description ||
                            "No description available."}
                        </p>


                        <div className="timeline-card-bottom">

                          <span className="event-type">
                            EVENT
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              inspectEvent(event)
                            }
                          >
                            Inspect
                            <ArrowRight size={14} />
                          </button>

                        </div>

                      </div>

                    </div>
                  );
                })}


                {/* ===========================================
                    AI INFERENCE
                =========================================== */}

                <div className="ai-inference">

                  <div className="ai-inference-icon">

                    <Zap size={17} />

                  </div>


                  <div>

                    <span className="eyebrow">
                      AI INFERENCE
                    </span>

                    <h3>
                      A probable operational sequence
                      was detected.
                    </h3>

                    <p>
                      ChronoGraph is analyzing the temporal
                      order of events across connected systems.
                      The sequence may represent a related
                      incident.
                    </p>

                  </div>


                  <div className="ai-score">

                    <strong>
                      87%
                    </strong>

                    <span>
                      CONFIDENCE
                    </span>

                  </div>

                </div>

              </div>
            )}

        </div>


        {/* ===================================================
            RIGHT INSIGHT PANEL
        =================================================== */}

        <aside className="timeline-insight">

          <p className="eyebrow">
            SEQUENCE INTELLIGENCE
          </p>


          <div className="insight-orbit">

            <div />
            <div />

            <Zap size={20} />

          </div>


          <h2>

            {events.length} events.
            <br />
            One story.

          </h2>


          <p>
            ChronoGraph detected temporal relationships
            between independent sources.
          </p>


          {/* =================================================
              SEQUENCE FLOW
          ================================================= */}

          <div className="sequence-flow">

            {sortedEvents.slice(0, 4).map(
              (event, index) => {

                return (

                  <button
                    type="button"
                    className="sequence-flow-item"
                    key={event.id || `sequence-${index}`}
                    onClick={() => inspectEvent(event)}
                  >

                    <span>
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <strong>
                      {event.title || "Event"}
                    </strong>

                    <small>
                      {event.source || "Unknown"}
                    </small>

                  </button>
                );
              }
            )}

          </div>


          {/* =================================================
              CONFIDENCE
          ================================================= */}

          <div className="confidence-box">

            <div>

              <span>
                SEQUENCE CONFIDENCE
              </span>

              <strong>
                87%
              </strong>

            </div>


            <div className="confidence-bar">

              <div
                style={{
                  width: "87%",
                }}
              />

            </div>

          </div>


          {/* =================================================
              INVESTIGATION BUTTON
          ================================================= */}

          <button
            type="button"
            className="investigate-button"
            onClick={openInvestigation}
          >

            Open investigation

            <ArrowRight size={15} />

          </button>

        </aside>

      </section>

    </main>
  );
}