import { useEffect, useMemo, useState } from "react";

import {
  AlertTriangle,
  Clock3,
  GitBranch,
  MessageSquare,
  Mail,
  Search,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

import EvidenceMap from "../components/EvidenceMap";

import { useLocation, useNavigate } from "react-router-dom";

import { getEvents } from "../services/api";

import { generateHypothesis } from "../utils/investigationEngine";


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
   HELPERS
========================================================= */

function getEventId(event) {
  return event?.id || event?.event_id || "";
}


function getEventTitle(event) {
  return (
    event?.title ||
    event?.name ||
    "Unknown Event"
  );
}


function getEventSource(event) {
  return event?.source || "System";
}


function getEventDescription(event) {
  return (
    event?.description ||
    "No additional description is available for this event."
  );
}


function getEventType(event) {
  return (
    event?.event_type ||
    event?.type ||
    "Evidence Event"
  );
}


function safeDate(timestamp) {
  const date = new Date(timestamp);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}


function formatTime(timestamp) {
  const date = safeDate(timestamp);

  if (!date) {
    return "Unknown time";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}


function formatDate(timestamp) {
  const date = safeDate(timestamp);

  if (!date) {
    return "Unknown date";
  }

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}


/* =========================================================
   COMPONENT
========================================================= */

export default function Investigation() {

  const location = useLocation();

  const navigate = useNavigate();


  /* =======================================================
     INVESTIGATION CONTEXT
  ======================================================= */

  const gap = location.state?.gap;


  /* =======================================================
     STATE
  ======================================================= */

  const [events, setEvents] = useState([]);

  const [isLoadingEvents, setIsLoadingEvents] =
    useState(true);

  const [eventsError, setEventsError] =
    useState("");

  const [isAnalyzing, setIsAnalyzing] =
    useState(true);


  /* =======================================================
     LOAD EVENTS FROM BACKEND
  ======================================================= */

  useEffect(() => {

    let mounted = true;


    async function loadEvents() {

      try {

        setIsLoadingEvents(true);

        setEventsError("");


        const response = await getEvents();


        console.log(
          "INVESTIGATION BACKEND RESPONSE:",
          JSON.stringify(response, null, 2)
        );


        const backendEvents =
          Array.isArray(response)
            ? response
            : response?.events || [];


        if (!mounted) {
          return;
        }


        setEvents(backendEvents);

      } catch (error) {

        console.error(
          "Failed to load investigation events:",
          error
        );


        if (mounted) {

          setEventsError(
            error?.message ||
            "Failed to load investigation events"
          );

        }

      } finally {

        if (mounted) {
          setIsLoadingEvents(false);
        }

      }

    }


    loadEvents();


    return () => {
      mounted = false;
    };

  }, []);


  /* =======================================================
     FINISH ANALYSIS
  ======================================================= */

  useEffect(() => {

    if (!isLoadingEvents) {

      const timer = setTimeout(() => {

        setIsAnalyzing(false);

      }, 700);


      return () => clearTimeout(timer);

    }

  }, [isLoadingEvents]);


  /* =======================================================
     NO GAP SELECTED
  ======================================================= */

  if (!gap) {

    return (

      <main className="investigation-page">

        <div className="investigation-empty">

          <AlertTriangle size={28} />


          <p className="eyebrow">
            NO INVESTIGATION CONTEXT
          </p>


          <h1>
            No evidence gap selected.
          </h1>


          <p>
            Select an unexplained transition from the
            dashboard to begin a temporal investigation.
          </p>


          <button
            className="trace-button"
            onClick={() => navigate("/")}
          >

            <ArrowLeft size={15} />

            Back to dashboard

          </button>

        </div>

      </main>

    );

  }


  /* =======================================================
     GAP EVENT SAFETY
  ======================================================= */

  const gapFrom = gap.from || {};

  const gapTo = gap.to || {};


  const fromId =
    getEventId(gapFrom);


  const toId =
    getEventId(gapTo);


  const fromTime =
    safeDate(gapFrom.timestamp);


  const toTime =
    safeDate(gapTo.timestamp);


  /* =======================================================
     FIND SUPPORTING EVENTS
  ======================================================= */

  const candidates = useMemo(() => {

    if (!events.length) {
      return [];
    }


    if (!fromTime || !toTime) {
      return [];
    }


    return events

      .filter((event) => {

        const eventId =
          getEventId(event);


        return (
          eventId !== fromId &&
          eventId !== toId
        );

      })


      .map((event) => {

        const eventTime =
          safeDate(event.timestamp);


        if (!eventTime) {
          return {
            ...event,
            score: 0,
          };
        }


        const distanceFromStart =
          Math.abs(
            eventTime.getTime() -
            fromTime.getTime()
          ) / 60000;


        const distanceFromEnd =
          Math.abs(
            eventTime.getTime() -
            toTime.getTime()
          ) / 60000;


        const nearestDistance =
          Math.min(
            distanceFromStart,
            distanceFromEnd
          );


        let score = 0;


        /* -----------------------------------------------
           TEMPORAL RELEVANCE
        ----------------------------------------------- */

        if (nearestDistance <= 15) {

          score += 45;

        } else if (nearestDistance <= 30) {

          score += 35;

        } else if (nearestDistance <= 60) {

          score += 25;

        } else if (nearestDistance <= 120) {

          score += 10;

        }


        /* -----------------------------------------------
           INDEPENDENT SOURCE
        ----------------------------------------------- */

        if (
          getEventSource(event) !==
            getEventSource(gapFrom) &&
          getEventSource(event) !==
            getEventSource(gapTo)
        ) {

          score += 20;

        }


        /* -----------------------------------------------
           EVENT TYPE
        ----------------------------------------------- */

        const eventType =
          getEventType(event).toLowerCase();


        if (
          eventType.includes("update") ||
          eventType.includes("change") ||
          eventType.includes("deployment") ||
          eventType.includes("deploy") ||
          eventType.includes("migration")
        ) {

          score += 20;

        }


        /* -----------------------------------------------
           CONTEXTUAL KEYWORDS
        ----------------------------------------------- */

        const text = `
          ${getEventTitle(event)}
          ${getEventDescription(event)}
          ${getEventType(event)}
          ${getEventSource(event)}
        `.toLowerCase();


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
          "server",
          "network",
          "security",
          "database",
        ];


        keywords.forEach((keyword) => {

          if (text.includes(keyword)) {

            score += 2;

          }

        });


        return {
          ...event,
          score: Math.min(score, 99),
        };

      })


      .filter(
        (event) => event.score >= 20
      )


      .sort(
        (a, b) => b.score - a.score
      )


      .slice(0, 4);

  }, [
    events,
    fromId,
    toId,
    fromTime,
    toTime,
    gapFrom,
    gapTo,
  ]);


  /* =======================================================
     ROOT CAUSE HYPOTHESIS
  ======================================================= */

  const hypothesis = useMemo(() => {

    try {

      const result =
        generateHypothesis(
          gap,
          candidates
        );


      return {
        title:
          result?.title ||
          "Possible operational sequence",

        confidence:
          typeof result?.confidence === "number"
            ? result.confidence
            : candidates.length > 0
              ? Math.min(
                  60 + candidates[0].score / 3,
                  95
                )
              : 20,

        explanation:
          result?.explanation ||
          "The available evidence suggests a possible relationship between the events surrounding this transition.",

        signals:
          Array.isArray(result?.signals)
            ? result.signals
            : [
                "Temporal proximity between evidence events.",
                "Cross-source activity detected.",
                "Event context overlaps with the investigation window.",
              ],
      };

    } catch (error) {

      console.error(
        "Failed to generate hypothesis:",
        error
      );


      return {
        title:
          "Possible operational sequence",

        confidence:
          candidates.length > 0
            ? candidates[0].score
            : 20,

        explanation:
          "ChronoGraph identified temporal and contextual signals, but could not generate a complete hypothesis.",

        signals: [
          "Temporal evidence was detected.",
          "Supporting events were evaluated.",
          "Further evidence may be required.",
        ],
      };

    }

  }, [gap, candidates]);


  /* =======================================================
     TOP EVIDENCE
  ======================================================= */

  const topEvidence =
    candidates.length > 0
      ? candidates[0].score
      : 0;


  /* =======================================================
     INVESTIGATION SUMMARY
  ======================================================= */

  const gapMinutes =
    Number.isFinite(Number(gap.minutes))
      ? Number(gap.minutes)
      : fromTime && toTime
        ? Math.round(
            Math.abs(
              toTime.getTime() -
              fromTime.getTime()
            ) / 60000
          )
        : 0;


  const investigationSummary =
    candidates.length > 0

      ? `ChronoGraph identified ${candidates.length} related event${
          candidates.length > 1
            ? "s"
            : ""
        } that may explain the ${gapMinutes}-minute transition. The strongest supporting evidence has a relevance score of ${topEvidence}%.`

      : "ChronoGraph could not identify strong supporting evidence for this transition.";


  /* =======================================================
     PAGE
  ======================================================= */

  return (

    <main className="investigation-page">


      {/* =================================================
          HEADER
      ================================================= */}

      <section className="investigation-header">

        <div>

          <p className="eyebrow">
            AI INVESTIGATION
          </p>


          <h1>
            Investigate the gap.
          </h1>


          <p className="investigation-description">
            ChronoGraph is analyzing the unexplained
            transition between two evidence events.
          </p>

        </div>


        <div className="investigation-status">

          <span className="status-dot" />


          {isAnalyzing
            ? "ANALYZING EVIDENCE"
            : "ANALYSIS COMPLETE"}

        </div>

      </section>



      {/* =================================================
          ERROR / LOADING INFORMATION
      ================================================= */}

      {eventsError && (

        <div className="graph-error">

          {eventsError}

        </div>

      )}



      {/* =================================================
          MAIN GRID
      ================================================= */}

      <section className="investigation-grid">


        {/* =================================================
            LEFT CONTENT
        ================================================= */}

        <div className="investigation-main">


          {/* =================================================
              TEMPORAL ANOMALY
          ================================================= */}

          <div className="anomaly-card">

            <div className="anomaly-label">

              <AlertTriangle size={17} />

              TEMPORAL ANOMALY

            </div>


            <h2>
              {gapMinutes} minute unexplained gap
            </h2>


            <p className="anomaly-description">

              ChronoGraph detected a break in the
              expected sequence of events.

            </p>


            {/* FROM EVENT */}

            <div className="investigation-event">

              <div className="event-icon">

                {(() => {

                  const Icon =
                    sourceIcons[
                      getEventSource(gapFrom)
                    ] || GitBranch;


                  return <Icon size={19} />;

                })()}

              </div>


              <div>

                <span>

                  {getEventSource(gapFrom)}
                  {" · "}
                  {formatTime(gapFrom.timestamp)}

                </span>


                <strong>
                  {getEventTitle(gapFrom)}
                </strong>


                <small>
                  {getEventId(gapFrom)}
                </small>

              </div>

            </div>


            {/* GAP */}

            <div className="investigation-gap">

              <div className="gap-line">

                <span />

              </div>


              <div>

                <strong>
                  {gapMinutes} MINUTES
                </strong>

                <span>
                  UNEXPLAINED TRANSITION
                </span>

              </div>

            </div>


            {/* TO EVENT */}

            <div className="investigation-event">

              <div className="event-icon">

                {(() => {

                  const Icon =
                    sourceIcons[
                      getEventSource(gapTo)
                    ] || GitBranch;


                  return <Icon size={19} />;

                })()}

              </div>


              <div>

                <span>

                  {getEventSource(gapTo)}
                  {" · "}
                  {formatTime(gapTo.timestamp)}

                </span>


                <strong>
                  {getEventTitle(gapTo)}
                </strong>


                <small>
                  {getEventId(gapTo)}
                </small>

              </div>

            </div>

          </div>



          {/* =================================================
              ROOT CAUSE HYPOTHESIS
          ================================================= */}

          <div className="hypothesis-card">

            <div className="hypothesis-header">

              <div>

                <p className="eyebrow">

                  <Sparkles size={13} />

                  ROOT-CAUSE HYPOTHESIS

                </p>


                <h3>
                  {hypothesis.title}
                </h3>

              </div>


              <div className="hypothesis-confidence">

                <strong>
                  {Math.round(
                    hypothesis.confidence
                  )}%
                </strong>

                <span>
                  CONFIDENCE
                </span>

              </div>

            </div>



            {/* =================================================
                INVESTIGATION VERDICT
            ================================================= */}

            <div className="investigation-verdict">

              <div className="verdict-header">

                <div>

                  <p className="eyebrow">

                    <Sparkles size={13} />

                    INVESTIGATION VERDICT

                  </p>


                  <h2>
                    {hypothesis.title}
                  </h2>

                </div>


                <div className="verdict-confidence">

                  <strong>
                    {Math.round(
                      hypothesis.confidence
                    )}%
                  </strong>

                  <span>
                    CONFIDENCE
                  </span>

                </div>

              </div>


              <div className="verdict-body">

                <div className="verdict-item">

                  <span>
                    WHAT WE KNOW
                  </span>

                  <strong>
                    {candidates.length} related evidence
                    {candidates.length !== 1
                      ? "s"
                      : ""} identified
                  </strong>

                </div>


                <div className="verdict-item">

                  <span>
                    UNEXPLAINED WINDOW
                  </span>

                  <strong>
                    {gapMinutes} minutes
                  </strong>

                </div>


                <div className="verdict-item">

                  <span>
                    STRONGEST SIGNAL
                  </span>

                  <strong>

                    {candidates.length > 0
                      ? getEventTitle(
                          candidates[0]
                        )
                      : "No strong signal found"}

                  </strong>

                </div>

              </div>


              <div className="verdict-note">

                <ShieldCheck size={15} />

                <span>

                  This verdict summarizes the strongest
                  available evidence. Investigators should
                  verify the underlying events before
                  treating it as a confirmed conclusion.

                </span>

              </div>

            </div>


            <p className="hypothesis-explanation">

              {hypothesis.explanation}

            </p>



            {/* REASONING SIGNALS */}

            <div className="hypothesis-signals">

              <span className="eyebrow">
                REASONING SIGNALS
              </span>


              {hypothesis.signals.map(
                (signal, index) => (

                  <div
                    className="reasoning-signal"
                    key={index}
                  >

                    <span className="signal-number">
                      {String(
                        index + 1
                      ).padStart(2, "0")}
                    </span>


                    <span>
                      {signal}
                    </span>

                  </div>

                )
              )}

            </div>



            {/* DISCLAIMER */}

            <div className="hypothesis-disclaimer">

              <ShieldCheck size={14} />

              <span>

                Hypothesis generated from temporal
                and contextual evidence. Not a confirmed
                conclusion.

              </span>

            </div>

          </div>



          {/* =================================================
              AI REASONING SUMMARY
          ================================================= */}

          <div className="investigation-summary">

            <div className="summary-warning">

              <Sparkles size={20} />

            </div>


            <div>

              <p className="eyebrow">
                AI REASONING SUMMARY
              </p>


              <h2>
                What ChronoGraph found
              </h2>


              <p>
                {investigationSummary}
              </p>

            </div>

          </div>



          {/* =================================================
              SUMMARY METRICS
          ================================================= */}

          <div className="investigation-summary-metrics">

            <div className="summary-metric">

              <span>
                RELATED EVENTS
              </span>

              <strong>
                {candidates.length}
              </strong>

            </div>


            <div className="summary-metric">

              <span>
                GAP DURATION
              </span>

              <strong>
                {gapMinutes}m
              </strong>

            </div>


            <div className="summary-metric">

              <span>
                TOP EVIDENCE
              </span>

              <strong>
                {topEvidence}%
              </strong>

            </div>

          </div>



          {/* =================================================
              SUPPORTING EVIDENCE
          ================================================= */}

          <div className="ai-analysis-card">


            {/* =================================================
                EVIDENCE MAP
            ================================================= */}

            <div className="evidence-map-section">

              <EvidenceMap
                events={events}
                gap={gap}
                candidates={candidates}
              />

            </div>



            {/* =================================================
                AI ANALYSIS HEADER
            ================================================= */}

            <div className="ai-analysis-header">

              <div>

                <p className="eyebrow">

                  <Sparkles size={13} />

                  CHRONOGRAPH AI

                </p>


                <h2>
                  Possible supporting evidence
                </h2>

              </div>


              <div className="ai-ready">

                <ShieldCheck size={15} />

                {isAnalyzing
                  ? "CORRELATING EVIDENCE"
                  : "ANALYSIS COMPLETE"}

              </div>

            </div>



            <p className="ai-analysis-description">

              ChronoGraph searched the available event
              network for temporal and contextual
              relationships that could explain this
              transition.

            </p>



            {/* =================================================
                CANDIDATES
            ================================================= */}

            {isLoadingEvents ? (

              <div className="no-evidence">

                <Search size={20} />

                <div>

                  <strong>
                    Loading supporting evidence...
                  </strong>

                  <p>
                    ChronoGraph is retrieving events
                    from the evidence graph.
                  </p>

                </div>

              </div>

            ) : candidates.length > 0 ? (

              <div className="candidate-list">

                {candidates.map((event) => {

                  const Icon =
                    sourceIcons[
                      getEventSource(event)
                    ] || GitBranch;


                  const eventId =
                    getEventId(event);


                  return (

                    <div
                      className="evidence-candidate"
                      key={eventId}
                    >

                      <div className="candidate-icon">

                        <Icon size={18} />

                      </div>



                      <div className="candidate-content">

                        <div className="candidate-top">

                          <span>
                            {getEventSource(event)}
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

                          {eventId}
                          {" · "}
                          {formatDate(
                            event.timestamp
                          )}

                        </small>


                        <p>

                          Temporal proximity and
                          event context suggest this
                          evidence may help explain
                          the transition.

                        </p>

                      </div>



                      <div className="candidate-score">

                        <strong>
                          {event.score}%
                        </strong>

                        <span>
                          RELEVANCE
                        </span>


                        <div className="score-bar">

                          <div
                            style={{
                              width:
                                `${event.score}%`,
                            }}
                          />

                        </div>

                      </div>


                    </div>

                  );

                })}

              </div>

            ) : (

              <div className="no-evidence">

                <Search size={20} />

                <div>

                  <strong>
                    No strong supporting evidence found.
                  </strong>

                  <p>
                    The transition may require external
                    evidence or additional data sources.
                  </p>

                </div>

              </div>

            )}


          </div>


        </div>



        {/* =================================================
            RIGHT SIDEBAR
        ================================================= */}

        <aside className="investigation-sidebar">


          <p className="eyebrow">
            INVESTIGATION CONTEXT
          </p>


          <h2>

            What happened
            <br />
            between these events?

          </h2>


          <p>

            The investigation engine examines the
            temporal relationship between independent
            evidence sources.

          </p>



          {/* GAP DURATION */}

          <div className="context-item">

            <Clock3 size={18} />

            <div>

              <span>
                GAP DURATION
              </span>

              <strong>
                {gapMinutes} minutes
              </strong>

            </div>

          </div>



          {/* SOURCE TRANSITION */}

          <div className="context-item">

            <GitBranch size={18} />

            <div>

              <span>
                SOURCE TRANSITION
              </span>

              <strong>

                {getEventSource(gapFrom)}
                {" → "}
                {getEventSource(gapTo)}

              </strong>

            </div>

          </div>



          {/* CURRENT CONFIDENCE */}

          <div className="context-item">

            <ShieldCheck size={18} />

            <div>

              <span>
                CURRENT CONFIDENCE
              </span>

              <strong>

                {candidates.length > 0
                  ? `${topEvidence}%`
                  : "LOW"}

              </strong>

            </div>

          </div>



          {/* BACK BUTTON */}

          <button
            className="back-investigation"
            onClick={() => navigate("/")}
          >

            <ArrowLeft size={15} />

            Return to evidence

          </button>


        </aside>


      </section>


    </main>

  );

}