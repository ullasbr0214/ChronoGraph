import { useEffect, useRef, useState } from "react";

import {
  GitBranch,
  MessageSquare,
  Mail,
  Clock3,
  ShieldCheck,
  ArrowRight,
  X,
} from "lucide-react";

import { getEvents } from "../services/api";

const sourceIcons = {
  Slack: MessageSquare,
  GitHub: GitBranch,
  Email: Mail,

  "System Log": ShieldCheck,
  "Security Log": ShieldCheck,
  "Network Log": GitBranch,
  "Application Log": ShieldCheck,
};

export default function GraphPage() {
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [events, setEvents] = useState([]);
  const [relationships, setRelationships] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [connectionLines, setConnectionLines] = useState([]);

  // Reference to graph area
  const networkRef = useRef(null);

  /*
   * ============================================================
   * LOAD GRAPH DATA
   * ============================================================
   */

  useEffect(() => {
    async function loadGraph() {
      try {
        setIsLoading(true);
        setError("");

        const response = await getEvents();

        console.log(
          "GRAPH BACKEND RESPONSE:",
          JSON.stringify(response, null, 2)
        );

        /*
         * Backend can return:
         *
         * {
         *   success: true,
         *   count: 4,
         *   events: [...]
         * }
         *
         * OR:
         *
         * [...]
         */

        const backendEvents = Array.isArray(response)
          ? response
          : response?.events || [];

        /*
         * Sort events according to timestamp
         */

        const sortedEvents = [...backendEvents].sort(
          (a, b) =>
            new Date(a.timestamp) -
            new Date(b.timestamp)
        );

        setEvents(sortedEvents);

        /*
         * Create temporal relationships
         *
         * EVT-001 → EVT-002
         * EVT-002 → EVT-003
         * EVT-003 → EVT-004
         */

        const generatedRelationships =
          sortedEvents
            .slice(0, -1)
            .map((event, index) => ({
              source:
                event.id ||
                event.event_id,

              target:
                sortedEvents[index + 1].id ||
                sortedEvents[index + 1].event_id,
            }));

        setRelationships(
          generatedRelationships
        );

        console.log(
          "GRAPH EVENTS:",
          sortedEvents
        );

        console.log(
          "GRAPH RELATIONSHIPS:",
          generatedRelationships
        );
      } catch (error) {
        console.error(
          "Failed to load graph:",
          error
        );

        setError(
          error?.message ||
            "Failed to load graph data"
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadGraph();
  }, []);

  /*
   * ============================================================
   * CALCULATE CONNECTION LINES
   * ============================================================
   */

  useEffect(() => {
    if (
      !events.length ||
      !relationships.length
    ) {
      setConnectionLines([]);
      return;
    }

    const calculateConnections = () => {
      const network =
        networkRef.current;

      if (!network) return;

      const nodes =
        network.querySelectorAll(
          ".graph-node"
        );

      if (!nodes.length) return;

      const networkRect =
        network.getBoundingClientRect();

      const positions =
        Array.from(nodes).map(
          (node) => {
            const rect =
              node.getBoundingClientRect();

            return {
              x:
                rect.left -
                networkRect.left +
                rect.width / 2,

              y:
                rect.top -
                networkRect.top +
                rect.height / 2,
            };
          }
        );

      const lines =
        relationships
          .map(
            (
              relationship
            ) => {
              const sourceIndex =
                events.findIndex(
                  (event) =>
                    (event.id ||
                      event.event_id) ===
                    relationship.source
                );

              const targetIndex =
                events.findIndex(
                  (event) =>
                    (event.id ||
                      event.event_id) ===
                    relationship.target
                );

              if (
                sourceIndex === -1 ||
                targetIndex === -1
              ) {
                return null;
              }

              if (
                !positions[
                  sourceIndex
                ] ||
                !positions[
                  targetIndex
                ]
              ) {
                return null;
              }

              return {
                id:
                  `${relationship.source}-` +
                  `${relationship.target}`,

                x1:
                  positions[
                    sourceIndex
                  ].x,

                y1:
                  positions[
                    sourceIndex
                  ].y,

                x2:
                  positions[
                    targetIndex
                  ].x,

                y2:
                  positions[
                    targetIndex
                  ].y,
              };
            }
          )
          .filter(Boolean);

      setConnectionLines(lines);
    };

    /*
     * Wait until React finishes rendering
     */

    const timer =
      setTimeout(
        calculateConnections,
        100
      );

    /*
     * Recalculate on browser resize
     */

    window.addEventListener(
      "resize",
      calculateConnections
    );

    return () => {
      clearTimeout(timer);

      window.removeEventListener(
        "resize",
        calculateConnections
      );
    };
  }, [
    events,
    relationships,
  ]);

  /*
   * ============================================================
   * EVENT ICON
   * ============================================================
   */

  const getEventIcon = (
    source
  ) => {
    return (
      sourceIcons[source] ||
      GitBranch
    );
  };

  /*
   * ============================================================
   * GRAPH NODE POSITIONS
   * ============================================================
   */

  const nodePositions = [
    {
      left: "15%",
      top: "25%",
    },

    {
      left: "39%",
      top: "60%",
    },

    {
      left: "65%",
      top: "35%",
    },

    {
      left: "82%",
      top: "65%",
    },

    {
      left: "25%",
      top: "75%",
    },

    {
      left: "55%",
      top: "20%",
    },
  ];

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <main className="graph-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <section className="page-header">

        <div>
          <p className="eyebrow">
            TEMPORAL GRAPH
          </p>

          <h1>
            Evidence Network
          </h1>

          <p className="page-description">
            Explore how independent events
            connect across time, systems and
            evidence.
          </p>
        </div>

        <div className="graph-status">

          <span className="status-dot" />

          GRAPH SYNCHRONIZED

        </div>

      </section>


      {/* ======================================================
          WORKSPACE
      ====================================================== */}

      <section className="graph-workspace">


        {/* ====================================================
            GRAPH CANVAS
        ==================================================== */}

        <div className="graph-canvas">


          {/* CANVAS HEADER */}

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

              <button>
                −
              </button>

              <span>
                100%
              </span>

              <button>
                +
              </button>

            </div>

          </div>


          {/* ==================================================
              NETWORK
          ================================================== */}

          <div
            className="network"
            ref={networkRef}
          >


            {/* LOADING */}

            {isLoading && (
              <div className="graph-loading">
                Loading evidence graph...
              </div>
            )}


            {/* ERROR */}

            {error && (
              <div className="graph-error">
                {error}
              </div>
            )}


            {/* =================================================
                DYNAMIC CONNECTION LINES
            ================================================= */}

            <svg
              className="graph-connections"
              width="100%"
              height="100%"
              viewBox="0 0 1000 600"
              preserveAspectRatio="none"
            >

              {connectionLines.map(
                (line) => (
                  <line
                    key={line.id}
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    className="dynamic-connection"
                  />
                )
              )}

            </svg>


            {/* =================================================
                AI CORE
            ================================================= */}

            <div className="graph-core">

              <div className="core-ring ring-one" />

              <div className="core-ring ring-two" />

              <div className="core-symbol">
                ◈
              </div>

            </div>


            {/* =================================================
                EVENTS
            ================================================= */}

            {events.map(
              (
                event,
                index
              ) => {

                const Icon =
                  getEventIcon(
                    event.source
                  );

                const eventId =
                  event.id ||
                  event.event_id ||
                  `event-${index}`;

                const position =
                  nodePositions[
                    index
                  ] ||
                  {
                    left: "50%",
                    top: "50%",
                  };

                const selectedId =
                  selectedEvent
                    ? selectedEvent.id ||
                      selectedEvent.event_id
                    : null;

                const isSelected =
                  selectedId ===
                  eventId;

                return (

                  <button
                    key={eventId}
                    className={
                      `graph-node ${
                        isSelected
                          ? "selected"
                          : ""
                      }`
                    }
                    style={{
                      left:
                        position.left,

                      top:
                        position.top,
                    }}
                    onClick={() =>
                      setSelectedEvent(
                        event
                      )
                    }
                  >

                    {/* ICON */}

                    <div className="node-icon">

                      <Icon
                        size={17}
                      />

                    </div>


                    {/* CONTENT */}

                    <div className="node-content">

                      <span>
                        {event.source ||
                          "System"}
                      </span>

                      <strong>
                        {event.title ||
                          event.name ||
                          "Unknown Event"}
                      </strong>

                      <small>
                        {eventId}
                      </small>

                      <small className="node-time">

                        {event.timestamp
                          ? new Date(
                              event.timestamp
                            ).toLocaleTimeString(
                              [],
                              {
                                hour:
                                  "2-digit",

                                minute:
                                  "2-digit",

                                hour12:
                                  false,
                              }
                            )
                          : "--:--"}

                      </small>

                    </div>

                  </button>

                );
              }
            )}

          </div>


          {/* ==================================================
              LEGEND
          ================================================== */}

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


        {/* ====================================================
            INSPECTOR
        ==================================================== */}

        <aside className="graph-inspector">


          {selectedEvent ? (

            <>


              {/* INSPECTOR HEADER */}

              <div className="inspector-top">

                <span className="eyebrow">
                  SELECTED EVIDENCE
                </span>

                <button
                  className="close-button"
                  onClick={() =>
                    setSelectedEvent(
                      null
                    )
                  }
                >

                  <X size={16} />

                </button>

              </div>


              {/* SOURCE */}

              <div className="selected-source">

                <div className="selected-icon">

                  {(() => {

                    const Icon =
                      getEventIcon(
                        selectedEvent.source
                      );

                    return (
                      <Icon
                        size={20}
                      />
                    );

                  })()}

                </div>


                <div>

                  <span>
                    {selectedEvent.source ||
                      "System"}
                  </span>

                  <strong>
                    {selectedEvent.id ||
                      selectedEvent.event_id}
                  </strong>

                </div>

              </div>


              {/* TITLE */}

              <h2>

                {selectedEvent.title ||
                  selectedEvent.name ||
                  "Unknown Event"}

              </h2>


              {/* DESCRIPTION */}

              <p className="inspector-description">

                {selectedEvent.description ||
                  "No description available for this event."}

              </p>


              {/* EVENT DATA */}

              <div className="inspector-data">


                {/* TIMESTAMP */}

                <div>

                  <span>

                    <Clock3
                      size={13}
                    />

                    TIMESTAMP

                  </span>

                  <strong>

                    {selectedEvent.timestamp ||
                      "Unknown"}

                  </strong>

                </div>


                {/* EVENT TYPE */}

                <div>

                  <span>

                    <ShieldCheck
                      size={13}
                    />

                    EVENT TYPE

                  </span>

                  <strong>

                    {selectedEvent.event_type ||
                      "Evidence Event"}

                  </strong>

                </div>

              </div>


              {/* CONFIDENCE */}

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

                  <div
                    style={{
                      width:
                        "94%",
                    }}
                  />

                </div>

              </div>


              {/* TRACE */}

              <button className="trace-button">

                Trace related events

                <ArrowRight
                  size={15}
                />

              </button>

            </>

          ) : (

            <>


              {/* DEFAULT INSPECTOR */}

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

                Select an event to inspect
                its source, timestamp,
                relevance and relationship
                to the wider incident
                sequence.

              </p>


              {/* SUMMARY */}

              <div className="graph-summary">


                <div>

                  <strong>
                    {events.length}
                  </strong>

                  <span>
                    EVENTS
                  </span>

                </div>


                <div>

                  <strong>
                    {relationships.length}
                  </strong>

                  <span>
                    LINKS
                  </span>

                </div>


                <div>

                  <strong>
                    87%
                  </strong>

                  <span>
                    CONFIDENCE
                  </span>

                </div>


              </div>

            </>

          )}

        </aside>

      </section>

    </main>
  );
}