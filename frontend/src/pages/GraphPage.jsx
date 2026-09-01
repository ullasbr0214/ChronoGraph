import { useState } from "react";
import {
  GitBranch,
  MessageSquare,
  Mail,
  Clock3,
  ShieldCheck,
  ArrowRight,
  X
} from "lucide-react";

import { events } from "../data/events";

const sourceIcons = {
  Slack: MessageSquare,
  GitHub: GitBranch,
  Email: Mail,
};

export default function GraphPage() {
  const [selectedEvent, setSelectedEvent] = useState(null);

  return (
    <main className="graph-page">

      {/* HEADER */}

      <section className="page-header">

        <div>
          <p className="eyebrow">
            TEMPORAL GRAPH
          </p>

          <h1>
            Evidence Network
          </h1>

          <p className="page-description">
            Explore how independent events connect across
            time, systems and evidence.
          </p>
        </div>

        <div className="graph-status">
          <span className="status-dot" />
          GRAPH SYNCHRONIZED
        </div>

      </section>


      {/* GRAPH WORKSPACE */}

      <section className="graph-workspace">

        {/* GRAPH */}

        <div className="graph-canvas">

          <div className="canvas-header">

            <div>
              <span className="eyebrow">
                CASE CG-2026-001
              </span>

              <h2>
                Infrastructure Migration
              </h2>
            </div>

            <div className="graph-controls">
              <button>−</button>
              <span>100%</span>
              <button>+</button>
            </div>

          </div>


          {/* GRAPH AREA */}

          <div className="network">

            {/* connection lines */}

            <div className="connection connection-one" />
            <div className="connection connection-two" />

            {/* timeline labels */}

            <span className="time-label time-one">
              10:30
            </span>

            <span className="time-label time-two">
              11:15
            </span>

            <span className="time-label time-three">
              12:05
            </span>


            {/* EVENTS */}

            {events.map((event, index) => {

              const Icon =
                sourceIcons[event.source] || GitBranch;

              return (
                <button
                  key={event.event_id}
                  className={`graph-node node-${index + 1} ${
                    selectedEvent?.event_id === event.event_id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => setSelectedEvent(event)}
                >

                  <div className="node-icon">
                    <Icon size={17} />
                  </div>

                  <div className="node-content">

                    <span>
                      {event.source}
                    </span>

                    <strong>
                      {event.title}
                    </strong>

                    <small>
                      {event.event_id}
                    </small>

                  </div>

                </button>
              );
            })}


            {/* CENTER SIGNAL */}

            <div className="graph-core">

              <div className="core-ring ring-one" />
              <div className="core-ring ring-two" />

              <div className="core-symbol">
                ◈
              </div>

            </div>

          </div>


          {/* LEGEND */}

          <div className="graph-legend">

            <span>
              <i className="legend-dot event-dot" />
              EVENT
            </span>

            <span>
              <i className="legend-line" />
              TEMPORAL RELATION
            </span>

            <span>
              <i className="legend-dot core-dot" />
              AI INFERENCE
            </span>

          </div>

        </div>


        {/* SIDE PANEL */}

        <aside className="graph-inspector">

          {selectedEvent ? (

            <>
              <div className="inspector-top">

                <span className="eyebrow">
                  SELECTED EVIDENCE
                </span>

                <button
                  className="close-button"
                  onClick={() => setSelectedEvent(null)}
                >
                  <X size={16} />
                </button>

              </div>


              <div className="selected-source">

                <div className="selected-icon">
                  {(() => {
                    const Icon =
                      sourceIcons[selectedEvent.source] ||
                      GitBranch;

                    return <Icon size={20} />;
                  })()}
                </div>

                <div>
                  <span>
                    {selectedEvent.source}
                  </span>

                  <strong>
                    {selectedEvent.event_id}
                  </strong>
                </div>

              </div>


              <h2>
                {selectedEvent.title}
              </h2>

              <p className="inspector-description">
                {selectedEvent.description}
              </p>


              <div className="inspector-data">

                <div>
                  <span>
                    <Clock3 size={13} />
                    TIMESTAMP
                  </span>

                  <strong>
                    {selectedEvent.timestamp}
                  </strong>
                </div>

                <div>
                  <span>
                    <ShieldCheck size={13} />
                    EVENT TYPE
                  </span>

                  <strong>
                    {selectedEvent.event_type}
                  </strong>
                </div>

              </div>


              <div className="evidence-confidence">

                <div>
                  <span>
                    EVIDENCE RELEVANCE
                  </span>

                  <strong>
                    94%
                  </strong>
                </div>

                <div className="confidence-bar">
                  <div style={{ width: "94%" }} />
                </div>

              </div>


              <button className="trace-button">
                Trace related events
                <ArrowRight size={15} />
              </button>

            </>

          ) : (

            <>

              <span className="eyebrow">
                GRAPH INTELLIGENCE
              </span>

              <div className="inspector-symbol">
                ◇
              </div>

              <h2>
                Select an
                <br />
                evidence node.
              </h2>

              <p>
                Select an event to inspect its source,
                timestamp, relevance and relationship
                to the wider incident sequence.
              </p>


              <div className="graph-summary">

                <div>
                  <strong>03</strong>
                  <span>EVENTS</span>
                </div>

                <div>
                  <strong>02</strong>
                  <span>LINKS</span>
                </div>

                <div>
                  <strong>87%</strong>
                  <span>CONFIDENCE</span>
                </div>

              </div>

            </>

          )}

        </aside>

      </section>

    </main>
  );
}