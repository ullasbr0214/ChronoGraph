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
  // ---------------------------------------
  // STATE
  // ---------------------------------------

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [connectionLines, setConnectionLines] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // ---------------------------------------
  // REFS
  // ---------------------------------------

  const networkRef = useRef(null);
  const nodeRefs = useRef([]);

  // ---------------------------------------
  // LOAD EVENTS FROM BACKEND
  // ---------------------------------------

  useEffect(() => {
    let mounted = true;

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
          Backend can return:

          {
            success: true,
            count: 4,
            events: [...]
          }

          OR:

          [...]
        */

        const backendEvents = Array.isArray(response)
          ? response
          : response?.events || [];

        // Sort events chronologically
        const sortedEvents = [...backendEvents].sort(
          (a, b) =>
            new Date(a.timestamp || 0) -
            new Date(b.timestamp || 0)
        );

        if (!mounted) return;

        setEvents(sortedEvents);

        // ---------------------------------------
        // CREATE TEMPORAL RELATIONSHIPS
        // ---------------------------------------

        const generatedRelationships = sortedEvents
          .slice(0, -1)
          .map((event, index) => {
            const sourceId =
              event.id || event.event_id;

            const targetEvent =
              sortedEvents[index + 1];

            const targetId =
              targetEvent?.id ||
              targetEvent?.event_id;

            return {
              id: `${sourceId}-${targetId}`,
              source: sourceId,
              target: targetId,
            };
          })
          .filter(
            (relationship) =>
              relationship.source &&
              relationship.target
          );

        setRelationships(generatedRelationships);

        console.log(
          "GRAPH EVENTS:",
          sortedEvents
        );

        console.log(
          "GRAPH RELATIONSHIPS:",
          generatedRelationships
        );
      } catch (err) {
        console.error(
          "Failed to load graph:",
          err
        );

        if (!mounted) return;

        setError(
          err?.message ||
            "Failed to load graph data"
        );
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadGraph();

    return () => {
      mounted = false;
    };
  }, []);

  // ---------------------------------------
  // CALCULATE SVG CONNECTION LINES
  // ---------------------------------------

  useEffect(() => {
    if (!events.length || !relationships.length) {
      setConnectionLines([]);
      return;
    }

    const calculateConnections = () => {
      const network = networkRef.current;

      if (!network) return;

      const networkRect =
        network.getBoundingClientRect();

      const positions = events.map(
        (_, index) => {
          const node =
            nodeRefs.current[index];

          if (!node) return null;

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

      const lines = relationships
        .map((relationship) => {
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

          const sourcePosition =
            positions[sourceIndex];

          const targetPosition =
            positions[targetIndex];

          if (
            !sourcePosition ||
            !targetPosition
          ) {
            return null;
          }

          return {
            id:
              relationship.id ||
              `${relationship.source}-${relationship.target}`,

            x1: sourcePosition.x,
            y1: sourcePosition.y,

            x2: targetPosition.x,
            y2: targetPosition.y,
          };
        })
        .filter(Boolean);

      setConnectionLines(lines);
    };

    // Give React time to finish rendering nodes
    const timer = setTimeout(
      calculateConnections,
      50
    );

    // Recalculate when window changes size
    window.addEventListener(
      "resize",
      calculateConnections
    );

    // Recalculate when graph container changes
    let resizeObserver;

    if (networkRef.current) {
      resizeObserver =
        new ResizeObserver(
          calculateConnections
        );

      resizeObserver.observe(
        networkRef.current
      );
    }

    return () => {
      clearTimeout(timer);

      window.removeEventListener(
        "resize",
        calculateConnections
      );

      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [events, relationships]);

  // ---------------------------------------
  // GRAPH NODE POSITIONS
  // ---------------------------------------

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
      left: "75%",
      top: "20%",
    },
  ];

  // ---------------------------------------
  // FORMAT TIME
  // ---------------------------------------

  const formatTime = (timestamp) => {
    if (!timestamp) {
      return "--:--";
    }

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return "--:--";
    }

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // ---------------------------------------
  // SELECT EVENT
  // ---------------------------------------

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
  };

  // ---------------------------------------
  // RENDER
  // ---------------------------------------

  return (
    <main className="graph-page">

      {/* =====================================
          HEADER
      ====================================== */}

      <section className="page-header">

        <div>
          <p className="eyebrow">
            TEMPORAL GRAPH
          </p>

          <h1>
            Evidence Network
          </h1>

          <p className="page-description">
            Explore how independent events connect
            across time, systems and evidence.
          </p>
        </div>

        <div className="graph-status">
          <span className="status-dot" />
          GRAPH SYNCHRONIZED
        </div>

      </section>


      {/* =====================================
          GRAPH WORKSPACE
      ====================================== */}

      <section className="graph-workspace">


        {/* ===================================
            GRAPH CANVAS
        ==================================== */}

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

              <button
                type="button"
                aria-label="Zoom out"
              >
                −
              </button>

              <span>
                100%
              </span>

              <button
                type="button"
                aria-label="Zoom in"
              >
                +
              </button>

            </div>

          </div>


          {/* =================================
              NETWORK
          ================================== */}

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

            {!isLoading && error && (
              <div className="graph-error">
                {error}
              </div>
            )}


            {/* =================================
                SVG CONNECTION LINES
            ================================== */}

            {!isLoading &&
              !error &&
              connectionLines.length > 0 && (

                <svg
                  className="graph-connections"
                  width="100%"
                  height="100%"
                  aria-hidden="true"
                >

                  <defs>

                    <linearGradient
                      id="connectionGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        stopColor="rgba(56,189,248,0.15)"
                      />

                      <stop
                        offset="50%"
                        stopColor="rgba(56,189,248,0.8)"
                      />

                      <stop
                        offset="100%"
                        stopColor="rgba(56,189,248,0.15)"
                      />
                    </linearGradient>

                  </defs>


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

              )}


            {/* =================================
                EVENTS
            ================================== */}

            {!isLoading &&
              !error &&
              events.map(
                (event, index) => {

                  const Icon =
                    sourceIcons[
                      event.source
                    ] || GitBranch;

                  const eventId =
                    event.id ||
                    event.event_id ||
                    `event-${index}`;

                  const position =
                    nodePositions[index] || {
                      left: "50%",
                      top: "50%",
                    };

                  const selectedId =
                    selectedEvent?.id ||
                    selectedEvent?.event_id;

                  const isSelected =
                    selectedId === eventId;

                  return (
                    <button
                      key={eventId}
                      ref={(element) => {
                        nodeRefs.current[
                          index
                        ] = element;
                      }}
                      type="button"
                      className={`graph-node ${
                        isSelected
                          ? "selected"
                          : ""
                      }`}
                      style={{
                        left: position.left,
                        top: position.top,
                      }}
                      onClick={() =>
                        handleSelectEvent(
                          event
                        )
                      }
                    >

                      {/* NODE ICON */}

                      <div className="node-icon">
                        <Icon size={17} />
                      </div>


                      {/* NODE CONTENT */}

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
                          {formatTime(
                            event.timestamp
                          )}
                        </small>

                      </div>

                    </button>
                  );
                }
              )}


            {/* =================================
                CENTER AI SIGNAL
            ================================== */}

            <div className="graph-core">

              <div className="core-ring ring-one" />

              <div className="core-ring ring-two" />

              <div className="core-symbol">
                ◈
              </div>

            </div>

          </div>


          {/* =================================
              LEGEND
          ================================== */}

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


        {/* =====================================
            INSPECTOR PANEL
        ====================================== */}

        <aside className="graph-inspector">

          {selectedEvent ? (

            <>

              {/* INSPECTOR HEADER */}

              <div className="inspector-top">

                <span className="eyebrow">
                  SELECTED EVIDENCE
                </span>

                <button
                  type="button"
                  className="close-button"
                  aria-label="Close event details"
                  onClick={() =>
                    setSelectedEvent(null)
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
                      sourceIcons[
                        selectedEvent.source
                      ] || GitBranch;

                    return (
                      <Icon size={20} />
                    );

                  })()}

                </div>


                <div>

                  <span>
                    {selectedEvent.source ||
                      "System"}
                  </span>

                  <strong>
                    {selectedEvent.event_id ||
                      selectedEvent.id ||
                      "Unknown ID"}
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
                  "No description available for this evidence event."}
              </p>


              {/* EVENT DATA */}

              <div className="inspector-data">


                {/* TIMESTAMP */}

                <div>

                  <span>
                    <Clock3 size={13} />
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
                    <ShieldCheck size={13} />
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
                      width: "94%",
                    }}
                  />

                </div>

              </div>


              {/* TRACE */}

              <button
                type="button"
                className="trace-button"
                onClick={() => {
                  console.log(
                    "Tracing event:",
                    selectedEvent
                  );
                }}
              >

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
                Select an event to inspect its
                source, timestamp, relevance and
                relationship to the wider incident
                sequence.
              </p>


              {/* GRAPH SUMMARY */}

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