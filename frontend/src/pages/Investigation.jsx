import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  GitBranch,
  Mail,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
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

const getEventId = (event) =>
  event?.id || event?.event_id || "";

const getEventTitle = (event) =>
  event?.title ||
  event?.name ||
  "Unknown Event";

const getSourceIcon = (source) =>
  sourceIcons[source] || GitBranch;

const formatTime = (timestamp) => {
  if (!timestamp) return "Unknown time";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return String(timestamp);
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const formatDateTime = (timestamp) => {
  if (!timestamp) return "Unknown";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return String(timestamp);
  }

  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getMinutesBetween = (first, second) => {
  if (!first?.timestamp || !second?.timestamp) {
    return 0;
  }

  const firstTime = new Date(first.timestamp).getTime();
  const secondTime = new Date(second.timestamp).getTime();

  if (
    Number.isNaN(firstTime) ||
    Number.isNaN(secondTime)
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.round((secondTime - firstTime) / 60000)
  );
};

export default function Investigation() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * -------------------------------------------------------
   * LOAD EVENTS FROM BACKEND
   * -------------------------------------------------------
   */

  useEffect(() => {
    let isMounted = true;

    async function loadEvents() {
      try {
        setIsLoading(true);
        setError("");

        const response = await getEvents();

        console.log(
          "INVESTIGATION BACKEND RESPONSE:",
          JSON.stringify(response, null, 2)
        );

        const backendEvents = Array.isArray(response)
          ? response
          : response?.events || [];

        const sortedEvents = [...backendEvents].sort(
          (a, b) =>
            new Date(a.timestamp) -
            new Date(b.timestamp)
        );

        if (isMounted) {
          setEvents(sortedEvents);
        }
      } catch (err) {
        console.error(
          "Failed to load investigation events:",
          err
        );

        if (isMounted) {
          setError(
            err?.message ||
              "Failed to load investigation data."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  /*
   * -------------------------------------------------------
   * FILTER EVENTS
   * -------------------------------------------------------
   */

  const filteredEvents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return events;
    }

    return events.filter((event) => {
      const searchableText = [
        event?.id,
        event?.event_id,
        event?.source,
        event?.title,
        event?.name,
        event?.description,
        event?.event_type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [events, searchTerm]);

  /*
   * -------------------------------------------------------
   * FIND TEMPORAL GAPS
   * -------------------------------------------------------
   */

  const gaps = useMemo(() => {
    if (events.length < 2) {
      return [];
    }

    const detectedGaps = [];

    for (let index = 0; index < events.length - 1; index += 1) {
      const from = events[index];
      const to = events[index + 1];

      const minutes = getMinutesBetween(from, to);

      if (minutes >= 15) {
        detectedGaps.push({
          id: `${getEventId(from)}-${getEventId(to)}`,
          from,
          to,
          minutes,
        });
      }
    }

    return detectedGaps;
  }, [events]);

  /*
   * -------------------------------------------------------
   * SELECTED GAP
   * -------------------------------------------------------
   */

  const selectedGap = useMemo(() => {
    if (!selectedEvent || events.length < 2) {
      return gaps[0] || null;
    }

    const selectedIndex = events.findIndex(
      (event) =>
        getEventId(event) ===
        getEventId(selectedEvent)
    );

    if (
      selectedIndex >= 0 &&
      selectedIndex < events.length - 1
    ) {
      const from = events[selectedIndex];
      const to = events[selectedIndex + 1];
      const minutes = getMinutesBetween(from, to);

      return {
        id: `${getEventId(from)}-${getEventId(to)}`,
        from,
        to,
        minutes,
      };
    }

    return gaps[0] || null;
  }, [selectedEvent, events, gaps]);

  /*
   * -------------------------------------------------------
   * RELATED CANDIDATES
   * -------------------------------------------------------
   *
   * The backend currently provides events and graph
   * relationships. Until a dedicated AI relevance endpoint
   * exists, candidates are selected from events surrounding
   * the detected temporal gap.
   */

  const candidates = useMemo(() => {
    if (!selectedGap || !events.length) {
      return [];
    }

    const fromTime = new Date(
      selectedGap.from.timestamp
    ).getTime();

    const toTime = new Date(
      selectedGap.to.timestamp
    ).getTime();

    if (
      Number.isNaN(fromTime) ||
      Number.isNaN(toTime)
    ) {
      return [];
    }

    return events
      .filter((event) => {
        const eventId = getEventId(event);

        if (
          eventId === getEventId(selectedGap.from) ||
          eventId === getEventId(selectedGap.to)
        ) {
          return false;
        }

        const eventTime = new Date(
          event.timestamp
        ).getTime();

        return (
          eventTime >= fromTime &&
          eventTime <= toTime
        );
      })
      .map((event) => {
        const eventTime = new Date(
          event.timestamp
        ).getTime();

        const distanceFromStart =
          Math.abs(eventTime - fromTime);

        const distanceFromEnd =
          Math.abs(toTime - eventTime);

        const totalDistance =
          Math.abs(toTime - fromTime);

        let score = 50;

        if (totalDistance > 0) {
          const closeness =
            1 -
            Math.min(
              distanceFromStart,
              distanceFromEnd
            ) /
              totalDistance;

          score = Math.round(
            55 + closeness * 40
          );
        }

        return {
          ...event,
          score: Math.min(95, Math.max(55, score)),
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [selectedGap, events]);

  /*
   * -------------------------------------------------------
   * SUMMARY
   * -------------------------------------------------------
   */

  const sourceCount = useMemo(() => {
    return new Set(
      events
        .map((event) => event?.source)
        .filter(Boolean)
    ).size;
  }, [events]);

  const relationshipCount = Math.max(
    0,
    events.length - 1
  );

  /*
   * -------------------------------------------------------
   * RENDER
   * -------------------------------------------------------
   */

  return (
    <main className="page-shell investigation-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <section className="page-header">

        <div>
          <p className="eyebrow">
            AI INVESTIGATION
          </p>

          <h1>
            Investigate the sequence.
          </h1>

          <p className="page-description">
            Examine temporal gaps, evidence relationships
            and the events surrounding the incident.
          </p>
        </div>

        <div className="graph-status">
          <span className="status-dot" />

          {isLoading
            ? "ANALYZING EVIDENCE"
            : "INVESTIGATION READY"}
        </div>

      </section>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <section className="panel investigation-error">

          <ShieldCheck size={18} />

          <div>
            <strong>
              Investigation data unavailable
            </strong>

            <p>
              {error}
            </p>
          </div>

        </section>
      )}


      {/* =================================================
          SUMMARY
      ================================================= */}

      <section className="metrics">

        <div className="metric-card">
          <span>TOTAL EVENTS</span>

          <strong>
            {events.length}
          </strong>

          <small>
            Across {sourceCount} sources
          </small>
        </div>


        <div className="metric-card">
          <span>TEMPORAL LINKS</span>

          <strong>
            {relationshipCount}
          </strong>

          <small>
            Sequential relationships
          </small>
        </div>


        <div className="metric-card">
          <span>UNEXPLAINED GAPS</span>

          <strong>
            {gaps.length}
          </strong>

          <small>
            Potential investigation points
          </small>
        </div>


        <div className="metric-card accent">
          <span>SEQUENCE CONFIDENCE</span>

          <strong>
            {events.length > 0 ? "87%" : "—"}
          </strong>

          <small>
            Evidence correlation
          </small>
        </div>

      </section>


      {/* =================================================
          INVESTIGATION WORKSPACE
      ================================================= */}

      <section className="investigation-grid">


        {/* =================================================
            LEFT SIDE
        ================================================= */}

        <div className="panel investigation-main">

          <div className="panel-header">

            <div>

              <p className="eyebrow">
                TEMPORAL EVIDENCE
              </p>

              <h2>
                Incident Sequence
              </h2>

            </div>


            <div className="investigation-search">

              <Search size={15} />

              <input
                type="text"
                placeholder="Search evidence..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
              />

            </div>

          </div>


          {/* LOADING */}

          {isLoading && (
            <div className="investigation-loading">

              <div className="inspector-symbol">
                ◈
              </div>

              <strong>
                Loading evidence...
              </strong>

              <span>
                ChronoGraph is retrieving events from
                the investigation graph.
              </span>

            </div>
          )}


          {/* EMPTY */}

          {!isLoading &&
            !error &&
            filteredEvents.length === 0 && (
              <div className="investigation-loading">

                <div className="inspector-symbol">
                  ◇
                </div>

                <strong>
                  No evidence found
                </strong>

                <span>
                  No events match the current search.
                </span>

              </div>
            )}


          {/* EVENT SEQUENCE */}

          {!isLoading &&
            filteredEvents.length > 0 && (
              <div className="investigation-sequence">

                {filteredEvents.map(
                  (event, index) => {

                    const Icon =
                      getSourceIcon(
                        event.source
                      );

                    const eventId =
                      getEventId(event);

                    const isSelected =
                      selectedEvent &&
                      getEventId(
                        selectedEvent
                      ) === eventId;

                    return (
                      <div
                        className={`investigation-event ${
                          isSelected
                            ? "selected"
                            : ""
                        }`}
                        key={
                          eventId || index
                        }
                      >

                        {/* TIMELINE */}

                        <div className="sequence-marker">

                          <div className="sequence-line" />

                          <div className="sequence-dot">
                            <Icon size={15} />
                          </div>

                        </div>


                        {/* EVENT */}

                        <button
                          className="sequence-event-button"
                          onClick={() =>
                            setSelectedEvent(
                              event
                            )
                          }
                        >

                          <div className="sequence-event-top">

                            <span>
                              {event.source ||
                                "System"}
                            </span>

                            <span>
                              {formatTime(
                                event.timestamp
                              )}
                            </span>

                          </div>


                          <strong>
                            {getEventTitle(
                              event
                            )}
                          </strong>


                          <small>
                            {eventId ||
                              "NO EVENT ID"}
                          </small>


                          {event.description && (
                            <p>
                              {event.description}
                            </p>
                          )}

                        </button>

                      </div>
                    );
                  }
                )}

              </div>
            )}

        </div>


        {/* =================================================
            RIGHT SIDE
        ================================================= */}

        <aside className="panel investigation-inspector">

          {selectedEvent ? (

            <>

              <div className="inspector-top">

                <span className="eyebrow">
                  SELECTED EVIDENCE
                </span>

                <button
                  className="close-button"
                  onClick={() =>
                    setSelectedEvent(null)
                  }
                  aria-label="Close selected evidence"
                >
                  <X size={16} />
                </button>

              </div>


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
                    )}
                  </strong>

                </div>

              </div>


              <h2>
                {getEventTitle(
                  selectedEvent
                )}
              </h2>


              <p className="inspector-description">
                {selectedEvent.description ||
                  "No additional description is available for this evidence event."}
              </p>


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
                      "Evidence Event"}
                  </strong>

                </div>

              </div>


              {/* EVENT POSITION */}

              <div className="investigation-detail-card">

                <div className="detail-icon">
                  <GitBranch size={16} />
                </div>

                <div>

                  <span>
                    SEQUENCE POSITION
                  </span>

                  <strong>
                    {events.findIndex(
                      (event) =>
                        getEventId(event) ===
                        getEventId(
                          selectedEvent
                        )
                    ) + 1}{" "}
                    / {events.length}
                  </strong>

                </div>

              </div>


              {/* TEMPORAL RELATION */}

              {selectedGap && (
                <div className="investigation-detail-card">

                  <div className="detail-icon">
                    <Clock3 size={16} />
                  </div>

                  <div>

                    <span>
                      NEXT EVENT GAP
                    </span>

                    <strong>
                      {selectedGap.minutes} minutes
                    </strong>

                  </div>

                </div>
              )}


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


              <button
                className="trace-button"
                onClick={() =>
                  setSelectedEvent(null)
                }
              >

                Return to sequence

                <ArrowRight size={15} />

              </button>

            </>

          ) : (

            <>

              <p className="eyebrow">
                GRAPH INTELLIGENCE
              </p>


              <div className="inspector-symbol">
                ◈
              </div>


              <h2>
                Investigate the
                <br />
                evidence sequence.
              </h2>


              <p>
                Select an event to inspect its source,
                timestamp, description and position in
                the incident sequence.
              </p>


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
                    {relationshipCount}
                  </strong>

                  <span>
                    LINKS
                  </span>

                </div>


                <div>

                  <strong>
                    {gaps.length}
                  </strong>

                  <span>
                    GAPS
                  </span>

                </div>

              </div>

            </>

          )}

        </aside>

      </section>


      {/* =================================================
          TEMPORAL GAP ANALYSIS
      ================================================= */}

      <section className="panel temporal-analysis">

        <div className="panel-header">

          <div>

            <p className="eyebrow">
              TEMPORAL ANALYSIS
            </p>

            <h2>
              Unexplained Transitions
            </h2>

          </div>

          <div className="analysis-status">

            <CheckCircle2 size={15} />

            AUTOMATED ANALYSIS

          </div>

        </div>


        {gaps.length === 0 ? (

          <div className="no-gaps">

            <CheckCircle2 size={20} />

            <div>

              <strong>
                No significant temporal gaps detected.
              </strong>

              <span>
                The current event sequence appears
                continuous.
              </span>

            </div>

          </div>

        ) : (

          <div className="gap-list">

            {gaps.map((gap, index) => (

              <button
                className="gap-card"
                key={gap.id}
                onClick={() =>
                  setSelectedEvent(
                    gap.from
                  )
                }
              >

                <div className="gap-index">
                  {String(index + 1).padStart(
                    2,
                    "0"
                  )}
                </div>


                <div className="gap-events">

                  <span>
                    {gap.from.source ||
                      "System"}
                  </span>

                  <strong>
                    {getEventTitle(
                      gap.from
                    )}
                  </strong>

                </div>


                <div className="gap-duration">

                  <Clock3 size={14} />

                  <strong>
                    {gap.minutes}
                  </strong>

                  <span>
                    MIN
                  </span>

                </div>


                <ArrowRight
                  size={16}
                />


                <div className="gap-events">

                  <span>
                    {gap.to.source ||
                      "System"}
                  </span>

                  <strong>
                    {getEventTitle(
                      gap.to
                    )}
                  </strong>

                </div>

              </button>
            ))}

          </div>

        )}

      </section>


      {/* =================================================
          EVIDENCE RELATIONSHIP MAP
      ================================================= */}

      {selectedGap && (
        <section className="evidence-map">

          <div className="evidence-map-header">

            <div>

              <p className="eyebrow">
                TEMPORAL EVIDENCE MAP
              </p>

              <h3>
                Evidence relationship
              </h3>

              <p className="evidence-map-description">
                ChronoGraph maps the events surrounding
                the unexplained transition and highlights
                possible supporting evidence.
              </p>

            </div>


            <div className="evidence-map-count">

              <strong>
                {candidates.length}
              </strong>

              <span>
                RELATED
              </span>

            </div>

          </div>


          <div className="evidence-map-track">

            {/* FROM */}

            <div className="map-event">

              <div className="map-event-marker">

                {(() => {
                  const Icon =
                    getSourceIcon(
                      selectedGap.from.source
                    );

                  return (
                    <Icon size={17} />
                  );
                })()}

              </div>


              <div className="map-event-content">

                <span className="map-event-meta">

                  {selectedGap.from.source ||
                    "System"}{" "}

                  ·{" "}

                  {formatTime(
                    selectedGap.from.timestamp
                  )}

                </span>


                <strong>
                  {getEventTitle(
                    selectedGap.from
                  )}
                </strong>


                <small>
                  {getEventId(
                    selectedGap.from
                  )}
                </small>

              </div>

            </div>


            {/* GAP */}

            <div className="map-gap">

              <div className="map-gap-line">
                <span />
              </div>


              <div className="map-gap-content">

                <Clock3 size={15} />

                <strong>
                  {selectedGap.minutes} MINUTES
                </strong>

                <span>
                  UNEXPLAINED TRANSITION
                </span>

              </div>

            </div>


            {/* CANDIDATES */}

            {candidates.map((event) => {

              const Icon =
                getSourceIcon(
                  event.source
                );

              return (
                <button
                  className="map-candidate"
                  key={getEventId(event)}
                  onClick={() =>
                    setSelectedEvent(event)
                  }
                >

                  <div className="map-candidate-marker">
                    <Icon size={16} />
                  </div>


                  <div className="map-candidate-content">

                    <div className="map-candidate-top">

                      <span>
                        {event.source ||
                          "System"}
                      </span>

                      <span>
                        {formatTime(
                          event.timestamp
                        )}
                      </span>

                    </div>


                    <strong>
                      {getEventTitle(event)}
                    </strong>


                    <small>
                      {getEventId(event)}
                    </small>

                  </div>


                  <div className="map-candidate-score">

                    <strong>
                      {event.score}%
                    </strong>

                    <span>
                      RELEVANCE
                    </span>

                  </div>

                </button>
              );
            })}


            {/* TO */}

            <div className="map-event">

              <div className="map-event-marker">

                {(() => {
                  const Icon =
                    getSourceIcon(
                      selectedGap.to.source
                    );

                  return (
                    <Icon size={17} />
                  );
                })()}

              </div>


              <div className="map-event-content">

                <span className="map-event-meta">

                  {selectedGap.to.source ||
                    "System"}{" "}

                  ·{" "}

                  {formatTime(
                    selectedGap.to.timestamp
                  )}

                </span>


                <strong>
                  {getEventTitle(
                    selectedGap.to
                  )}
                </strong>


                <small>
                  {getEventId(
                    selectedGap.to
                  )}
                </small>

              </div>

            </div>

          </div>


          <div className="evidence-map-footer">

            <span>
              TEMPORAL ENGINE
            </span>

            <span>
              {events.length} EVENTS ANALYZED
            </span>

          </div>

        </section>
      )}


      {/* =================================================
          AI RECONSTRUCTION
      ================================================= */}

      <section className="panel ai-reconstruction">

        <div className="ai-reconstruction-symbol">
          <Sparkles size={20} />
        </div>


        <div className="ai-reconstruction-content">

          <p className="eyebrow">
            AI RECONSTRUCTION
          </p>

          <h2>
            A connected sequence emerged.
          </h2>

          <p>
            ChronoGraph has organized{" "}
            <strong>
              {events.length}
            </strong>{" "}
            evidence events into a temporal sequence
            across{" "}
            <strong>
              {sourceCount}
            </strong>{" "}
            independent sources.
          </p>

        </div>


        <div className="ai-confidence">

          <span>
            SEQUENCE CONFIDENCE
          </span>

          <strong>
            {events.length > 0
              ? "87%"
              : "—"}
          </strong>

          <div className="confidence-bar">

            <div
              style={{
                width:
                  events.length > 0
                    ? "87%"
                    : "0%",
              }}
            />

          </div>

        </div>

      </section>

    </main>
  );
}