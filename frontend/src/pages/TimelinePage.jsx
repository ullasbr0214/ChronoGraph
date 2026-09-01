import {
  MessageSquare,
  Github,
  Mail,
  Clock3,
  ArrowRight,
  Zap,
} from "lucide-react";

import { events } from "../data/events";

const sourceIcons = {
  Slack: MessageSquare,
  GitHub: Github,
  Email: Mail,
};

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function TimelinePage() {
  return (
    <main className="timeline-page">

      {/* HEADER */}
      <section className="page-header timeline-header">
        <div>
          <p className="eyebrow">TEMPORAL SEQUENCE</p>

          <h1>Incident Timeline</h1>

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
          <span>START</span>
          <strong>10:30</strong>
          <small>26 Aug 2026</small>
        </div>

        <div className="timeline-stat">
          <span>END</span>
          <strong>12:05</strong>
          <small>26 Aug 2026</small>
        </div>

        <div className="timeline-stat">
          <span>DURATION</span>
          <strong>01h 35m</strong>
          <small>Observed sequence</small>
        </div>

        <div className="timeline-stat highlight">
          <span>CONFIDENCE</span>
          <strong>87%</strong>
          <small>AI correlation</small>
        </div>

      </section>


      {/* MAIN TIMELINE */}
      <section className="timeline-workspace">

        <div className="timeline-panel">

          <div className="timeline-panel-header">
            <div>
              <p className="eyebrow">CASE CG-2026-001</p>
              <h2>Infrastructure Migration</h2>
            </div>

            <div className="timeline-filter">
              <span>ALL SOURCES</span>
              <span>3 EVENTS</span>
            </div>
          </div>


          {/* TIMELINE */}
          <div className="timeline">

            {events.map((event, index) => {

              const Icon =
                sourceIcons[event.source] || Zap;

              return (
                <div
                  className="timeline-event"
                  key={event.event_id}
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

                    {index !== events.length - 1 && (
                      <div className="timeline-line" />
                    )}

                  </div>


                  {/* EVENT CARD */}
                  <div className="timeline-card">

                    <div className="timeline-card-top">

                      <div className="timeline-source">
                        <Icon size={14} />

                        <span>
                          {event.source}
                        </span>
                      </div>

                      <span className="event-id">
                        {event.event_id}
                      </span>

                    </div>


                    <h3>
                      {event.title}
                    </h3>

                    <p>
                      {event.description}
                    </p>


                    <div className="timeline-card-bottom">

                      <span className="event-type">
                        {event.event_type}
                      </span>

                      <button>
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
                  A probable operational sequence was detected.
                </h3>

                <p>
                  The migration discussion was followed by an
                  infrastructure change and later confirmation.
                  The temporal relationship suggests these events
                  may belong to the same incident sequence.
                </p>
              </div>

              <div className="ai-score">
                <strong>87%</strong>
                <span>CONFIDENCE</span>
              </div>

            </div>

          </div>

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
            Three events.
            <br />
            One story.
          </h2>

          <p>
            ChronoGraph detected temporal relationships
            between independent sources.
          </p>


          <div className="sequence-flow">

            <div>
              <span>01</span>
              <strong>Discussion</strong>
              <small>Slack</small>
            </div>

            <ArrowRight size={15} />

            <div>
              <span>02</span>
              <strong>Change</strong>
              <small>GitHub</small>
            </div>

            <ArrowRight size={15} />

            <div>
              <span>03</span>
              <strong>Confirmation</strong>
              <small>Email</small>
            </div>

          </div>


          <div className="confidence-box">

            <div>
              <span>SEQUENCE CONFIDENCE</span>
              <strong>87%</strong>
            </div>

            <div className="confidence-bar">
              <div style={{ width: "87%" }} />
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