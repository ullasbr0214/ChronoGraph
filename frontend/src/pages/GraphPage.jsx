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
} from "lucide-react";

import { getGraph } from "../services/api";

/* =========================================================
   SOURCE ICONS
========================================================= */

const sourceIcons = {
  Slack: MessageSquare,
  GitHub: GitBranch,
  Email: Mail,

  "System Log": ShieldCheck,
  "Security Log": ShieldCheck,
  "Network Log": GitBranch,
  "Application Log": ShieldCheck,
};

/* =========================================================
   DEFAULT NODE POSITIONS
========================================================= */

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
  {
    left: "50%",
    top: "22%",
  },
  {
    left: "55%",
    top: "75%",
  },
];

/* =========================================================
   HELPERS
========================================================= */

function getEventId(event) {
  return event?.id || event?.event_id || null;
}

function getSourceIcon(source) {
  return sourceIcons[source] || GitBranch;
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
   FALLBACK TEMPORAL RELATIONSHIPS

   Used only when Neo4j currently has no relationships.
========================================================= */

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

/* =========================================================
   NORMALIZE BACKEND RELATIONSHIPS

   Supports:
   {
     source,
     target,
     relationship
   }

   and:
   {
     from_id,
     to_id,
     relationship
   }
========================================================= */

function normalizeRelationships(relationships) {
  if (!Array.isArray(relationships)) {
    return [];
  }

  return relationships
    .map((relationship) => {
      const source =
        relationship?.source ||
        relationship?.from ||
        relationship?.from_id;

      const target =
        relationship?.target ||
        relationship?.to ||
        relationship?.to_id;

      const relationshipType =
        relationship?.relationship ||
        relationship?.type ||
        "RELATED_TO";

      if (!source || !target) {
        return null;
      }

      return {
        source,
        target,
        relationship: relationshipType,
        generated: false,
      };
    })
    .filter(Boolean);
}

/* =========================================================
   GRAPH PAGE
========================================================= */

export default function GraphPage() {
  /* -------------------------------------------------------
     REFS
  ------------------------------------------------------- */

  const networkRef = useRef(null);

  /* -------------------------------------------------------
     STATE
  ------------------------------------------------------- */

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
        JSON.stringify(response, null, 2)
      );

      /* ---------------------------------------------------
         Extract nodes
      --------------------------------------------------- */

      const backendNodes = Array.isArray(response?.nodes)
        ? response.nodes
        : [];

      /* ---------------------------------------------------
         Extract relationships
      --------------------------------------------------- */

      const backendRelationships = Array.isArray(
        response?.relationships
      )
        ? response.relationships
        : [];

      /* ---------------------------------------------------
         Sort events chronologically
      --------------------------------------------------- */

      const sortedEvents = [...backendNodes].sort(
        (a, b) => {
          const dateA = new Date(
            a?.timestamp
          ).getTime();

          const dateB = new Date(
            b?.timestamp
          ).getTime();

          const safeA = Number.isNaN(dateA)
            ? 0
            : dateA;

          const safeB = Number.isNaN(dateB)
            ? 0
            : dateB;

          return safeA - safeB;
        }
      );

      /* ---------------------------------------------------
         Normalize real Neo4j relationships
      --------------------------------------------------- */

      const normalizedRelationships =
        normalizeRelationships(
          backendRelationships
        );

      /* ---------------------------------------------------
         Use real relationships if available.

         Otherwise generate temporal links.
      --------------------------------------------------- */

      const finalRelationships =
        normalizedRelationships.length > 0
          ? normalizedRelationships
          : createTemporalRelationships(
              sortedEvents
            );

      /* ---------------------------------------------------
         Update state
      --------------------------------------------------- */

      setEvents(sortedEvents);

      setRelationships(
        finalRelationships
      );

      /* ---------------------------------------------------
         Keep selected event synchronized
      --------------------------------------------------- */

      setSelectedEvent(
        (previousSelected) => {
          if (!previousSelected) {
            return null;
          }

          const selectedId =
            getEventId(
              previousSelected
            );

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
        finalRelationships
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

      /*
       * Deterministic fallback positions for additional events.
       */

      const left =
        15 + ((index * 23) % 70);

      const top =
        20 + ((index * 31) % 60);

      return {
        left: `${left}%`,
        top: `${top}%`,
      };
    });
  }, [events]);

  /* =======================================================
     CALCULATE CONNECTION LINES

     Important:
     We use offsetLeft / offsetTop instead of
     getBoundingClientRect().

     This keeps SVG coordinates stable when the
     complete graph is zoomed.
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

    const positions = nodes.map(
      (node) => ({
        x:
          node.offsetLeft +
          node.offsetWidth / 2,

        y:
          node.offsetTop +
          node.offsetHeight / 2,
      })
    );

    const lines = relationships
      .map(
        (
          relationship,
          relationshipIndex
        ) => {
          const sourceId =
            relationship?.source ||
            relationship?.from ||
            relationship?.from_id;

          const targetId =
            relationship?.target ||
            relationship?.to ||
            relationship?.to_id;

          if (
            !sourceId ||
            !targetId
          ) {
            return null;
          }

          const sourceIndex =
            events.findIndex(
              (event) =>
                getEventId(event) ===
                sourceId
            );

          const targetIndex =
            events.findIndex(
              (event) =>
                getEventId(event) ===
                targetId
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
              relationship?.relationship ||
              "RELATED_TO",

            generated:
              relationship?.generated ||
              false,
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
     RECALCULATE CONNECTIONS AFTER RENDER
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

    /*
     * First calculation.
     */

    updateConnections();

    /*
     * Recalculate when browser size changes.
     */

    window.addEventListener(
      "resize",
      updateConnections
    );

    /*
     * Recalculate when graph container size changes.
     */

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
      50
    );

    return () => {
      clearTimeout(timer);
    };
  }, [
    zoom,
    calculateConnections,
  ]);

  /* =======================================================
     ZOOM OUT
  ======================================================= */

  const handleZoomOut = () => {
    setZoom((current) =>
      Math.max(
        50,
        current - 10
      )
    );
  };

  /* =======================================================
     ZOOM IN
  ======================================================= */

  const handleZoomIn = () => {
    setZoom((current) =>
      Math.min(
        150,
        current + 10
      )
    );
  };

  /* =======================================================
     RESET ZOOM
  ======================================================= */

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
     RELATED EVENTS

     Finds both incoming and outgoing
     relationships.
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
            relationship?.source ||
            relationship?.from ||
            relationship?.from_id;

          const target =
            relationship?.target ||
            relationship?.to ||
            relationship?.to_id;

          if (
            source === selectedId
          ) {
            relatedIds.add(target);
          }

          if (
            target === selectedId
          ) {
            relatedIds.add(source);
          }
        }
      );

      return events.filter(
        (event) =>
          relatedIds.has(
            getEventId(event)
          )
      );
    }, [
      selectedEvent,
      relationships,
      events,
    ]);

  /* =======================================================
     SELECTED RELATIONSHIPS

     Used to show relationship type
     in inspector.
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
          const source =
            relationship?.source ||
            relationship?.from ||
            relationship?.from_id;

          const target =
            relationship?.target ||
            relationship?.to ||
            relationship?.to_id;

          return (
            source === selectedId ||
            target === selectedId
          );
        }
      );
    }, [
      selectedEvent,
      relationships,
    ]);

  /* =======================================================
     GRAPH CONFIDENCE

     This is currently a UI-derived metric.

     Later we can replace this with
     AI-generated confidence from backend.
  ======================================================= */

  const graphConfidence = useMemo(() => {
    if (!events.length) {
      return 0;
    }

    if (!relationships.length) {
      return 50;
    }

    const possibleLinks = Math.max(
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

          {/* =================================================
              CANVAS HEADER
          ================================================= */}

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

            {/* =================================================
                GRAPH LOADING
            ================================================= */}

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

            {/* =================================================
                GRAPH ERROR
            ================================================= */}

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

            {/* =================================================
                EMPTY GRAPH
            ================================================= */}

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

                Everything inside this layer is zoomed together.
                This keeps nodes + lines + AI core aligned.
            ================================================= */}

            {!isLoading &&
              events.length > 0 && (
                <div
                  className="graph-visual-layer"
                  style={{
                    position:
                      "absolute",
                    inset: 0,
                    transform: `scale(${
                      zoom / 100
                    })`,
                    transformOrigin:
                      "center center",
                    transition:
                      "transform 180ms ease",
                  }}
                >

                  {/* =================================================
                      SVG CONNECTIONS
                  ================================================= */}

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
                                networkRef
                                  .current
                                  ?.clientWidth ||
                                  1,
                                1
                              )) *
                            1000
                          }
                          y1={
                            (line.y1 /
                              Math.max(
                                networkRef
                                  .current
                                  ?.clientHeight ||
                                  1,
                                1
                              )) *
                            600
                          }
                          x2={
                            (line.x2 /
                              Math.max(
                                networkRef
                                  .current
                                  ?.clientWidth ||
                                  1,
                                1
                              )) *
                            1000
                          }
                          y2={
                            (line.y2 /
                              Math.max(
                                networkRef
                                  .current
                                  ?.clientHeight ||
                                  1,
                                1
                              )) *
                            600
                          }
                          className={`dynamic-connection ${
                            line.generated
                              ? "generated-connection"
                              : ""
                          }`}
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
                            transform:
                              "translate(-50%, -50%)",
                          }}
                          onClick={() =>
                            handleSelectEvent(
                              event
                            )
                          }
                        >

                          {/* NODE ICON */}

                          <div className="node-icon">

                            <Icon
                              size={17}
                            />

                          </div>

                          {/* NODE CONTENT */}

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

          {/* =================================================
              SELECTED EVENT
          ================================================= */}

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

              {/* =================================================
                  SOURCE
              ================================================= */}

              <div className="selected-source">

                <div className="selected-icon">

                  {(() => {
                    const Icon =
                      getSourceIcon(
                        selectedEvent?.source
                      );

                    return (
                      <Icon size={20} />
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

              {/* =================================================
                  TITLE
              ================================================= */}

              <h2>
                {selectedEvent?.title ||
                  selectedEvent?.name ||
                  "Unknown Event"}
              </h2>

              {/* =================================================
                  DESCRIPTION
              ================================================= */}

              <p className="inspector-description">
                {selectedEvent?.description ||
                  "No description is available for this evidence event."}
              </p>

              {/* =================================================
                  EVENT DATA
              ================================================= */}

              <div className="inspector-data">

                {/* TIMESTAMP */}

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

                {/* EVENT TYPE */}

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

                {/* RELATED EVENTS */}

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

              {/* =================================================
                  RELEVANCE
              ================================================= */}

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

              {/* =================================================
                  RELATIONSHIP DETAILS
              ================================================= */}

              {selectedRelationships.length >
                0 && (
                <div className="selected-relationships">

                  <span className="eyebrow">
                    RELATIONSHIPS
                  </span>

                  <div className="relationship-type-list">

                    {selectedRelationships
                      .slice(0, 5)
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

              {/* =================================================
                  CONNECTED EVIDENCE
              ================================================= */}

              {selectedRelatedEvents.length >
                0 && (
                <div className="selected-relationships">

                  <span className="eyebrow">
                    CONNECTED EVIDENCE
                  </span>

                  <div className="related-event-list">

                    {selectedRelatedEvents
                      .slice(0, 5)
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

              {/* =================================================
                  TRACE BUTTON
              ================================================= */}

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

              {/* =================================================
                  SUMMARY
              ================================================= */}

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

              {/* =================================================
                  GRAPH CONNECTION STATUS
              ================================================= */}

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