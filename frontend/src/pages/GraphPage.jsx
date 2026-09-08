import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  GitBranch,
  MessageSquare,
  Mail,
  Clock3,
  ShieldCheck,
  ArrowRight,
  X,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  AlertTriangle,
} from "lucide-react";

import { getGraph } from "../services/api";

const sourceIcons = {
  Slack: MessageSquare,
  GitHub: GitBranch,
  Email: Mail,
  "System Log": ShieldCheck,
  "Security Log": ShieldCheck,
  "Network Log": GitBranch,
  "Application Log": ShieldCheck,
};

const DEFAULT_POSITIONS = [
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
    top: "70%",
  },
  {
    left: "75%",
    top: "20%",
  },
];

function getEventId(event) {
  return event?.id || event?.event_id || null;
}

function formatTime(timestamp) {
  if (!timestamp) return "--:--";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDate(timestamp) {
  if (!timestamp) return "Unknown date";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(timestamp) {
  if (!timestamp) return "Unknown";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getSourceIcon(source) {
  return sourceIcons[source] || GitBranch;
}

function createTemporalRelationships(events) {
  if (!events || events.length < 2) {
    return [];
  }

  return events
    .slice(0, -1)
    .map((event, index) => {
      const source = getEventId(event);
      const target = getEventId(events[index + 1]);

      if (!source || !target) {
        return null;
      }

      return {
        source,
        target,
        relationship: "PRECEDES",
        generated: true,
      };
    })
    .filter(Boolean);
}

export default function GraphPage() {
  const networkRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [relationships, setRelationships] = useState([]);

  const [selectedEvent, setSelectedEvent] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [connectionLines, setConnectionLines] = useState([]);

  const [zoom, setZoom] = useState(100);

  /*
   * -------------------------------------------------------
   * LOAD GRAPH
   * -------------------------------------------------------
   */

  const loadGraph = useCallback(async () => {
    try {
      setError("");

      setIsLoading(true);
      setIsRefreshing(true);

      const response = await getGraph();

      console.log(
        "CHRONOGRAPH GRAPH RESPONSE:",
        JSON.stringify(response, null, 2)
      );

      const backendNodes = Array.isArray(response?.nodes)
        ? response.nodes
        : [];

      const backendRelationships = Array.isArray(
        response?.relationships
      )
        ? response.relationships
        : [];

      /*
       * Sort nodes chronologically.
       */
      const sortedEvents = [...backendNodes].sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();

        return (
          (Number.isNaN(dateA) ? 0 : dateA) -
          (Number.isNaN(dateB) ? 0 : dateB)
        );
      });

      /*
       * If Neo4j has relationships, use them.
       *
       * If there are no relationships yet, create temporal
       * PRECEDES relationships between consecutive events.
       *
       * This keeps the graph useful even before explicit
       * Neo4j relationships are created.
       */
      const validBackendRelationships =
        backendRelationships
          .map((relationship) => ({
            source:
              relationship.source ||
              relationship.from ||
              relationship.from_id,

            target:
              relationship.target ||
              relationship.to ||
              relationship.to_id,

            relationship:
              relationship.relationship ||
              "RELATED_TO",
          }))
          .filter(
            (relationship) =>
              relationship.source &&
              relationship.target
          );

      const finalRelationships =
        validBackendRelationships.length > 0
          ? validBackendRelationships
          : createTemporalRelationships(sortedEvents);

      setEvents(sortedEvents);
      setRelationships(finalRelationships);

      console.log(
        "GRAPH NODES:",
        sortedEvents
      );

      console.log(
        "GRAPH RELATIONSHIPS:",
        finalRelationships
      );

      /*
       * Keep selected event synchronized with refreshed data.
       */
      setSelectedEvent((previousSelected) => {
        if (!previousSelected) {
          return null;
        }

        const selectedId = getEventId(previousSelected);

        return (
          sortedEvents.find(
            (event) => getEventId(event) === selectedId
          ) || null
        );
      });
    } catch (err) {
      console.error(
        "Failed to load ChronoGraph:",
        err
      );

      setError(
        err?.message ||
          "Failed to load graph data."
      );

      setEvents([]);
      setRelationships([]);
    } finally {
      setIsLoading(false);

      /*
       * Small delay keeps refresh animation visible.
       */
      setTimeout(() => {
        setIsRefreshing(false);
      }, 250);
    }
  }, []);

  /*
   * Initial graph load.
   */

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  /*
   * -------------------------------------------------------
   * GRAPH NODE POSITIONS
   * -------------------------------------------------------
   */

  const eventPositions = useMemo(() => {
    return events.map((event, index) => {
      return (
        DEFAULT_POSITIONS[index] || {
          left: `${50 + ((index * 17) % 35) - 17}%`,
          top: `${25 + ((index * 29) % 50)}%`,
        }
      );
    });
  }, [events]);

  /*
   * -------------------------------------------------------
   * CALCULATE SVG CONNECTIONS
   * -------------------------------------------------------
   */

  const calculateConnections = useCallback(() => {
    const network = networkRef.current;

    if (!network || !events.length) {
      setConnectionLines([]);
      return;
    }

    const nodes = network.querySelectorAll(
      ".graph-node"
    );

    if (!nodes.length) {
      setConnectionLines([]);
      return;
    }

    const networkRect =
      network.getBoundingClientRect();

    const positions = Array.from(nodes).map(
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

    const lines = relationships
      .map((relationship, relationshipIndex) => {
        const sourceId =
          relationship.source ||
          relationship.from ||
          relationship.from_id;

        const targetId =
          relationship.target ||
          relationship.to ||
          relationship.to_id;

        const sourceIndex =
          events.findIndex(
            (event) =>
              getEventId(event) === sourceId
          );

        const targetIndex =
          events.findIndex(
            (event) =>
              getEventId(event) === targetId
          );

        if (
          sourceIndex === -1 ||
          targetIndex === -1 ||
          !positions[sourceIndex] ||
          !positions[targetIndex]
        ) {
          return null;
        }

        return {
          id:
            `${sourceId}-${targetId}-${relationshipIndex}`,

          x1: positions[sourceIndex].x,
          y1: positions[sourceIndex].y,

          x2: positions[targetIndex].x,
          y2: positions[targetIndex].y,

          relationship:
            relationship.relationship ||
            "RELATED_TO",

          generated:
            relationship.generated || false,
        };
      })
      .filter(Boolean);

    setConnectionLines(lines);
  }, [events, relationships]);

  /*
   * Recalculate graph lines after rendering.
   */

  useEffect(() => {
    if (!events.length) {
      setConnectionLines([]);
      return;
    }

    let frameId;

    const update = () => {
      cancelAnimationFrame(frameId);

      frameId = requestAnimationFrame(() => {
        calculateConnections();
      });
    };

    update();

    window.addEventListener(
      "resize",
      update
    );

    const network =
      networkRef.current;

    let resizeObserver;

    if (
      network &&
      typeof ResizeObserver !== "undefined"
    ) {
      resizeObserver =
        new ResizeObserver(update);

      resizeObserver.observe(network);
    }

    return () => {
      cancelAnimationFrame(frameId);

      window.removeEventListener(
        "resize",
        update
      );

      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [
    events,
    relationships,
    calculateConnections,
  ]);

  /*
   * Recalculate after zoom changes.
   */

  useEffect(() => {
    const timer = setTimeout(() => {
      calculateConnections();
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [zoom, calculateConnections]);

  /*
   * -------------------------------------------------------
   * ZOOM CONTROLS
   * -------------------------------------------------------
   */

  const handleZoomOut = () => {
    setZoom((current) =>
      Math.max(50, current - 10)
    );
  };

  const handleZoomIn = () => {
    setZoom((current) =>
      Math.min(150, current + 10)
    );
  };

  /*
   * -------------------------------------------------------
   * SELECT EVENT
   * -------------------------------------------------------
   */

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
  };

  /*
   * -------------------------------------------------------
   * RELATED EVENTS COUNT
   * -------------------------------------------------------
   */

  const selectedRelatedEvents = useMemo(() => {
    if (!selectedEvent) {
      return [];
    }

    const selectedId =
      getEventId(selectedEvent);

    const relatedIds = new Set();

    relationships.forEach(
      (relationship) => {
        const source =
          relationship.source;

        const target =
          relationship.target;

        if (source === selectedId) {
          relatedIds.add(target);
        }

        if (target === selectedId) {
          relatedIds.add(source);
        }
      }
    );

    return events.filter((event) =>
      relatedIds.has(
        getEventId(event)
      )
    );
  }, [
    selectedEvent,
    relationships,
    events,
  ]);

  /*
   * -------------------------------------------------------
   * CONFIDENCE
   * -------------------------------------------------------
   */

  const graphConfidence = useMemo(() => {
    if (!events.length) {
      return 0;
    }

    if (!relationships.length) {
      return 50;
    }

    const ratio =
      relationships.length /
      Math.max(events.length - 1, 1);

    return Math.min(
      98,
      Math.round(70 + ratio * 20)
    );
  }, [
    events.length,
    relationships.length,
  ]);

  /*
   * -------------------------------------------------------
   * RENDER
   * -------------------------------------------------------
   */

  return (
    <main className="graph-page">

      {/* =================================================
          HEADER
      ================================================= */}

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

          {isLoading
            ? "SYNCHRONIZING GRAPH"
            : "GRAPH SYNCHRONIZED"}

        </div>

      </section>


      {/* =================================================
          GRAPH WORKSPACE
      ================================================= */}

      <section className="graph-workspace">

        {/* =================================================
            GRAPH CANVAS
        ================================================= */}

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
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                aria-label="Zoom out"
                title="Zoom out"
              >
                <ZoomOut size={15} />
              </button>

              <span>
                {zoom}%
              </span>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 150}
                aria-label="Zoom in"
                title="Zoom in"
              >
                <ZoomIn size={15} />
              </button>

              <button
                type="button"
                onClick={loadGraph}
                disabled={isRefreshing}
                aria-label="Refresh graph"
                title="Refresh graph"
              >
                <RefreshCw
                  size={15}
                  className={
                    isRefreshing
                      ? "refresh-spinning"
                      : ""
                  }
                />
              </button>

            </div>

          </div>


          {/* =================================================
              NETWORK
          ================================================= */}

          <div
            className="network"
            ref={networkRef}
          >

            {/* LOADING */}

            {isLoading && (
              <div className="graph-loading">
                <RefreshCw
                  size={18}
                  className="refresh-spinning"
                />

                <span>
                  Loading evidence graph...
                </span>
              </div>
            )}


            {/* ERROR */}

            {!isLoading && error && (
              <div className="graph-error">

                <AlertTriangle size={18} />

                <div>
                  <strong>
                    Unable to load graph
                  </strong>

                  <span>
                    {error}
                  </span>

                  <button
                    type="button"
                    onClick={loadGraph}
                  >
                    Try again
                  </button>
                </div>

              </div>
            )}


            {/* EMPTY */}

            {!isLoading &&
              !error &&
              events.length === 0 && (
                <div className="graph-loading">

                  <ShieldCheck size={20} />

                  <span>
                    No evidence events found.
                  </span>

                </div>
              )}


            {/* =================================================
                SVG CONNECTIONS
            ================================================= */}

            {!isLoading &&
              events.length > 0 && (
                <svg
                  className="graph-connections"
                  width="100%"
                  height="100%"
                  viewBox="0 0 1000 600"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >

                  {connectionLines.map(
                    (line) => (
                      <line
                        key={line.id}
                        x1={
                          (line.x1 /
                            Math.max(
                              networkRef.current
                                ?.clientWidth ||
                                1000,
                              1
                            )) *
                          1000
                        }
                        y1={
                          (line.y1 /
                            Math.max(
                              networkRef.current
                                ?.clientHeight ||
                                600,
                              1
                            )) *
                          600
                        }
                        x2={
                          (line.x2 /
                            Math.max(
                              networkRef.current
                                ?.clientWidth ||
                                1000,
                              1
                            )) *
                          1000
                        }
                        y2={
                          (line.y2 /
                            Math.max(
                              networkRef.current
                                ?.clientHeight ||
                                600,
                              1
                            )) *
                          600
                        }
                        className="dynamic-connection"
                      />
                    )
                  )}

                </svg>
              )}


            {/* =================================================
                EVENTS
            ================================================= */}

            {!isLoading &&
              events.map(
                (event, index) => {

                  const Icon =
                    getSourceIcon(
                      event.source
                    );

                  const eventId =
                    getEventId(event);

                  const position =
                    eventPositions[index];

                  const isSelected =
                    selectedEvent &&
                    getEventId(
                      selectedEvent
                    ) === eventId;

                  return (
                    <button
                      type="button"
                      key={
                        eventId ||
                        `event-${index}`
                      }
                      className={`graph-node ${
                        isSelected
                          ? "selected"
                          : ""
                      }`}
                      style={{
                        left:
                          position.left,
                        top:
                          position.top,
                        transform: `translate(-50%, -50%) scale(${
                          zoom / 100
                        })`,
                      }}
                      onClick={() =>
                        handleSelectEvent(
                          event
                        )
                      }
                    >

                      <div className="node-icon">
                        <Icon size={17} />
                      </div>

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
                          {eventId ||
                            "NO-ID"}
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


            {/* =================================================
                CENTER AI CORE
            ================================================= */}

            {!isLoading &&
              events.length > 0 && (
                <div className="graph-core">

                  <div className="core-ring ring-one" />

                  <div className="core-ring ring-two" />

                  <div className="core-symbol">
                    ◈
                  </div>

                </div>
              )}

          </div>


          {/* =================================================
              LEGEND
          ================================================= */}

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


        {/* =================================================
            SIDE INSPECTOR
        ================================================= */}

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
                  onClick={() =>
                    setSelectedEvent(
                      null
                    )
                  }
                  aria-label="Close event details"
                >
                  <X size={16} />
                </button>

              </div>


              {/* SOURCE */}

              <div className="selected-source">

                <div className="selected-icon">

                  {(() => {
                    const Icon =
                      getSourceIcon(
                        selectedEvent.source
                      );

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
                    {getEventId(
                      selectedEvent
                    ) || "NO-ID"}
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
                  "No description is available for this evidence event."}
              </p>


              {/* EVENT DATA */}

              <div className="inspector-data">

                <div>

                  <span>
                    <Clock3 size={13} />
                    TIMESTAMP
                  </span>

                  <strong>
                    {formatDateTime(
                      selectedEvent.timestamp
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    <ShieldCheck size={13} />
                    EVENT TYPE
                  </span>

                  <strong>
                    {selectedEvent.event_type ||
                      selectedEvent.type ||
                      "Evidence Event"}
                  </strong>

                </div>


                <div>

                  <span>
                    <GitBranch size={13} />
                    RELATED EVENTS
                  </span>

                  <strong>
                    {
                      selectedRelatedEvents.length
                    }
                  </strong>

                </div>

              </div>


              {/* RELEVANCE */}

              <div className="evidence-confidence">

                <div>

                  <span>
                    EVIDENCE RELEVANCE
                  </span>

                  <strong>
                    {graphConfidence}%
                  </strong>

                </div>

                <div className="confidence-bar">

                  <div
                    style={{
                      width: `${graphConfidence}%`,
                    }}
                  />

                </div>

              </div>


              {/* RELATIONSHIP INFORMATION */}

              {selectedRelatedEvents.length >
                0 && (

                <div className="selected-relationships">

                  <span className="eyebrow">
                    CONNECTED EVIDENCE
                  </span>

                  <div className="related-event-list">

                    {selectedRelatedEvents
                      .slice(0, 4)
                      .map((relatedEvent) => {

                        const RelatedIcon =
                          getSourceIcon(
                            relatedEvent.source
                          );

                        return (
                          <button
                            type="button"
                            key={
                              getEventId(
                                relatedEvent
                              )
                            }
                            onClick={() =>
                              handleSelectEvent(
                                relatedEvent
                              )
                            }
                            className="related-event"
                          >

                            <div>
                              <RelatedIcon
                                size={15}
                              />
                            </div>

                            <span>
                              {relatedEvent.title ||
                                relatedEvent.name ||
                                "Unknown Event"}
                            </span>

                            <ArrowRight
                              size={14}
                            />

                          </button>
                        );
                      })}

                  </div>

                </div>
              )}


              {/* TRACE BUTTON */}

              <button
                type="button"
                className="trace-button"
                onClick={() => {
                  if (
                    selectedRelatedEvents.length >
                    0
                  ) {
                    handleSelectEvent(
                      selectedRelatedEvents[0]
                    );
                  }
                }}
              >
                Trace related events

                <ArrowRight size={15} />

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
                    {graphConfidence}%
                  </strong>

                  <span>
                    CONFIDENCE
                  </span>

                </div>

              </div>


              {/* GRAPH CONNECTION STATUS */}

              <div className="graph-inspector-status">

                <ShieldCheck size={16} />

                <span>
                  Neo4j graph connected
                </span>

              </div>

            </>

          )}

        </aside>

      </section>

    </main>
  );
}