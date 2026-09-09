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
  Server,
  Network,
  AlertTriangle,
} from "lucide-react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  getEvents,
  getGraph,
} from "../services/api";

import EvidenceMap from "../components/EvidenceMap";
import IncidentReplay from "../components/IncidentReplay";
import RootCausePath from "../components/RootCausePath";
import MissingEvidence from "../components/MissingEvidence";

import {
  generateHypothesis,
} from "../utils/investigationEngine";

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
   HELPERS
========================================================= */

function getEventId(event) {
  return (
    event?.id ||
    event?.event_id ||
    ""
  );
}


function getEventTitle(event) {
  return (
    event?.title ||
    event?.name ||
    "Unknown Event"
  );
}


function getEventSource(event) {
  return (
    event?.source ||
    "System"
  );
}


function getSourceIcon(source) {
  const normalized = String(source || "")
    .trim()
    .toLowerCase();

  return (
    sourceIcons[normalized] ||
    GitBranch
  );
}


function getValidDate(timestamp) {
  if (!timestamp) {
    return null;
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}


function formatTime(timestamp) {
  const date = getValidDate(timestamp);

  if (!date) {
    return "--:--";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}


function formatDateTime(timestamp) {
  const date = getValidDate(timestamp);

  if (!date) {
    return "Unknown";
  }

  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}


function getMinutesBetween(first, second) {
  const firstDate = getValidDate(
    first?.timestamp
  );

  const secondDate = getValidDate(
    second?.timestamp
  );

  if (!firstDate || !secondDate) {
    return 0;
  }

  return Math.max(
    0,
    Math.round(
      (
        secondDate.getTime() -
        firstDate.getTime()
      ) / 60000
    )
  );
}


/* =========================================================
   NORMALIZE EVENTS

   Backend currently returns:

   {
     id,
     source,
     title,
     description,
     timestamp,
     event_type
   }

   Some older components use event_id.

   We keep both.
========================================================= */

function normalizeEvents(events) {
  if (!Array.isArray(events)) {
    return [];
  }

  return events
    .map((event) => {
      const id = getEventId(event);

      return {
        ...event,

        id,

        event_id:
          event?.event_id ||
          id,
      };
    })
    .filter((event) => getEventId(event))
    .sort((a, b) => {
      const timeA =
        getValidDate(
          a.timestamp
        )?.getTime();

      const timeB =
        getValidDate(
          b.timestamp
        )?.getTime();

      if (timeA == null) {
        return 1;
      }

      if (timeB == null) {
        return -1;
      }

      return timeA - timeB;
    });
}


/* =========================================================
   NORMALIZE RELATIONSHIPS

   Supported:

   {
     source,
     target,
     relationship
   }

   Also:

   {
     from_id,
     to_id,
     relationship
   }
========================================================= */

function normalizeRelationships(
  relationships
) {
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

      const type =
        relationship?.relationship ??
        relationship?.type ??
        "RELATED_TO";

      if (!source || !target) {
        return null;
      }

      return {
        source: String(source),
        target: String(target),
        relationship: String(type),
      };
    })
    .filter(Boolean);
}


/* =========================================================
   RELATIONSHIP WEIGHT
========================================================= */

function relationshipWeight(type) {
  const weights = {
    CAUSED_BY: 96,
    LEADS_TO: 94,
    SUPPORTS: 92,
    PRECEDES: 88,
    RELATED_TO: 82,
    CONTRADICTS: 72,
  };

  return (
    weights[
      String(type || "").toUpperCase()
    ] || 75
  );
}


/* =========================================================
   INVESTIGATION
========================================================= */

export default function Investigation() {
  const location = useLocation();
  const navigate = useNavigate();

  /* =======================================================
     STATE
  ======================================================= */

  const [events, setEvents] =
    useState([]);

  const [relationships, setRelationships] =
    useState([]);

  const [selectedEvent, setSelectedEvent] =
    useState(null);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  /* =======================================================
     LOAD EVENTS + GRAPH
  ======================================================= */

  useEffect(() => {
    let isMounted = true;

    async function loadInvestigation() {
      try {
        setIsLoading(true);
        setError("");

        /* -----------------------------------------------
           EVENTS
        ------------------------------------------------ */

        const eventsResponse =
          await getEvents();

        /* -----------------------------------------------
           GRAPH
        ------------------------------------------------ */

        const graphResponse =
          await getGraph();

        console.log(
          "CHRONOGRAPH EVENTS RESPONSE:",
          eventsResponse
        );

        console.log(
          "CHRONOGRAPH GRAPH RESPONSE:",
          graphResponse
        );

        /* -----------------------------------------------
           EXTRACT EVENTS
        ------------------------------------------------ */

        const backendEvents =
          Array.isArray(eventsResponse)
            ? eventsResponse
            : eventsResponse?.events || [];

        /* -----------------------------------------------
           GRAPH NODES
        ------------------------------------------------ */

        const graphNodes =
          Array.isArray(
            graphResponse?.nodes
          )
            ? graphResponse.nodes
            : [];

        /* -----------------------------------------------
           PREFER GRAPH NODES
        ------------------------------------------------ */

        const sourceEvents =
          graphNodes.length > 0
            ? graphNodes
            : backendEvents;

        /* -----------------------------------------------
           NORMALIZE
        ------------------------------------------------ */

        const normalizedEvents =
          normalizeEvents(
            sourceEvents
          );

        const normalizedRelationships =
          normalizeRelationships(
            graphResponse?.relationships
          );

        console.log(
          "CHRONOGRAPH INVESTIGATION EVENTS:",
          normalizedEvents
        );

        console.log(
          "CHRONOGRAPH REAL RELATIONSHIPS:",
          normalizedRelationships
        );

        if (isMounted) {
          setEvents(
            normalizedEvents
          );

          setRelationships(
            normalizedRelationships
          );
        }
      } catch (err) {
        console.error(
          "Failed to load investigation:",
          err
        );

        if (isMounted) {
          setError(
            err?.message ||
              "Failed to load investigation data."
          );

          setEvents([]);
          setRelationships([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInvestigation();

    return () => {
      isMounted = false;
    };
  }, []);


  /* =======================================================
     QUERY PARAMETER

     Supports:

     /investigation?event=EVT-001
  ======================================================= */

  const queryEventId =
    useMemo(() => {
      const params =
        new URLSearchParams(
          location.search
        );

      return (
        params.get("event") || ""
      );
    }, [location.search]);


  /* =======================================================
     SELECT EVENT FROM URL
  ======================================================= */

  useEffect(() => {
    if (!queryEventId) {
      return;
    }

    const matchingEvent =
      events.find(
        (event) =>
          getEventId(event) ===
          queryEventId
      );

    if (matchingEvent) {
      setSelectedEvent(
        matchingEvent
      );
    }
  }, [
    queryEventId,
    events,
  ]);


  /* =======================================================
     SELECT EVENT FROM NAVIGATION GAP
  ======================================================= */

  useEffect(() => {
    const incomingGap =
      location.state?.gap;

    if (!incomingGap) {
      return;
    }

    const fromId =
      getEventId(
        incomingGap.from
      );

    const matchingEvent =
      events.find(
        (event) =>
          getEventId(event) ===
          fromId
      );

    if (matchingEvent) {
      setSelectedEvent(
        matchingEvent
      );
    }
  }, [
    location.state,
    events,
  ]);


  /* =======================================================
     FILTER EVENTS
  ======================================================= */

  const filteredEvents =
    useMemo(() => {
      const query =
        searchTerm
          .trim()
          .toLowerCase();

      if (!query) {
        return events;
      }

      return events.filter(
        (event) => {
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

          return searchableText.includes(
            query
          );
        }
      );
    }, [
      events,
      searchTerm,
    ]);


  /* =======================================================
     TEMPORAL GAPS

     A gap >= 30 minutes becomes an
     investigation point.
  ======================================================= */

  const gaps =
    useMemo(() => {
      if (events.length < 2) {
        return [];
      }

      const detectedGaps = [];

      for (
        let index = 0;
        index < events.length - 1;
        index += 1
      ) {
        const from =
          events[index];

        const to =
          events[index + 1];

        const minutes =
          getMinutesBetween(
            from,
            to
          );

        if (minutes >= 30) {
          detectedGaps.push({
            id:
              `${getEventId(from)}-${getEventId(to)}`,

            from,
            to,

            minutes,

            duration:
              minutes * 60000,
          });
        }
      }

      return detectedGaps;
    }, [events]);


  /* =======================================================
     SELECTED GAP

     Priority:

     1. Navigation gap
     2. Gap around selected event
     3. First detected gap
     4. Largest gap
  ======================================================= */

  const selectedGap =
    useMemo(() => {
      /* -----------------------------------------------
         1. GAP PASSED FROM ANOTHER PAGE
      ------------------------------------------------ */

      const incomingGap =
        location.state?.gap;

      if (incomingGap) {
        const fromId =
          getEventId(
            incomingGap.from
          );

        const toId =
          getEventId(
            incomingGap.to
          );

        const from =
          events.find(
            (event) =>
              getEventId(event) ===
              fromId
          );

        const to =
          events.find(
            (event) =>
              getEventId(event) ===
              toId
          );

        if (from && to) {
          const minutes =
            getMinutesBetween(
              from,
              to
            );

          return {
            id:
              `${fromId}-${toId}`,

            from,
            to,

            fromEvent: from,
            toEvent: to,

            minutes,

            duration:
              minutes * 60000,
          };
        }
      }


      /* -----------------------------------------------
         2. GAP AROUND SELECTED EVENT
      ------------------------------------------------ */

      if (
        selectedEvent &&
        events.length > 1
      ) {
        const selectedId =
          getEventId(
            selectedEvent
          );

        const selectedIndex =
          events.findIndex(
            (event) =>
              getEventId(event) ===
              selectedId
          );

        if (
          selectedIndex >= 0 &&
          selectedIndex <
            events.length - 1
        ) {
          const from =
            events[selectedIndex];

          const to =
            events[
              selectedIndex + 1
            ];

          const minutes =
            getMinutesBetween(
              from,
              to
            );

          if (minutes >= 30) {
            return {
              id:
                `${getEventId(from)}-${getEventId(to)}`,

              from,
              to,

              fromEvent: from,
              toEvent: to,

              minutes,

              duration:
                minutes * 60000,
            };
          }
        }
      }


      /* -----------------------------------------------
         3. FIRST DETECTED GAP
      ------------------------------------------------ */

      if (gaps.length > 0) {
        return gaps[0];
      }


      /* -----------------------------------------------
         4. FALLBACK: LARGEST GAP
      ------------------------------------------------ */

      if (events.length < 2) {
        return null;
      }

      let largestGap = null;

      for (
        let index = 1;
        index < events.length;
        index += 1
      ) {
        const previous =
          events[index - 1];

        const current =
          events[index];

        const start =
          getValidDate(
            previous.timestamp
          );

        const end =
          getValidDate(
            current.timestamp
          );

        if (!start || !end) {
          continue;
        }

        const duration =
          end.getTime() -
          start.getTime();

        if (duration <= 0) {
          continue;
        }

        if (
          !largestGap ||
          duration >
            largestGap.duration
        ) {
          largestGap = {
            id:
              `${getEventId(previous)}-${getEventId(current)}`,

            from: previous,
            to: current,

            fromEvent: previous,
            toEvent: current,

            duration,

            minutes:
              Math.round(
                duration / 60000
              ),
          };
        }
      }

      return largestGap;
    }, [
      location.state,
      selectedEvent,
      events,
      gaps,
    ]);


  /* =======================================================
     RELATIONSHIP LOOKUP
  ======================================================= */

  const relationshipLookup =
    useMemo(() => {
      const lookup =
        new Map();

      relationships.forEach(
        (relationship) => {
          const source =
            relationship.source;

          const target =
            relationship.target;

          /* ---------------------------------------------
             FORWARD
          ---------------------------------------------- */

          const forwardKey =
            `${source}::${target}`;

          lookup.set(
            forwardKey,
            relationship
          );


          /* ---------------------------------------------
             REVERSE

             Useful because the investigation
             cares about connectivity.
          ---------------------------------------------- */

          const reverseKey =
            `${target}::${source}`;

          if (
            !lookup.has(
              reverseKey
            )
          ) {
            lookup.set(
              reverseKey,
              {
                ...relationship,

                source: target,
                target: source,

                reverse: true,
              }
            );
          }
        }
      );

      return lookup;
    }, [
      relationships,
    ]);


  /* =======================================================
     FIND SUPPORTING EVIDENCE

     Priority:

     1. Real Neo4j relationship
     2. Temporal proximity
     3. Cross-source evidence
  ======================================================= */

  const candidates =
    useMemo(() => {
      if (
        !selectedGap ||
        events.length === 0
      ) {
        return [];
      }

      const fromTime =
        getValidDate(
          selectedGap.from.timestamp
        )?.getTime();

      const toTime =
        getValidDate(
          selectedGap.to.timestamp
        )?.getTime();

      if (
        fromTime == null ||
        toTime == null
      ) {
        return [];
      }

      const fromId =
        getEventId(
          selectedGap.from
        );

      const toId =
        getEventId(
          selectedGap.to
        );

      const totalDistance =
        Math.max(
          1,
          toTime - fromTime
        );

      return events
        .filter(
          (event) => {
            const id =
              getEventId(event);

            return (
              id !== fromId &&
              id !== toId
            );
          }
        )
        .map(
          (event) => {
            const id =
              getEventId(event);

            const eventDate =
              getValidDate(
                event.timestamp
              );

            const eventTime =
              eventDate?.getTime();


            /* -----------------------------------------
               GRAPH RELATIONSHIPS
            ------------------------------------------ */

            const relationshipFrom =
              relationshipLookup.get(
                `${fromId}::${id}`
              );

            const relationshipTo =
              relationshipLookup.get(
                `${id}::${toId}`
              );

            const relationshipFromTo =
              relationshipLookup.get(
                `${fromId}::${toId}`
              );

            const relationshipToFrom =
              relationshipLookup.get(
                `${toId}::${fromId}`
              );


            let score = 0;

            let evidenceType =
              "TEMPORAL";

            let relationshipType =
              null;


            /* -----------------------------------------
               RELATIONSHIP FROM START
            ------------------------------------------ */

            if (
              relationshipFrom
            ) {
              score =
                Math.max(
                  score,
                  relationshipWeight(
                    relationshipFrom.relationship
                  )
                );

              relationshipType =
                relationshipFrom.relationship;

              evidenceType =
                "GRAPH";
            }


            /* -----------------------------------------
               RELATIONSHIP TO END
            ------------------------------------------ */

            if (
              relationshipTo
            ) {
              score =
                Math.max(
                  score,
                  relationshipWeight(
                    relationshipTo.relationship
                  )
                );

              relationshipType =
                relationshipTo.relationship;

              evidenceType =
                "GRAPH";
            }


            /* -----------------------------------------
               DIRECT GAP RELATIONSHIP
            ------------------------------------------ */

            if (
              relationshipFromTo ||
              relationshipToFrom
            ) {
              const direct =
                relationshipFromTo ||
                relationshipToFrom;

              score =
                Math.max(
                  score,
                  relationshipWeight(
                    direct.relationship
                  ) - 3
                );

              relationshipType =
                direct.relationship;

              evidenceType =
                "GRAPH";
            }


            /* -----------------------------------------
               TEMPORAL PROXIMITY
            ------------------------------------------ */

            if (
              eventTime != null
            ) {
              const distanceFromStart =
                Math.abs(
                  eventTime -
                  fromTime
                );

              const distanceFromEnd =
                Math.abs(
                  toTime -
                  eventTime
                );

              const nearestDistance =
                Math.min(
                  distanceFromStart,
                  distanceFromEnd
                );

              const closeness =
                Math.max(
                  0,
                  1 -
                    nearestDistance /
                      totalDistance
                );

              const temporalScore =
                Math.round(
                  50 +
                    closeness * 35
                );

              score =
                Math.max(
                  score,
                  temporalScore
                );


              /* ---------------------------------------
                 EVENT INSIDE GAP
              ---------------------------------------- */

              if (
                eventTime >=
                  fromTime &&
                eventTime <=
                  toTime
              ) {
                score =
                  Math.max(
                    score,
                    72
                  );
              }
            }


            /* -----------------------------------------
               CROSS-SOURCE SIGNAL
            ------------------------------------------ */

            if (
              event.source &&
              event.source !==
                selectedGap.from.source &&
              event.source !==
                selectedGap.to.source
            ) {
              score += 4;
            }


            /* -----------------------------------------
               EVENT TYPE SIGNAL
            ------------------------------------------ */

            const eventType =
              String(
                event.event_type ||
                  ""
              ).toLowerCase();

            const title =
              String(
                event.title ||
                  ""
              ).toLowerCase();

            const description =
              String(
                event.description ||
                  ""
              ).toLowerCase();

            const searchableText =
              `${title} ${description} ${eventType}`;


            const keywords = [
              "migration",
              "infrastructure",
              "configuration",
              "deploy",
              "deployment",
              "update",
              "change",
              "cloud",
              "aws",
              "gcp",
              "security",
              "network",
              "access",
              "login",
            ];


            keywords.forEach(
              (keyword) => {
                if (
                  searchableText.includes(
                    keyword
                  )
                ) {
                  score += 2;
                }
              }
            );


            /* -----------------------------------------
               EVENT TYPE BOOST
            ------------------------------------------ */

            if (
              eventType.includes(
                "update"
              ) ||
              eventType.includes(
                "change"
              ) ||
              eventType.includes(
                "deployment"
              )
            ) {
              score += 10;
            }


            /* -----------------------------------------
               FINAL SCORE
            ------------------------------------------ */

            score =
              Math.min(
                98,
                Math.max(
                  35,
                  Math.round(score)
                )
              );


            return {
              ...event,

              event_id:
                event.event_id ||
                id,

              score,

              evidenceType,

              relationship:
                relationshipType,
            };
          }
        )
        .filter(
          (event) =>
            event.score >= 55
        )
        .sort(
          (a, b) =>
            b.score -
            a.score
        )
        .slice(0, 5);
    }, [
      selectedGap,
      events,
      relationshipLookup,
    ]);


  /* =======================================================
     AI HYPOTHESIS
  ======================================================= */

  const hypothesis =
    useMemo(() => {
      try {
        return generateHypothesis(
          selectedGap,
          candidates
        );
      } catch (err) {
        console.error(
          "Hypothesis generation failed:",
          err
        );

        return {
          title:
            "Insufficient evidence for reconstruction.",

          explanation:
            "ChronoGraph could not generate a reliable hypothesis from the available evidence.",

          confidence: 0,

          signals: [],
        };
      }
    }, [
      selectedGap,
      candidates,
    ]);


  /* =======================================================
     ROOT CAUSE SEQUENCE
  ======================================================= */

  const rootCauseEvents =
    useMemo(() => {
      if (!selectedGap) {
        return events.slice(
          0,
          3
        );
      }

      const strongest =
        candidates[0];

      const sequence = [
        selectedGap.from,
      ];


      if (
        strongest &&
        getEventId(strongest) !==
          getEventId(
            selectedGap.from
          ) &&
        getEventId(strongest) !==
          getEventId(
            selectedGap.to
          )
      ) {
        sequence.push(
          strongest
        );
      }


      sequence.push(
        selectedGap.to
      );

      return sequence;
    }, [
      selectedGap,
      candidates,
      events,
    ]);


  /* =======================================================
     SUMMARY
  ======================================================= */

  const sourceCount =
    useMemo(() => {
      return new Set(
        events
          .map(
            (event) =>
              event?.source
          )
          .filter(Boolean)
      ).size;
    }, [
      events,
    ]);


  const realRelationshipCount =
    relationships.length;


  const sequenceConfidence =
    events.length === 0
      ? 0
      : Number(
          hypothesis?.confidence
        ) ||
        (
          realRelationshipCount > 0
            ? 82
            : candidates.length > 0
              ? 72
              : 65
        );


  /* =======================================================
     SELECT EVENT
  ======================================================= */

  function handleSelectEvent(
    event
  ) {
    setSelectedEvent(
      event
    );
  }


  /* =======================================================
     CLEAR SELECTION
  ======================================================= */

  function clearSelection() {
    setSelectedEvent(
      null
    );
  }


  /* =======================================================
     EVENT RELEVANCE
  ======================================================= */

  function getEventRelevance(
    event
  ) {
    if (!event) {
      return 0;
    }

    const candidate =
      candidates.find(
        (item) =>
          getEventId(item) ===
          getEventId(event)
      );

    if (candidate) {
      return candidate.score;
    }

    const hasRelationship =
      relationships.some(
        (relationship) =>
          relationship.source ===
            getEventId(event) ||
          relationship.target ===
            getEventId(event)
      );

    return hasRelationship
      ? 90
      : 0;
  }


  /* =======================================================
     RENDER
  ======================================================= */

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
            Examine temporal gaps, graph
            relationships and the evidence
            surrounding the incident.
          </p>

        </div>


        <div className="graph-status">

          <span className="status-dot" />

          {isLoading
            ? "ANALYZING EVIDENCE"
            : error
              ? "INVESTIGATION DEGRADED"
              : "INVESTIGATION READY"}

        </div>

      </section>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <section className="panel investigation-error">

          <AlertTriangle size={18} />

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
          SUMMARY METRICS
      ================================================= */}

      <section className="metrics">

        <div className="metric-card">

          <span>
            TOTAL EVENTS
          </span>

          <strong>
            {events.length}
          </strong>

          <small>
            Across {sourceCount} sources
          </small>

        </div>


        <div className="metric-card">

          <span>
            GRAPH RELATIONSHIPS
          </span>

          <strong>
            {realRelationshipCount}
          </strong>

          <small>
            Neo4j evidence links
          </small>

        </div>


        <div className="metric-card">

          <span>
            UNEXPLAINED GAPS
          </span>

          <strong>
            {gaps.length}
          </strong>

          <small>
            Potential investigation points
          </small>

        </div>


        <div className="metric-card accent">

          <span>
            SEQUENCE CONFIDENCE
          </span>

          <strong>
            {events.length > 0
              ? `${sequenceConfidence}%`
              : "—"}
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
                  setSearchTerm(
                    event.target.value
                  )
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
                ChronoGraph is retrieving
                events and graph relationships
                from Neo4j.
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
                  No events match the current
                  search.
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
                      getEventId(
                        event
                      );

                    const isSelected =
                      selectedEvent &&
                      getEventId(
                        selectedEvent
                      ) === eventId;


                    const hasGraphRelationship =
                      relationships.some(
                        (relationship) =>
                          relationship.source ===
                            eventId ||
                          relationship.target ===
                            eventId
                      );


                    return (
                      <div
                        className={`investigation-event ${
                          isSelected
                            ? "selected"
                            : ""
                        }`}
                        key={
                          eventId ||
                          index
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
                          type="button"
                          className="sequence-event-button"
                          onClick={() =>
                            handleSelectEvent(
                              event
                            )
                          }
                        >

                          <div className="sequence-event-top">

                            <span>
                              {getEventSource(
                                event
                              )}
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


                          {event.event_type && (
                            <span className="event-graph-badge">

                              <ShieldCheck
                                size={11}
                              />

                              {event.event_type}

                            </span>
                          )}


                          {hasGraphRelationship && (
                            <span className="event-graph-badge">

                              <GitBranch
                                size={11}
                              />

                              GRAPH LINKED

                            </span>
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
            RIGHT INSPECTOR
        ================================================= */}

        <aside className="panel investigation-inspector">

          {selectedEvent ? (

            <>

              <div className="inspector-top">

                <span className="eyebrow">
                  SELECTED EVIDENCE
                </span>

                <button
                  type="button"
                  className="close-button"
                  onClick={
                    clearSelection
                  }
                  aria-label="Close selected evidence"
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
                    {getEventSource(
                      selectedEvent
                    )}
                  </span>

                  <strong>
                    {getEventId(
                      selectedEvent
                    )}
                  </strong>

                </div>

              </div>


              {/* TITLE */}

              <h2>
                {getEventTitle(
                  selectedEvent
                )}
              </h2>


              {/* DESCRIPTION */}

              <p className="inspector-description">

                {selectedEvent.description ||
                  "No additional description is available for this evidence event."}

              </p>


              {/* DATA */}

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


              {/* SEQUENCE POSITION */}

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
                    ) + 1}

                    {" / "}

                    {events.length}

                  </strong>

                </div>

              </div>


              {/* GRAPH CONNECTIONS */}

              <div className="investigation-detail-card">

                <div className="detail-icon">
                  <Network size={16} />
                </div>

                <div>

                  <span>
                    GRAPH CONNECTIONS
                  </span>

                  <strong>

                    {
                      relationships.filter(
                        (relationship) =>
                          relationship.source ===
                            getEventId(
                              selectedEvent
                            ) ||
                          relationship.target ===
                            getEventId(
                              selectedEvent
                            )
                      ).length
                    }

                  </strong>

                </div>

              </div>


              {/* NEXT GAP */}

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


              {/* EVIDENCE RELEVANCE */}

              <div className="evidence-confidence">

                <div>

                  <span>
                    EVIDENCE RELEVANCE
                  </span>

                  <strong>
                    {getEventRelevance(
                      selectedEvent
                    ) > 0
                      ? `${getEventRelevance(
                          selectedEvent
                        )}%`
                      : "—"}
                  </strong>

                </div>


                <div className="confidence-bar">

                  <div
                    style={{
                      width: `${getEventRelevance(
                        selectedEvent
                      )}%`,
                    }}
                  />

                </div>

              </div>


              {/* RETURN */}

              <button
                type="button"
                className="trace-button"
                onClick={
                  clearSelection
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
                Select an event to inspect
                its source, timestamp, graph
                connections and position in
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
                    {realRelationshipCount}
                  </strong>

                  <span>
                    GRAPH LINKS
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

            {gaps.map(
              (gap, index) => (

                <button
                  type="button"
                  className={`gap-card ${
                    selectedGap?.id ===
                    gap.id
                      ? "selected"
                      : ""
                  }`}
                  key={gap.id}
                  onClick={() =>
                    setSelectedEvent(
                      gap.from
                    )
                  }
                >

                  <div className="gap-index">

                    {String(
                      index + 1
                    ).padStart(
                      2,
                      "0"
                    )}

                  </div>


                  <div className="gap-events">

                    <span>
                      {getEventSource(
                        gap.from
                      )}
                    </span>

                    <strong>
                      {getEventTitle(
                        gap.from
                      )}
                    </strong>

                    <small>
                      {formatTime(
                        gap.from.timestamp
                      )}
                    </small>

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
                      {getEventSource(
                        gap.to
                      )}
                    </span>

                    <strong>
                      {getEventTitle(
                        gap.to
                      )}
                    </strong>

                    <small>
                      {formatTime(
                        gap.to.timestamp
                      )}
                    </small>

                  </div>

                </button>

              )
            )}

          </div>

        )}

      </section>


      {/* =================================================
          EVIDENCE MAP
      ================================================= */}

      {selectedGap && (

        <EvidenceMap
          events={events}
          gap={selectedGap}
          candidates={candidates}
        />

      )}


      {/* =================================================
          ROOT CAUSE PATH
      ================================================= */}

      {events.length > 0 && (

        <RootCausePath
          events={
            rootCauseEvents
          }
        />

      )}


      {/* =================================================
          INCIDENT REPLAY
      ================================================= */}

      {events.length > 0 && (

        <IncidentReplay
          events={events}
        />

      )}


      {/* =================================================
          AI INVESTIGATION VERDICT
      ================================================= */}

      {events.length > 0 && (

        <section className="investigation-verdict">

          <div className="verdict-header">

            <div>

              <p className="eyebrow">
                INVESTIGATION VERDICT
              </p>

              <h2>
                {hypothesis?.title ||
                  "Evidence reconstruction"}
              </h2>

            </div>


            <div className="verdict-confidence">

              <strong>
                {sequenceConfidence}%
              </strong>

              <span>
                CONFIDENCE
              </span>

            </div>

          </div>


          <div className="verdict-body">

            {/* TEMPORAL */}

            <div className="verdict-item">

              <span>
                TEMPORAL EVIDENCE
              </span>

              <strong>

                {gaps.length > 0
                  ? `${gaps.length} unexplained transition${
                      gaps.length > 1
                        ? "s"
                        : ""
                    } detected`
                  : "No major temporal gaps"}

              </strong>

            </div>


            {/* GRAPH */}

            <div className="verdict-item">

              <span>
                GRAPH EVIDENCE
              </span>

              <strong>

                {realRelationshipCount > 0
                  ? `${realRelationshipCount} Neo4j relationship${
                      realRelationshipCount > 1
                        ? "s"
                        : ""
                    } available`
                  : "No explicit graph relationships found"}

              </strong>

            </div>


            {/* STRONGEST */}

            <div className="verdict-item">

              <span>
                STRONGEST SIGNAL
              </span>

              <strong>

                {candidates[0]
                  ? `${getEventTitle(
                      candidates[0]
                    )} · ${
                      candidates[0].score
                    }%`
                  : "No supporting candidate"}

              </strong>

            </div>

          </div>


          {/* EXPLANATION */}

          <div className="verdict-note">

            <Sparkles size={16} />

            <span>

              {hypothesis?.explanation ||
                "No explanation is currently available."}

            </span>

          </div>


          {/* SIGNALS */}

          {hypothesis?.signals?.length >
            0 && (

            <div className="verdict-signals">

              {hypothesis.signals.map(
                (
                  signal,
                  index
                ) => (

                  <span
                    key={`${signal}-${index}`}
                  >
                    {signal}
                  </span>

                )
              )}

            </div>

          )}

        </section>

      )}


      {/* =================================================
          MISSING EVIDENCE
      ================================================= */}

      <MissingEvidence
        events={events}
      />


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
            {hypothesis?.title ||
              "Reconstructing incident sequence"}
          </h2>


          <p>

            ChronoGraph has organized{" "}

            <strong>
              {events.length}
            </strong>{" "}

            evidence events into a temporal
            sequence across{" "}

            <strong>
              {sourceCount}
            </strong>{" "}

            independent sources with{" "}

            <strong>
              {realRelationshipCount}
            </strong>{" "}

            explicit graph relationships.

          </p>

        </div>


        <div className="ai-confidence">

          <span>
            SEQUENCE CONFIDENCE
          </span>


          <strong>

            {events.length > 0
              ? `${sequenceConfidence}%`
              : "—"}

          </strong>


          <div className="confidence-bar">

            <div
              style={{
                width:
                  events.length > 0
                    ? `${sequenceConfidence}%`
                    : "0%",
              }}
            />

          </div>

        </div>

      </section>

    </main>
  );
}