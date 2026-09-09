import React, { useEffect, useMemo, useState } from "react";
import { getEvents, getGraph } from "../services/api";

export default function Investigation() {
  const [events, setEvents] = useState([]);
  const [relationships, setRelationships] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sourceFilter, setSourceFilter] = useState("All Sources");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedGap, setSelectedGap] = useState(null);

  // =========================================================
  // LOAD INVESTIGATION DATA
  // =========================================================

  useEffect(() => {
    let mounted = true;

    async function loadInvestigation() {
      try {
        console.log("🔎 Loading ChronoGraph investigation...");

        setLoading(true);
        setError("");

        // ---------------------------------------------
        // Load events
        // ---------------------------------------------

        const eventsResponse = await getEvents();

        console.log(
          "🔥 EVENTS FROM BACKEND:",
          eventsResponse
        );

        // Backend format:
        // {
        //   success: true,
        //   count: 4,
        //   events: [...]
        // }

        const backendEvents = Array.isArray(eventsResponse)
          ? eventsResponse
          : Array.isArray(eventsResponse?.events)
          ? eventsResponse.events
          : [];

        // ---------------------------------------------
        // Load Neo4j graph
        // ---------------------------------------------

        let graphResponse = null;

        try {
          graphResponse = await getGraph();

          console.log(
            "🔥 CHRONOGRAPH GRAPH RESPONSE:",
            graphResponse
          );
        } catch (graphError) {
          console.warn(
            "⚠️ Graph endpoint unavailable:",
            graphError
          );
        }

        // ---------------------------------------------
        // Extract relationships
        // ---------------------------------------------

        const backendRelationships = Array.isArray(
          graphResponse?.relationships
        )
          ? graphResponse.relationships
          : [];

        if (!mounted) return;

        setEvents(backendEvents);
        setRelationships(backendRelationships);

        console.log(
          "CHRONOGRAPH INVESTIGATION EVENTS:",
          backendEvents
        );

        console.log(
          "CHRONOGRAPH REAL RELATIONSHIPS:",
          backendRelationships
        );
      } catch (err) {
        console.error(
          "🔥 INVESTIGATION LOAD ERROR:",
          err
        );

        if (!mounted) return;

        setError(
          err?.message ||
            "Unable to load investigation data."
        );

        setEvents([]);
        setRelationships([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadInvestigation();

    return () => {
      mounted = false;
    };
  }, []);

  // =========================================================
  // NORMALIZE EVENT ID
  // =========================================================

  const getEventId = (event) => {
    if (!event) return null;

    return (
      event.id ||
      event.event_id ||
      event.eventId ||
      event.uuid ||
      null
    );
  };

  // =========================================================
  // NORMALIZE EVENT TIMESTAMP
  // =========================================================

  const getTimestamp = (event) => {
    if (!event) return null;

    return (
      event.timestamp ||
      event.time ||
      event.datetime ||
      event.created_at ||
      null
    );
  };

  // =========================================================
  // NORMALIZE EVENT SOURCE
  // =========================================================

  const getSource = (event) => {
    if (!event) return "Unknown Source";

    return (
      event.source ||
      event.source_name ||
      event.log_source ||
      "Unknown Source"
    );
  };

  // =========================================================
  // NORMALIZE EVENT TITLE
  // =========================================================

  const getTitle = (event) => {
    if (!event) return "Unknown Event";

    return (
      event.title ||
      event.name ||
      event.event_name ||
      "Unknown Event"
    );
  };

  // =========================================================
  // NORMALIZE EVENT DESCRIPTION
  // =========================================================

  const getDescription = (event) => {
    if (!event) return "";

    return (
      event.description ||
      event.details ||
      event.message ||
      "No description available."
    );
  };

  // =========================================================
  // SORT EVENTS CHRONOLOGICALLY
  // =========================================================

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const timeA = new Date(getTimestamp(a)).getTime();
      const timeB = new Date(getTimestamp(b)).getTime();

      return timeA - timeB;
    });
  }, [events]);

  // =========================================================
  // AVAILABLE SOURCES
  // =========================================================

  const sources = useMemo(() => {
    const uniqueSources = new Set();

    events.forEach((event) => {
      uniqueSources.add(getSource(event));
    });

    return [
      "All Sources",
      ...Array.from(uniqueSources),
    ];
  }, [events]);

  // =========================================================
  // FILTERED EVENTS
  // =========================================================

  const filteredEvents = useMemo(() => {
    if (sourceFilter === "All Sources") {
      return sortedEvents;
    }

    return sortedEvents.filter(
      (event) => getSource(event) === sourceFilter
    );
  }, [sortedEvents, sourceFilter]);

  // =========================================================
  // DETECT TEMPORAL GAPS
  // =========================================================

  const detectedGaps = useMemo(() => {
    const gaps = [];

    if (sortedEvents.length < 2) {
      return gaps;
    }

    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const current = sortedEvents[i];
      const next = sortedEvents[i + 1];

      const currentTime = new Date(
        getTimestamp(current)
      ).getTime();

      const nextTime = new Date(
        getTimestamp(next)
      ).getTime();

      if (
        Number.isNaN(currentTime) ||
        Number.isNaN(nextTime)
      ) {
        continue;
      }

      const differenceMs = nextTime - currentTime;

      const differenceMinutes =
        differenceMs / (1000 * 60);

      // Only consider gaps greater than 15 minutes
      if (differenceMinutes > 15) {
        gaps.push({
          id: `${getEventId(current)}-${getEventId(
            next
          )}`,

          from: getEventId(current),

          to: getEventId(next),

          fromEvent: current,

          toEvent: next,

          durationMinutes: differenceMinutes,
        });
      }
    }

    return gaps;
  }, [sortedEvents]);

  // =========================================================
  // SELECTED GAP
  // =========================================================

  const selectedGapData = useMemo(() => {
    if (!selectedGap) {
      return null;
    }

    const fromId = selectedGap.from;
    const toId = selectedGap.to;

    const from = sortedEvents.find(
      (event) => getEventId(event) === fromId
    );

    const to = sortedEvents.find(
      (event) => getEventId(event) === toId
    );

    if (!from || !to) {
      return null;
    }

    return {
      from,
      to,
      durationMinutes:
        selectedGap.durationMinutes,
    };
  }, [selectedGap, sortedEvents]);

  // =========================================================
  // RELATIONSHIP HELPERS
  // =========================================================

  const relationshipExists = (
    sourceId,
    targetId
  ) => {
    return relationships.some((relationship) => {
      const source =
        relationship.source ||
        relationship.from ||
        relationship.source_id;

      const target =
        relationship.target ||
        relationship.to ||
        relationship.target_id;

      return (
        source === sourceId &&
        target === targetId
      );
    });
  };

  // =========================================================
  // CALCULATE SEQUENCE CONFIDENCE
  // =========================================================

  const sequenceConfidence = useMemo(() => {
    if (events.length === 0) {
      return 0;
    }

    if (events.length === 1) {
      return 100;
    }

    const possibleLinks = events.length - 1;

    let connectedLinks = 0;

    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const currentId = getEventId(
        sortedEvents[i]
      );

      const nextId = getEventId(
        sortedEvents[i + 1]
      );

      if (
        relationshipExists(
          currentId,
          nextId
        )
      ) {
        connectedLinks++;
      }
    }

    // If relationships exist, calculate based on them.
    // Otherwise use temporal ordering as a fallback.

    if (relationships.length > 0) {
      const confidence =
        (connectedLinks / possibleLinks) * 100;

      return Math.max(
        0,
        Math.min(100, Math.round(confidence))
      );
    }

    return 100;
  }, [events, sortedEvents, relationships]);

  // =========================================================
  // TIME WINDOW
  // =========================================================

  const timeWindow = useMemo(() => {
    if (sortedEvents.length < 2) {
      return "0m";
    }

    const firstTime = new Date(
      getTimestamp(sortedEvents[0])
    ).getTime();

    const lastTime = new Date(
      getTimestamp(
        sortedEvents[sortedEvents.length - 1]
      )
    ).getTime();

    if (
      Number.isNaN(firstTime) ||
      Number.isNaN(lastTime)
    ) {
      return "0m";
    }

    const minutes =
      (lastTime - firstTime) / (1000 * 60);

    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }

    const hours = minutes / 60;

    return `${hours.toFixed(1)}h`;
  }, [sortedEvents]);

  // =========================================================
  // FORMAT TIME
  // =========================================================

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

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (timestamp) => {
    if (!timestamp) {
      return "";
    }

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =========================================================
  // FORMAT GAP
  // =========================================================

  const formatGapDuration = (minutes) => {
    if (!minutes) {
      return "0m";
    }

    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }

    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);

    return `${hours}h ${mins}m`;
  };

  // =========================================================
  // LOADING STATE
  // =========================================================

  if (loading) {
    return (
      <div className="investigation-page">
        <div className="investigation-loading">
          <div className="loading-dot" />

          <h2>
            Loading investigation...
          </h2>

          <p>
            Reconstructing the incident from
            ChronoGraph evidence.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR STATE
  // =========================================================

  if (error) {
    return (
      <div className="investigation-page">
        <div className="investigation-error">
          <div className="error-icon">
            !
          </div>

          <h2>
            Investigation unavailable
          </h2>

          <p>{error}</p>

          <button
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div className="investigation-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="investigation-hero">

        <div className="hero-copy">

          <div className="eyebrow">
            AI INVESTIGATION
          </div>

          <h1>
            Investigate
            <br />
            the
            <br />
            sequence.
          </h1>

          <p>
            Examine temporal gaps, graph
            relationships and the evidence
            surrounding the incident.
          </p>

        </div>

        <div className="investigation-status">
          <span className="status-dot" />

          INVESTIGATION READY
        </div>

      </section>

      {/* =====================================================
          KPI CARDS
      ===================================================== */}

      <section className="investigation-stats">

        {/* TOTAL EVENTS */}

        <div className="investigation-stat-card">

          <div className="stat-label">
            TOTAL EVENTS
          </div>

          <div className="stat-value">
            {events.length}
          </div>

          <div className="stat-description">
            Across {sources.length - 1} sources
          </div>

        </div>

        {/* RELATIONSHIPS */}

        <div className="investigation-stat-card">

          <div className="stat-label">
            GRAPH RELATIONSHIPS
          </div>

          <div className="stat-value">
            {relationships.length}
          </div>

          <div className="stat-description">
            Neo4j evidence links
          </div>

        </div>

        {/* GAPS */}

        <div className="investigation-stat-card">

          <div className="stat-label">
            UNEXPLAINED GAPS
          </div>

          <div className="stat-value">
            {detectedGaps.length}
          </div>

          <div className="stat-description">
            Potential investigation points
          </div>

        </div>

        {/* CONFIDENCE */}

        <div className="investigation-stat-card highlight">

          <div className="stat-label">
            SEQUENCE CONFIDENCE
          </div>

          <div className="stat-value">
            {sequenceConfidence}%
          </div>

          <div className="stat-description">
            Evidence correlation
          </div>

        </div>

      </section>

      {/* =====================================================
          EVIDENCE FILTER
      ===================================================== */}

      <section className="evidence-filter-section">

        <div>
          <div className="section-eyebrow">
            EVIDENCE FILTER
          </div>

          <h2>
            Filter investigation evidence
          </h2>
        </div>

        <select
          value={sourceFilter}
          onChange={(event) =>
            setSourceFilter(event.target.value)
          }
          className="source-select"
        >
          {sources.map((source) => (
            <option
              key={source}
              value={source}
            >
              {source}
            </option>
          ))}
        </select>

      </section>

      {/* =====================================================
          TEMPORAL EVIDENCE
      ===================================================== */}

      <section className="investigation-panel">

        <div className="panel-header">

          <div>
            <div className="section-eyebrow">
              TEMPORAL EVIDENCE
            </div>

            <h2>
              Incident sequence
            </h2>
          </div>

          <div className="time-window">
            {timeWindow}
          </div>

        </div>

        {/* EMPTY */}

        {filteredEvents.length === 0 ? (
          <div className="empty-state">

            <h3>
              No investigation evidence
            </h3>

            <p>
              No events were returned from
              the selected source.
            </p>

          </div>
        ) : (

          <div className="timeline">

            {filteredEvents.map(
              (event, index) => {

                const eventId =
                  getEventId(event);

                const selected =
                  selectedEvent &&
                  getEventId(selectedEvent) ===
                    eventId;

                return (
                  <React.Fragment key={eventId || index}>

                    {/* EVENT */}

                    <div
                      className={`timeline-event ${
                        selected
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        setSelectedEvent(event)
                      }
                    >

                      <div className="timeline-marker">
                        <span />
                      </div>

                      <div className="timeline-time">
                        {formatTime(
                          getTimestamp(event)
                        )}
                      </div>

                      <div className="timeline-content">

                        <div className="event-source">
                          {getSource(event)}
                        </div>

                        <h3>
                          {getTitle(event)}
                        </h3>

                        <p>
                          {getDescription(event)}
                        </p>

                        <div className="event-id">
                          {eventId}
                        </div>

                      </div>

                    </div>

                    {/* GAP */}

                    {index <
                      filteredEvents.length - 1 && (
                      <div className="timeline-gap">

                        {(() => {

                          const nextEvent =
                            filteredEvents[
                              index + 1
                            ];

                          const currentTime =
                            new Date(
                              getTimestamp(event)
                            ).getTime();

                          const nextTime =
                            new Date(
                              getTimestamp(
                                nextEvent
                              )
                            ).getTime();

                          const gapMinutes =
                            (nextTime -
                              currentTime) /
                            (1000 * 60);

                          const gapObject =
                            detectedGaps.find(
                              (gap) =>
                                gap.from ===
                                  eventId &&
                                gap.to ===
                                  getEventId(
                                    nextEvent
                                  )
                            );

                          if (
                            gapMinutes > 15
                          ) {
                            return (
                              <button
                                className="gap-card"
                                onClick={() =>
                                  setSelectedGap(
                                    gapObject || {
                                      from: eventId,
                                      to: getEventId(
                                        nextEvent
                                      ),
                                      durationMinutes:
                                        gapMinutes,
                                    }
                                  )
                                }
                              >

                                <span className="gap-line" />

                                <span className="gap-text">
                                  {formatGapDuration(
                                    gapMinutes
                                  )}{" "}
                                  temporal gap
                                </span>

                                <span className="gap-arrow">
                                  →
                                </span>

                              </button>
                            );
                          }

                          return (
                            <div className="normal-connection">
                              <span />
                            </div>
                          );

                        })()}

                      </div>
                    )}

                  </React.Fragment>
                );
              }
            )}

          </div>

        )}

      </section>

      {/* =====================================================
          SELECTED EVENT
      ===================================================== */}

      {selectedEvent && (

        <section className="investigation-panel selected-event-panel">

          <div className="panel-header">

            <div>
              <div className="section-eyebrow">
                SELECTED EVIDENCE
              </div>

              <h2>
                {getTitle(selectedEvent)}
              </h2>
            </div>

            <button
              className="close-button"
              onClick={() =>
                setSelectedEvent(null)
              }
            >
              ×
            </button>

          </div>

          <div className="selected-event-grid">

            <div>
              <span className="detail-label">
                EVENT ID
              </span>

              <strong>
                {getEventId(selectedEvent)}
              </strong>
            </div>

            <div>
              <span className="detail-label">
                SOURCE
              </span>

              <strong>
                {getSource(selectedEvent)}
              </strong>
            </div>

            <div>
              <span className="detail-label">
                TIMESTAMP
              </span>

              <strong>
                {formatDate(
                  getTimestamp(selectedEvent)
                )}{" "}
                {formatTime(
                  getTimestamp(selectedEvent)
                )}
              </strong>
            </div>

            <div className="full-detail">
              <span className="detail-label">
                DESCRIPTION
              </span>

              <p>
                {getDescription(selectedEvent)}
              </p>
            </div>

          </div>

        </section>

      )}

      {/* =====================================================
          SELECTED GAP
      ===================================================== */}

      {selectedGapData && (

        <section className="investigation-panel gap-investigation-panel">

          <div className="panel-header">

            <div>
              <div className="section-eyebrow">
                INVESTIGATION POINT
              </div>

              <h2>
                Investigate temporal gap
              </h2>
            </div>

            <button
              className="close-button"
              onClick={() =>
                setSelectedGap(null)
              }
            >
              ×
            </button>

          </div>

          <div className="gap-investigation">

            <div className="gap-event">

              <span className="detail-label">
                BEFORE GAP
              </span>

              <h3>
                {getTitle(
                  selectedGapData.from
                )}
              </h3>

              <p>
                {formatTime(
                  getTimestamp(
                    selectedGapData.from
                  )
                )}
              </p>

            </div>

            <div className="gap-duration">

              <div className="gap-warning">
                !
              </div>

              <strong>
                {formatGapDuration(
                  selectedGapData.durationMinutes
                )}
              </strong>

              <span>
                unexplained interval
              </span>

            </div>

            <div className="gap-event">

              <span className="detail-label">
                AFTER GAP
              </span>

              <h3>
                {getTitle(
                  selectedGapData.to
                )}
              </h3>

              <p>
                {formatTime(
                  getTimestamp(
                    selectedGapData.to
                  )
                )}
              </p>

            </div>

          </div>

          <div className="investigation-note">

            <span className="note-icon">
              i
            </span>

            <p>
              This interval represents a
              temporal point where additional
              evidence may be required to
              explain how the incident progressed.
            </p>

          </div>

        </section>

      )}

      {/* =====================================================
          GRAPH RELATIONSHIPS
      ===================================================== */}

      <section className="investigation-panel">

        <div className="panel-header">

          <div>
            <div className="section-eyebrow">
              GRAPH EVIDENCE
            </div>

            <h2>
              Neo4j relationships
            </h2>
          </div>

          <div className="relationship-count">
            {relationships.length} LINKS
          </div>

        </div>

        {relationships.length === 0 ? (

          <div className="empty-state">

            <h3>
              No graph relationships
            </h3>

            <p>
              ChronoGraph did not return any
              Neo4j relationships for this case.
            </p>

          </div>

        ) : (

          <div className="relationship-list">

            {relationships.map(
              (relationship, index) => {

                const source =
                  relationship.source ||
                  relationship.from ||
                  relationship.source_id ||
                  "Unknown";

                const target =
                  relationship.target ||
                  relationship.to ||
                  relationship.target_id ||
                  "Unknown";

                const type =
                  relationship.relationship ||
                  relationship.type ||
                  relationship.relation ||
                  "RELATED_TO";

                const sourceEvent =
                  events.find(
                    (event) =>
                      getEventId(event) ===
                      source
                  );

                const targetEvent =
                  events.find(
                    (event) =>
                      getEventId(event) ===
                      target
                  );

                return (
                  <div
                    className="relationship-row"
                    key={`${source}-${target}-${index}`}
                  >

                    <div className="relationship-node">

                      <span className="node-id">
                        {source}
                      </span>

                      <strong>
                        {sourceEvent
                          ? getTitle(
                              sourceEvent
                            )
                          : source}
                      </strong>

                    </div>

                    <div className="relationship-type">

                      <span className="relationship-line" />

                      <span>
                        {type}
                      </span>

                      <span className="relationship-arrow">
                        →
                      </span>

                    </div>

                    <div className="relationship-node">

                      <span className="node-id">
                        {target}
                      </span>

                      <strong>
                        {targetEvent
                          ? getTitle(
                              targetEvent
                            )
                          : target}
                      </strong>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        )}

      </section>

      {/* =====================================================
          FOOTER SUMMARY
      ===================================================== */}

      <section className="investigation-summary">

        <div className="summary-item">

          <span className="summary-number">
            {events.length}
          </span>

          <span>
            EVENTS
          </span>

        </div>

        <div className="summary-item">

          <span className="summary-number">
            {relationships.length}
          </span>

          <span>
            GRAPH LINKS
          </span>

        </div>

        <div className="summary-item">

          <span className="summary-number">
            {detectedGaps.length}
          </span>

          <span>
            GAPS
          </span>

        </div>

        <div className="summary-item">

          <span className="summary-number">
            {sequenceConfidence}%
          </span>

          <span>
            CONFIDENCE
          </span>

        </div>

      </section>

    </div>
  );
}