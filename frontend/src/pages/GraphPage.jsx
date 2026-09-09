import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
  Server,
  Network,
} from "lucide-react";

import { getGraph } from "../services/api";

/* =========================================================
   SOURCE ICONS
========================================================= */

const sourceIcons = {
  slack: MessageSquare,
  github: GitBranch,
  email: Mail,
  "system log": Server,
  "security log": ShieldCheck,
  "network log": Network,
  "application log": Server,
};

/* =========================================================
   DEFAULT NODE POSITIONS
========================================================= */

const DEFAULT_POSITIONS = [
  { left: "14%", top: "25%" },
  { left: "38%", top: "60%" },
  { left: "65%", top: "34%" },
  { left: "83%", top: "64%" },
  { left: "24%", top: "72%" },
  { left: "75%", top: "19%" },
  { left: "50%", top: "20%" },
  { left: "55%", top: "78%" },
];

/* =========================================================
   HELPERS
========================================================= */

function getEventId(event) {
  return event?.id || event?.event_id || null;
}

function getSourceIcon(source) {
  const normalized = String(source || "")
    .trim()
    .toLowerCase();

  return sourceIcons[normalized] || GitBranch;
}

function formatTime(timestamp) {
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
}

function formatDateTime(timestamp) {
  if (!timestamp) {
    return "Unknown";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return String(timestamp);
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

/* =========================================================
   NORMALIZE BACKEND RELATIONSHIPS

   Backend currently returns:

   {
     source,
     target,
     relationship
   }

   This also accepts from_id / to_id for compatibility.
========================================================= */

function normalizeRelationships(relationships) {
  if (!Array.isArray(relationships)) {
    return [];
  }

  return relationships
    .map((relationship) => {
      const source =
        relationship?.source ??
        relationship?.from ??
        relationship?.from_id ??
        null;

      const target =
        relationship?.target ??
        relationship?.to ??
        relationship?.to_id ??
        null;

      const relationshipType =
        relationship?.relationship ??
        relationship?.type ??
        "RELATED_TO";

      if (!source || !target) {
        return null;
      }

      return {
        source: String(source),
        target: String(target),
        relationship: String(relationshipType),
        generated: false,
      };
    })
    .filter(Boolean);
}

/* =========================================================
   GRAPH PAGE
========================================================= */

export default function GraphPage() {
  const networkRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [relationships, setRelationships] = useState([]);

  const [selectedEvent, setSelectedEvent] = useState(null);

  const [connectionLines, setConnectionLines] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [zoom, setZoom] = useState(100);

  /* =======================================================
     LOAD GRAPH
  ======================================================= */

  const loadGraph = useCallback(async () => {
    try {
      setError("");

      setIsLoading(true);
      setIsRefreshing(true);

      const response = await getGraph();

      console.log(
        "CHRONOGRAPH GRAPH RESPONSE:",
        response
      );

      const backendNodes = Array.isArray(
        response?.nodes
      )
        ? response.nodes
        : [];

      const backendRelationships = Array.isArray(
        response?.relationships
      )
        ? response.relationships
        : [];

      /* ---------------------------------------------------
         SORT EVENTS CHRONOLOGICALLY
      --------------------------------------------------- */

      const sortedEvents = [...backendNodes].sort(
        (a, b) => {
          const timeA = new Date(
            a?.timestamp
          ).getTime();

          const timeB = new Date(
            b?.timestamp
          ).getTime();

          if (Number.isNaN(timeA)) {
            return 1;
          }

          if (Number.isNaN(timeB)) {
            return -1;
          }

          return timeA - timeB;
        }
      );

      /* ---------------------------------------------------
         USE ONLY REAL NEO4J RELATIONSHIPS
      --------------------------------------------------- */

      const normalizedRelationships =
        normalizeRelationships(
          backendRelationships
        );

      setEvents(sortedEvents);

      setRelationships(
        normalizedRelationships
      );

      /* ---------------------------------------------------
         KEEP SELECTED EVENT AFTER REFRESH
      --------------------------------------------------- */

      setSelectedEvent(
        (previousSelected) => {
          if (!previousSelected) {
            return null;
          }

          const selectedId =
            getEventId(previousSelected);

          return (
            sortedEvents.find(
              (event) =>
                getEventId(event) ===
                selectedId
            ) || null
          );
        }
      );

      console.log(
        "GRAPH NODES:",
        sortedEvents
      );

      console.log(
        "GRAPH RELATIONSHIPS:",
        normalizedRelationships
      );
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
      setConnectionLines([]);
      setSelectedEvent(null);
    } finally {
      setIsLoading(false);

      setTimeout(() => {
        setIsRefreshing(false);
      }, 250);
    }
  }, []);

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  /* =======================================================
     NODE POSITIONS
  ======================================================= */

  const eventPositions = useMemo(() => {
    return events.map((event, index) => {
      if (DEFAULT_POSITIONS[index]) {
        return DEFAULT_POSITIONS[index];
      }

      const left =
        12 + ((index * 21) % 76);

      const top =
        18 + ((index * 29) % 64);

      return {
        left: `${left}%`,
        top: `${top}%`,
      };
    });
  }, [events]);

  /* =======================================================
     CALCULATE CONNECTIONS

     Nodes and SVG use the same graph coordinate system.
  ======================================================= */

  const calculateConnections = useCallback(() => {
    const network = networkRef.current;

    if (!network || !events.length) {
      setConnectionLines([]);
      return;
    }

    const nodes = Array.from(
      network.querySelectorAll(
        ".graph-node"
      )
    );

    if (!nodes.length) {
      setConnectionLines([]);
      return;
    }

    const networkRect =
      network.getBoundingClientRect();

    if (
      networkRect.width === 0 ||
      networkRect.height === 0
    ) {
      return;
    }

    const positions = nodes.map(
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
      .map(
        (
          relationship,
          relationshipIndex
        ) => {
          const sourceId =
            relationship?.source;

          const targetId =
            relationship?.target;

          if (
            !sourceId ||
            !targetId
          ) {
            return null;
          }

          const sourceIndex =
            events.findIndex(
              (event) =>
                String(
                  getEventId(event)
                ) === String(sourceId)
            );

          const targetIndex =
            events.findIndex(
              (event) =>
                String(
                  getEventId(event)
                ) === String(targetId)
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
            id: `${sourceId}-${targetId}-${relationshipIndex}`,

            x1: sourcePosition.x,
            y1: sourcePosition.y,

            x2: targetPosition.x,
            y2: targetPosition.y,

            relationship:
              relationship.relationship ||
              "RELATED_TO",

            generated: false,
          };
        }
      )
      .filter(Boolean);

    setConnectionLines(lines);
  }, [
    events,
    relationships,
  ]);

  /* =======================================================
     RECALCULATE CONNECTIONS
  ======================================================= */

  useEffect(() => {
    if (!events.length) {
      setConnectionLines([]);
      return;
    }

    let frameId;

    const updateConnections = () => {
      cancelAnimationFrame(frameId);

      frameId =
        requestAnimationFrame(() => {
          calculateConnections();
        });
    };

    updateConnections();

    window.addEventListener(
      "resize",
      updateConnections
    );

    const network =
      networkRef.current;

    let resizeObserver = null;

    if (
      network &&
      typeof ResizeObserver !==
        "undefined"
    ) {
      resizeObserver =
        new ResizeObserver(
          updateConnections
        );

      resizeObserver.observe(network);
    }

    return () => {
      cancelAnimationFrame(frameId);

      window.removeEventListener(
        "resize",
        updateConnections
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

  /* =======================================================
     RECALCULATE AFTER ZOOM
  ======================================================= */

  useEffect(() => {
    const timer = setTimeout(
      () => {
        calculateConnections();
      },
      200
    );

    return () => {
      clearTimeout(timer);
    };
  }, [
    zoom,
    calculateConnections,
  ]);

  /* =======================================================
     ZOOM CONTROLS
  ======================================================= */

  const handleZoomOut = () => {
    setZoom((current) =>
      Math.max(
        50,
        current - 10
      )
    );
  };

  const handleZoomIn = () => {
    setZoom((current) =>
      Math.min(
        150,
        current + 10
      )
    );
  };

  const handleResetZoom = () => {
    setZoom(100);
  };

  /* =======================================================
     SELECT EVENT
  ======================================================= */

  const handleSelectEvent = (
    event
  ) => {
    setSelectedEvent(event);
  };

  /* =======================================================
     SELECTED RELATED EVENTS
  ======================================================= */

  const selectedRelatedEvents =
    useMemo(() => {
      if (!selectedEvent) {
        return [];
      }

      const selectedId =
        getEventId(
          selectedEvent
        );

      if (!selectedId) {
        return [];
      }

      const relatedIds =
        new Set();

      relationships.forEach(
        (relationship) => {
          const source =
            relationship?.source;

          const target =
            relationship?.target;

          if (
            String(source) ===
            String(selectedId)
          ) {
            relatedIds.add(
              String(target)
            );
          }

          if (
            String(target) ===
            String(selectedId)
          ) {
            relatedIds.add(
              String(source)
            );
          }
        }
      );

      return events.filter(
        (event) =>
          relatedIds.has(
            String(
              getEventId(event)
            )
          )
      );
    }, [
      selectedEvent,
      relationships,
      events,
    ]);

  /* =======================================================
     SELECTED RELATIONSHIPS
  ======================================================= */

  const selectedRelationships =
    useMemo(() => {
      if (!selectedEvent) {
        return [];
      }

      const selectedId =
        getEventId(
          selectedEvent
        );

      return relationships.filter(
        (relationship) => {
          return (
            String(
              relationship.source
            ) === String(selectedId) ||
            String(
              relationship.target
            ) === String(selectedId)
          );
        }
      );
    }, [
      selectedEvent,
      relationships,
    ]);

  /* =======================================================
     GRAPH CONFIDENCE

     UI metric only for now.
  ======================================================= */

  const graphConfidence =
    useMemo(() => {
      if (!events.length) {
        return 0;
      }

      if (!relationships.length) {
        return 50;
      }

      const possibleLinks =
        Math.max(
          events.length - 1,
          1
        );

      const ratio =
        relationships.length /
        possibleLinks;

      return Math.min(
        98,
        Math.round(
          70 + ratio * 20
        )
      );
    }, [
      events.length,
      relationships.length,
    ]);

  /* =======================================================
     GRAPH STATUS
  ======================================================= */

  const graphStatusText =
    isLoading
      ? "SYNCHRONIZING GRAPH"
      : error
      ? "GRAPH ERROR"
      : "GRAPH SYNCHRONIZED";

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="graph-page">

      {/* =================================================
          PAGE HEADER
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
            Explore how independent
            events connect across time,
            systems and evidence.
          </p>

        </div>

        <div className="graph-status">

          <span
            className={`status-dot ${
              error
                ? "status-error"
                : ""
            }`}
          />

          {graphStatusText}

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


            {/* GRAPH CONTROLS */}

            <div className="graph-controls">

              <button
                type="button"
                onClick={
                  handleZoomOut
                }
                disabled={
                  zoom <= 50
                }
                aria-label="Zoom out"
                title="Zoom out"
              >
                <ZoomOut size={15} />
              </button>


              <button
                type="button"
                className="zoom-value"
                onClick={
                  handleResetZoom
                }
                title="Reset zoom"
              >
                {zoom}%
              </button>


              <button
                type="button"
                onClick={
                  handleZoomIn
                }
                disabled={
                  zoom >= 150
                }
                aria-label="Zoom in"
                title="Zoom in"
              >
                <ZoomIn size={15} />
              </button>


              <button
                type="button"
                onClick={
                  loadGraph
                }
                disabled={
                  isRefreshing
                }
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

            {!isLoading &&
              error && (
                <div className="graph-error">

                  <AlertTriangle
                    size={18}
                  />

                  <div>

                    <strong>
                      Unable to load graph
                    </strong>

                    <span>
                      {error}
                    </span>

                    <button
                      type="button"
                      onClick={
                        loadGraph
                      }
                    >
                      Try again
                    </button>

                  </div>

                </div>
              )}


            {/* EMPTY */}

            {!isLoading &&
              !error &&
              events.length ===
                0 && (
                <div className="graph-loading">

                  <ShieldCheck
                    size={20}
                  />

                  <span>
                    No evidence events found.
                  </span>

                </div>
              )}


            {/* =================================================
                GRAPH VISUAL LAYER
            ================================================= */}

            {!isLoading &&
              !error &&
              events.length > 0 && (
                <div
                  className="graph-visual-layer"
                  style={{
                    position:
                      "absolute",
                    inset: 0,
                    transform:
                      `scale(${zoom / 100})`,
                    transformOrigin:
                      "center center",
                    transition:
                      "transform 180ms ease",
                  }}
                >

                  {/* SVG CONNECTIONS */}

                  <svg
                    className="graph-connections"
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${
                      networkRef.current?.clientWidth ||
                      1000
                    } ${
                      networkRef.current?.clientHeight ||
                      600
                    }`}
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >

                    <defs>

                      <marker
                        id="graph-arrow"
                        markerWidth="8"
                        markerHeight="8"
                        refX="7"
                        refY="4"
                        orient="auto"
                      >
                        <path
                          d="M0,0 L8,4 L0,8"
                          fill="none"
                        />
                      </marker>

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
                          markerEnd="url(#graph-arrow)"
                        />
                      )
                    )}

                  </svg>


                  {/* =================================================
                      EVENTS
                  ================================================= */}

                  {events.map(
                    (
                      event,
                      index
                    ) => {
                      const Icon =
                        getSourceIcon(
                          event?.source
                        );

                      const eventId =
                        getEventId(
                          event
                        );

                      const position =
                        eventPositions[
                          index
                        ] || {
                          left: "50%",
                          top: "50%",
                        };

                      const isSelected =
                        selectedEvent &&
                        String(
                          getEventId(
                            selectedEvent
                          )
                        ) ===
                          String(
                            eventId
                          );

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
                            transform:
                              "translate(-50%, -50%)",
                          }}
                          onClick={() =>
                            handleSelectEvent(
                              event
                            )
                          }
                        >

                          <div className="node-icon">

                            <Icon
                              size={17}
                            />

                          </div>


                          <div className="node-content">

                            <span>
                              {event?.source ||
                                "System"}
                            </span>

                            <strong>
                              {event?.title ||
                                event?.name ||
                                "Unknown Event"}
                            </strong>

                            <small>
                              {eventId ||
                                "NO-ID"}
                            </small>

                            <small className="node-time">
                              {formatTime(
                                event?.timestamp
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

                  <div className="graph-core">

                    <div className="core-ring ring-one" />

                    <div className="core-ring ring-two" />

                    <div className="core-symbol">
                      ◈
                    </div>

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
                  title="Close"
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
                        selectedEvent?.source
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
                    {selectedEvent?.source ||
                      "System"}
                  </span>

                  <strong>
                    {getEventId(
                      selectedEvent
                    ) ||
                      "NO-ID"}
                  </strong>

                </div>

              </div>


              {/* TITLE */}

              <h2>
                {selectedEvent?.title ||
                  selectedEvent?.name ||
                  "Unknown Event"}
              </h2>


              {/* DESCRIPTION */}

              <p className="inspector-description">
                {selectedEvent?.description ||
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
                      selectedEvent?.timestamp
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    <ShieldCheck size={13} />
                    EVENT TYPE
                  </span>

                  <strong>
                    {selectedEvent?.event_type ||
                      selectedEvent?.type ||
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
                      width:
                        `${graphConfidence}%`,
                    }}
                  />

                </div>

              </div>


              {/* RELATIONSHIPS */}

              {selectedRelationships.length >
                0 && (
                <div className="selected-relationships">

                  <span className="eyebrow">
                    RELATIONSHIPS
                  </span>

                  <div className="relationship-type-list">

                    {selectedRelationships
                      .slice(0, 8)
                      .map(
                        (
                          relationship,
                          index
                        ) => (
                          <div
                            key={`${relationship.source}-${relationship.target}-${index}`}
                            className="relationship-type"
                          >

                            <GitBranch
                              size={14}
                            />

                            <span>
                              {relationship.relationship ||
                                "RELATED_TO"}
                            </span>

                          </div>
                        )
                      )}

                  </div>

                </div>
              )}


              {/* CONNECTED EVIDENCE */}

              {selectedRelatedEvents.length >
                0 && (
                <div className="selected-relationships">

                  <span className="eyebrow">
                    CONNECTED EVIDENCE
                  </span>

                  <div className="related-event-list">

                    {selectedRelatedEvents
                      .slice(0, 8)
                      .map(
                        (
                          relatedEvent
                        ) => {
                          const RelatedIcon =
                            getSourceIcon(
                              relatedEvent?.source
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
                                {relatedEvent?.title ||
                                  relatedEvent?.name ||
                                  "Unknown Event"}
                              </span>

                              <ArrowRight
                                size={14}
                              />

                            </button>
                          );
                        }
                      )}

                  </div>

                </div>
              )}


              {/* TRACE */}

              <button
                type="button"
                className="trace-button"
                disabled={
                  selectedRelatedEvents.length ===
                  0
                }
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

                <ArrowRight
                  size={15}
                />

              </button>

            </>
          ) : (

            /* =================================================
               DEFAULT INSPECTOR
            ================================================= */

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
                    {graphConfidence}%
                  </strong>

                  <span>
                    CONFIDENCE
                  </span>

                </div>

              </div>


              {/* GRAPH CONNECTION STATUS */}

              <div
                className={`graph-inspector-status ${
                  error
                    ? "graph-status-error"
                    : ""
                }`}
              >

                {error ? (
                  <AlertTriangle
                    size={16}
                  />
                ) : (
                  <ShieldCheck
                    size={16}
                  />
                )}

                <span>
                  {error
                    ? "Neo4j graph unavailable"
                    : "Neo4j graph connected"}
                </span>

              </div>

            </>
          )}

        </aside>

      </section>

    </main>
  );
}