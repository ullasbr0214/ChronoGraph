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

import { useLocation, useNavigate } from "react-router-dom";
import { events } from "../data/events";
import { generateHypothesis } from "../utils/investigationEngine";

const sourceIcons = {
  Slack: MessageSquare,
  GitHub: GitBranch,
  Email: Mail,
};

export default function Investigation() {
  const location = useLocation();
  const navigate = useNavigate();

  const gap = location.state?.gap;

  // If user opens investigation directly
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
            Select an unexplained transition from the dashboard
            to begin a temporal investigation.
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

  const fromTime = new Date(gap.from.timestamp);
  const toTime = new Date(gap.to.timestamp);

  /*
   * Find events that occurred around the unexplained gap.
   */

  const candidates = events
    .filter(
      (event) =>
        event.event_id !== gap.from.event_id &&
        event.event_id !== gap.to.event_id
    )
    .map((event) => {

      const eventTime = new Date(event.timestamp);

      const distanceFromStart =
        Math.abs(eventTime - fromTime) / 60000;

      const distanceFromEnd =
        Math.abs(eventTime - toTime) / 60000;

      const nearestDistance =
        Math.min(distanceFromStart, distanceFromEnd);

      let score = 0;


      // Temporal relevance
      if (nearestDistance <= 15) {
        score += 45;
      } else if (nearestDistance <= 30) {
        score += 35;
      } else if (nearestDistance <= 60) {
        score += 25;
      } else if (nearestDistance <= 120) {
        score += 10;
      }

      // Different source can indicate independent evidence
      if (
        event.source !== gap.from.source &&
        event.source !== gap.to.source
      ) {
        score += 20;
      }

      // Event type relevance
      if (
        event.event_type?.toLowerCase().includes("update") ||
        event.event_type?.toLowerCase().includes("change") ||
        event.event_type?.toLowerCase().includes("deployment")
      ) {
        score += 20;
      }

      // Description/title relevance
      const text = `
        ${event.title}
        ${event.description || ""}
        ${event.event_type || ""}
      `.toLowerCase();

      const keywords = [
        "migration",
        "infrastructure",
        "configuration",
        "deploy",
        "update",
        "cloud",
        "aws",
        "gcp",
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
    .filter((event) => event.score >= 20)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

    const hypothesis = generateHypothesis(
  gap,
  candidates
);

  const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDate = (timestamp) =>
    new Date(timestamp).toLocaleDateString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <main className="investigation-page">

      {/* HEADER */}

      <section className="investigation-header">

        <div>

          <p className="eyebrow">
            AI INVESTIGATION
          </p>

          <h1>
            Investigate the gap.
          </h1>

          <p>
            ChronoGraph is analyzing the unexplained transition
            between two evidence events.
          </p>

        </div>

        <div className="analysis-status">
          <span />
          ANALYSIS READY
        </div>

      </section>


      {/* MAIN GRID */}

      <section className="investigation-grid">

        {/* LEFT */}

        <div className="investigation-main">

          <div className="anomaly-card">

            <div className="anomaly-label">
              <AlertTriangle size={17} />
              TEMPORAL ANOMALY
            </div>

            <h2>
              {gap.minutes} minute unexplained gap
            </h2>

            <p className="anomaly-description">
              ChronoGraph detected a break in the expected
              sequence of events.
            </p>


            {/* FROM EVENT */}

            <div className="investigation-event">

              <div className="event-icon">

                {(() => {
                  const Icon =
                    sourceIcons[gap.from.source] || GitBranch;

                  return <Icon size={19} />;
                })()}

              </div>

              <div>

                <span>
                  {gap.from.source} · {formatTime(gap.from.timestamp)}
                </span>

                <strong>
                  {gap.from.title}
                </strong>

                <small>
                  {gap.from.event_id}
                </small>

              </div>

            </div>


            {/* GAP */}

            <div className="investigation-gap">

              <div className="gap-line" />

              <div>

                <strong>
                  {gap.minutes} MINUTES
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
                    sourceIcons[gap.to.source] || GitBranch;

                  return <Icon size={19} />;
                })()}

              </div>

              <div>

                <span>
                  {gap.to.source} · {formatTime(gap.to.timestamp)}
                </span>

                <strong>
                  {gap.to.title}
                </strong>

                <small>
                  {gap.to.event_id}
                </small>

              </div>

            </div>

                    </div>


          {/* ROOT CAUSE HYPOTHESIS */}

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
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span>
                      {signal}
                    </span>

                  </div>

                )
              )}

            </div>


            <div className="hypothesis-disclaimer">

              <ShieldCheck size={14} />

              <span>
                Hypothesis generated from temporal and contextual
                evidence. Not a confirmed conclusion.
              </span>

            </div>

          </div>


          {/* AI ANALYSIS */}

          <div className="ai-analysis-card">

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
                ANALYSIS COMPLETE
              </div>

            </div>


            <p className="ai-analysis-description">
              ChronoGraph searched the available event network
              for temporal and contextual relationships that
              could explain this transition.
            </p>


            {/* CANDIDATES */}

            {candidates.length > 0 ? (

              <div className="candidate-list">

                {candidates.map((event) => {

                  const Icon =
                    sourceIcons[event.source] || GitBranch;

                  return (
                    <div
                      className="evidence-candidate"
                      key={event.event_id}
                    >

                      <div className="candidate-icon">
                        <Icon size={18} />
                      </div>

                      <div className="candidate-content">

                        <div className="candidate-top">

                          <span>
                            {event.source}
                          </span>

                          <span>
                            {formatTime(event.timestamp)}
                          </span>

                        </div>

                        <strong>
                          {event.title}
                        </strong>

                        <small>
                          {event.event_id} · {formatDate(event.timestamp)}
                        </small>

                        <p>
                          Temporal proximity and event context
                          suggest this evidence may help explain
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
                              width: `${event.score}%`,
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
                    The transition may require external evidence
                    or additional data sources.
                  </p>
                </div>

              </div>

            )}

          </div>

        </div>


        {/* RIGHT SIDEBAR */}

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
            The investigation engine examines temporal
            relationships between independent evidence sources.
          </p>


          <div className="context-item">

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


          <div className="context-item">

            <GitBranch size={18} />

            <div>

              <span>
                SOURCE TRANSITION
              </span>

              <strong>
                {gap.from.source} → {gap.to.source}
              </strong>

            </div>

          </div>


          <div className="context-item">

            <ShieldCheck size={18} />

            <div>

              <span>
                CURRENT CONFIDENCE
              </span>

              <strong>
                {candidates.length
                  ? `${Math.max(...candidates.map((e) => e.score))}%`
                  : "LOW"}
              </strong>

            </div>

          </div>


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