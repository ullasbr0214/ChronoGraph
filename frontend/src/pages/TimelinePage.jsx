import { useEffect, useState } from "react";

import {
  MessageSquare,
  GitBranch,
  Mail,
  ArrowRight,
  Zap,
} from "lucide-react";

import { getEvents } from "../services/api";

const sourceIcons = {
  Slack: MessageSquare,
  GitHub: GitBranch,
  Email: Mail,
};

function formatTime(timestamp) {
  if (!timestamp) return "--:--";

  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(timestamp) {
  if (!timestamp) return "--";

  return new Date(timestamp).toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function TimelinePage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load events from backend
  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);
        setError("");

        const data = await getEvents();

        console.log("Events received from backend:", data);

        // Backend response should contain events
        setEvents(data.events || []);
      } catch (err) {
        console.error("Failed to load events:", err);
        setError(err.message || "Failed to load events");
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  const sortedEvents = [...events].sort(
    (a, b) =>
      new Date(a.timestamp) - new Date(b.timestamp)
  );

  const firstEvent = sortedEvents[0];
  const lastEvent = sortedEvents[sortedEvents.length - 1];

  return (
    <main className="timeline-page">

      {/* HEADER */}
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


      {/* TIMELINE SUMMARY */}
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


      {/* MAIN TIMELINE */}
      <section className="timeline-workspace">

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


          {/* LOADING */}
          {loading && (
            <div className="timeline-empty">

              <p>
                Loading events from Neo4j...
              </p>

            </div>
          )}


          {/* ERROR */}
          {!loading && error && (
            <div className="timeline-empty">

              <p>
                Failed to load events.
              </p>

              <small>
                {error}
              </small>

            </div>
          )}


          {/* NO EVENTS */}
          {!loading &&
            !error &&
            sortedEvents.length === 0 && (
              <div className="timeline-empty">

                <p>
                  No events found in Neo4j.
                </p>

              </div>
            )}


          {/* TIMELINE */}
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
                      key={event.id}
                    >

                      {/* TIME */}
                      <div className="timeline-time">

                        <strong>
                          {formatTime(event.timestamp)}
                        </strong>

                        <span>
                          {formatDate(event.timestamp)}
                        </span>

                      </div>


                      {/* LINE + NODE */}
                      <div className="timeline-marker">

                        <div className="timeline-node">

                          <Icon size={17} />

                        </div>

                        {index !==
                          sortedEvents.length - 1 && (
                          <div className="timeline-line" />
                        )}

                      </div>


                      {/* EVENT CARD */}
                      <div className="timeline-card">

                        <div className="timeline-card-top">

                          <div className="timeline-source">

                            <Icon size={14} />

                            <span>
                              {event.source || "Unknown"}
                            </span>

                          </div>

                          <span className="event-id">
                            {event.id}
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
  onClick={() =>
    window.location.href = `/investigation?event=${event.event_id}`
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


                {/* AI INFERENCE */}
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


        {/* RIGHT INSIGHT PANEL */}
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


          <div className="sequence-flow">

            {sortedEvents.slice(0, 3).map(
              (event, index) => {

                const Icon =
                  sourceIcons[event.source] || Zap;

                return (
                  <div key={event.id}>

                    <span>
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <strong>
                      {event.title || "Event"}
                    </strong>

                    <small>
                      {event.source || "Unknown"}
                    </small>

                  </div>
                );
              }
            )}

          </div>


          {/* CONFIDENCE */}
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


          <button className="investigate-button">

            Open investigation

            <ArrowRight size={15} />

          </button>

        </aside>

      </section>

    </main>
  );
}