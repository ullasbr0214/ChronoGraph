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
  Brain,
} from "lucide-react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { events } from "../data/events";

import {
  generateHypothesis,
  findSupportingEvidence,
} from "../utils/investigationEngine";


/* =========================================================
   SOURCE ICON
========================================================= */

function SourceIcon({ source }) {
  if (source === "Slack") {
    return <MessageSquare size={18} />;
  }

  if (source === "GitHub") {
    return <GitBranch size={18} />;
  }

  if (source === "Email") {
    return <Mail size={18} />;
  }

  return <Search size={18} />;
}


/* =========================================================
   TIME FORMATTER
========================================================= */

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
  });
}


/* =========================================================
   FIND FALLBACK GAP
========================================================= */

function findFallbackGap(eventList = []) {
  if (!Array.isArray(eventList) || eventList.length < 2) {
    return null;
  }

  const sortedEvents = [...eventList].sort(
    (a, b) =>
      new Date(a.timestamp) -
      new Date(b.timestamp)
  );

  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const current = sortedEvents[i];
    const next = sortedEvents[i + 1];

    const currentTime = new Date(
      current.timestamp
    );

    const nextTime = new Date(
      next.timestamp
    );

    const minutes = Math.round(
      (nextTime - currentTime) / 60000
    );

    if (minutes >= 30) {
      return {
        from: current,
        to: next,
        minutes,
      };
    }
  }

  return null;
}


/* =========================================================
   INVESTIGATION PAGE
========================================================= */

export default function Investigation() {
  const location = useLocation();
  const navigate = useNavigate();

  /*
   * First use the gap sent by MissingEvidence.
   * If the page was opened directly, find a gap from events.
   */
  const gap =
    location.state?.gap ||
    findFallbackGap(events);


  /* =======================================================
     NO GAP
  ======================================================= */

  if (!gap) {
    return (
      <main className="investigation-page">

        <div className="investigation-empty">

          <AlertTriangle size={28} />

          <p className="eyebrow">
            INVESTIGATION
          </p>

          <h1>
            No evidence gap selected
          </h1>

          <p>
            Return to the evidence view and select
            an unexplained transition to investigate.
          </p>

          <button
            className="gap-action"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={15} />
            Return to evidence
          </button>

        </div>

      </main>
    );
  }


  /* =======================================================
     FIND SUPPORTING EVIDENCE
  ======================================================= */

  const candidates =
    findSupportingEvidence(
      gap,
      events
    );


  /* =======================================================
     GENERATE HYPOTHESIS
  ======================================================= */

  const hypothesis =
    generateHypothesis(
      gap,
      candidates
    );


  /* =======================================================
     INVESTIGATION SUMMARY
  ======================================================= */

  const topEvidence =
    candidates.length > 0
      ? candidates[0].score
      : 0;

  const investigationSummary =
    candidates.length > 0
      ? `ChronoGraph identified ${candidates.length} related event${
          candidates.length > 1 ? "s" : ""
        } that may explain the ${
          gap.minutes
        }-minute transition. The strongest supporting evidence has a relevance score of ${topEvidence}%.`
      : "ChronoGraph could not identify strong supporting evidence for this transition.";


  /* =======================================================
     SOURCE TRANSITION
  ======================================================= */

  const sourceTransition =
    `${gap.from.source} → ${gap.to.source}`;


  return (
    <main className="investigation-page">

      {/* ===================================================
          PAGE HEADER
      =================================================== */}

      <section className="investigation-hero">

        <div>

          <p className="eyebrow">
            AI INVESTIGATION
          </p>

          <h1>
            Investigate the gap.
          </h1>

          <p className="investigation-subtitle">
            ChronoGraph is analyzing the unexplained
            transition between two evidence events.
          </p>

        </div>


        <div className="analysis-status">
          <span />
          ANALYSIS READY
        </div>

      </section>


      {/* ===================================================
          MAIN GRID
      =================================================== */}

      <div className="investigation-grid">

        {/* =================================================
            LEFT COLUMN
        ================================================= */}

        <div className="investigation-main">


          {/* ===============================================
              TEMPORAL ANOMALY
          =============================================== */}

          <section className="investigation-card">

            <div className="eyebrow anomaly-label">
              <AlertTriangle size={14} />
              TEMPORAL ANOMALY
            </div>

            <h2>
              {gap.minutes} minute unexplained gap
            </h2>

            <p className="section-description">
              ChronoGraph detected a break in the
              expected sequence of events.
            </p>


            {/* FROM EVENT */}

            <div className="investigation-event">

              <div className="event-icon">
                <SourceIcon
                  source={gap.from.source}
                />
              </div>

              <div className="event-content">

                <div className="event-meta">
                  {gap.from.source} ·{" "}
                  {formatTime(
                    gap.from.timestamp
                  )}
                </div>

                <strong>
                  {gap.from.title}
                </strong>

                <small>
                  {gap.from.event_id}
                </small>

              </div>

            </div>


            {/* GAP CONNECTOR */}

            <div className="investigation-gap">

              <div className="gap-vertical-line">
                <span />
              </div>

              <strong>
                {gap.minutes} MINUTES
              </strong>

              <small>
                UNEXPLAINED TRANSITION
              </small>

            </div>


            {/* TO EVENT */}

            <div className="investigation-event">

              <div className="event-icon">
                <SourceIcon
                  source={gap.to.source}
                />
              </div>

              <div className="event-content">

                <div className="event-meta">
                  {gap.to.source} ·{" "}
                  {formatTime(
                    gap.to.timestamp
                  )}
                </div>

                <strong>
                  {gap.to.title}
                </strong>

                <small>
                  {gap.to.event_id}
                </small>

              </div>

            </div>

          </section>


          {/* ===============================================
              ROOT CAUSE HYPOTHESIS
          =============================================== */}

          <section className="hypothesis-card">

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
                  {hypothesis.confidence}%
                </strong>

                <span>
                  CONFIDENCE
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
                      {String(index + 1).padStart(
                        2,
                        "0"
                      )}
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
                and contextual evidence. Not a
                confirmed conclusion.
              </span>

            </div>

          </section>


          {/* ===============================================
              AI REASONING SUMMARY
          =============================================== */}

          <section className="reasoning-summary-card">

            <div className="reasoning-summary-header">

              <div className="reasoning-title">

                <div className="reasoning-icon">
                  <Brain size={19} />
                </div>

                <div>

                  <p className="eyebrow">
                    AI REASONING SUMMARY
                  </p>

                  <h2>
                    What ChronoGraph found
                  </h2>

                </div>

              </div>

              <span className="ai-generated">
                AI GENERATED
              </span>

            </div>


            <p className="reasoning-summary-text">
              {investigationSummary}
            </p>


            <div className="summary-metrics">

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
                  {gap.minutes}m
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

          </section>


          {/* ===============================================
              SUPPORTING EVIDENCE
          =============================================== */}

          <section className="supporting-evidence">

            <div className="supporting-header">

              <div>

                <p className="eyebrow">
                  <Sparkles size={13} />
                  CHRONOGRAPH AI
                </p>

                <h2>
                  Possible supporting evidence
                </h2>

              </div>

              <span className="analysis-complete">
                <ShieldCheck size={14} />
                ANALYSIS COMPLETE
              </span>

            </div>


            <p className="supporting-description">
              ChronoGraph searched the available event
              network for temporal and contextual
              relationships that could explain this
              transition.
            </p>


            {candidates.length === 0 ? (

              <div className="no-evidence">

                <Search size={18} />

                <span>
                  No additional supporting evidence
                  was found near this transition.
                </span>

              </div>

            ) : (

              <div className="candidate-list">

                {candidates.map(
                  (candidate, index) => (

                    <article
                      className="candidate-card"
                      key={
                        candidate.event_id ||
                        index
                      }
                    >

                      <div className="candidate-icon">

                        <SourceIcon
                          source={
                            candidate.source
                          }
                        />

                      </div>


                      <div className="candidate-content">

                        <div className="candidate-meta">

                          <span>
                            {candidate.source}
                          </span>

                          <span>
                            {formatTime(
                              candidate.timestamp
                            )}
                          </span>

                        </div>


                        <h3>
                          {candidate.title}
                        </h3>


                        <small>
                          {candidate.event_id}
                        </small>


                        <p>
                          {candidate.description ||
                            "Temporal proximity and event context suggest this evidence may help explain the transition."}
                        </p>

                      </div>


                      <div className="candidate-score">

                        <strong>
                          {candidate.score}%
                        </strong>

                        <span>
                          RELEVANCE
                        </span>

                      </div>

                    </article>

                  )
                )}

              </div>

            )}

          </section>

        </div>


        {/* =================================================
            RIGHT COLUMN
        ================================================= */}

        <aside className="investigation-sidebar">

          <div className="context-card">

            <p className="eyebrow">
              INVESTIGATION CONTEXT
            </p>

            <h2>
              What happened
              <br />
              between these events?
            </h2>

            <p>
              The investigation engine examines
              the temporal relationship between
              independent evidence sources.
            </p>


            <div className="context-stat">

              <Clock3 size={18} />

              <div>

                <span>
                  GAP DURATION
                </span>

                <strong>
                  {gap.minutes} minutes
                </strong>

              </div>

            </div>


            <div className="context-stat">

              <GitBranch size={18} />

              <div>

                <span>
                  SOURCE TRANSITION
                </span>

                <strong>
                  {sourceTransition}
                </strong>

              </div>

            </div>


            <div className="context-stat">

              <ShieldCheck size={18} />

              <div>

                <span>
                  CURRENT CONFIDENCE
                </span>

                <strong>
                  {hypothesis.confidence}%
                </strong>

              </div>

            </div>


            <button
              className="return-button"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={15} />
              Return to evidence
            </button>

          </div>

        </aside>

      </div>

    </main>
  );
}