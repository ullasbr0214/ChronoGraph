import {
  AlertTriangle,
  Search,
  ArrowRight,
  Clock3,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

export default function MissingEvidence({ events = [] }) {
  const navigate = useNavigate();

  // ---------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------

  const getEventId = (event) =>
    event?.id ||
    event?.event_id ||
    "UNKNOWN";

  const getEventTitle = (event) =>
    event?.title ||
    event?.name ||
    "Untitled Event";

  const getEventSource = (event) =>
    event?.source ||
    "System";

  const getValidDate = (timestamp) => {
    if (!timestamp) {
      return null;
    }

    const date = new Date(timestamp);

    return Number.isNaN(date.getTime())
      ? null
      : date;
  };

  const formatTime = (timestamp) => {
    const date = getValidDate(timestamp);

    if (!date) {
      return "--:--";
    }

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // ---------------------------------------------------------
  // Need at least two events
  // ---------------------------------------------------------

  if (!Array.isArray(events) || events.length < 2) {
    return null;
  }

  // ---------------------------------------------------------
  // Sort valid events chronologically
  // ---------------------------------------------------------

  const sortedEvents = [...events]
    .filter((event) => getValidDate(event?.timestamp))
    .sort(
      (a, b) =>
        getValidDate(a.timestamp) -
        getValidDate(b.timestamp)
    );

  if (sortedEvents.length < 2) {
    return null;
  }

  // ---------------------------------------------------------
  // Detect unexplained temporal gaps
  // ---------------------------------------------------------

  const gaps = [];

  for (
    let i = 0;
    i < sortedEvents.length - 1;
    i++
  ) {
    const current = getValidDate(
      sortedEvents[i].timestamp
    );

    const next = getValidDate(
      sortedEvents[i + 1].timestamp
    );

    if (!current || !next) {
      continue;
    }

    const minutes = Math.round(
      (next.getTime() - current.getTime()) / 60000
    );

    // A gap of 30 minutes or more is considered
    // a potential missing-evidence transition.
    if (minutes >= 30) {
      gaps.push({
        from: sortedEvents[i],
        to: sortedEvents[i + 1],
        minutes,
      });
    }
  }

  // ---------------------------------------------------------
  // No gaps
  // ---------------------------------------------------------

  if (gaps.length === 0) {
    return null;
  }

  // ---------------------------------------------------------
  // Investigate selected gap
  // ---------------------------------------------------------

  const investigateGap = (gap) => {
    navigate("/investigation", {
      state: {
        gap,
      },
    });
  };

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------

  return (
    <section className="missing-evidence">

      {/* =========================
          HEADER
      ========================= */}

      <div className="missing-evidence-header">

        <div className="missing-evidence-title">

          <div className="missing-evidence-icon">
            <AlertTriangle size={18} />
          </div>

          <div>

            <p className="eyebrow">
              TEMPORAL ANOMALY
            </p>

            <h2>
              Missing evidence detected
            </h2>

            <p className="missing-evidence-description">
              ChronoGraph found unexplained gaps
              in the current event sequence.
            </p>

          </div>

        </div>

        <span className="gap-count">
          {gaps.length} GAP
          {gaps.length > 1 ? "S" : ""}
        </span>

      </div>


      {/* =========================
          GAP LIST
      ========================= */}

      <div className="evidence-gap-list">

        {gaps.map((gap, index) => {

          const fromId = getEventId(gap.from);
          const toId = getEventId(gap.to);

          return (
            <div
              className="evidence-gap"
              key={`${fromId}-${toId}-${index}`}
            >

              {/* =========================
                  GAP HEADER
              ========================= */}

              <div className="evidence-gap-top">

                <span className="gap-number">
                  GAP{" "}
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span className="evidence-gap-duration">

                  <Clock3 size={13} />

                  {gap.minutes} MIN GAP

                </span>

              </div>


              {/* =========================
                  EVENT TRANSITION
              ========================= */}

              <div className="gap-events">

                {/* FROM EVENT */}

                <div className="gap-event">

                  <div className="gap-event-meta">

                    <span className="event-source">
                      {getEventSource(gap.from)}
                    </span>

                    <span className="event-time">
                      {formatTime(
                        gap.from.timestamp
                      )}
                    </span>

                  </div>

                  <strong>
                    {getEventTitle(gap.from)}
                  </strong>

                  <small>
                    {fromId}
                  </small>

                </div>


                {/* GAP CONNECTOR */}

                <div className="gap-connector">

                  <span>
                    {gap.minutes} MIN
                  </span>

                  <div className="gap-line">
                    <span />
                  </div>

                  <small>
                    UNEXPLAINED
                  </small>

                </div>


                {/* TO EVENT */}

                <div className="gap-event">

                  <div className="gap-event-meta">

                    <span className="event-source">
                      {getEventSource(gap.to)}
                    </span>

                    <span className="event-time">
                      {formatTime(
                        gap.to.timestamp
                      )}
                    </span>

                  </div>

                  <strong>
                    {getEventTitle(gap.to)}
                  </strong>

                  <small>
                    {toId}
                  </small>

                </div>

              </div>


              {/* =========================
                  WARNING
              ========================= */}

              <div className="gap-warning">

                <Search size={15} />

                <span>
                  No supporting event currently
                  explains this transition.
                </span>

              </div>


              {/* =========================
                  ACTION
              ========================= */}

              <button
                type="button"
                className="gap-action"
                onClick={() => investigateGap(gap)}
              >
                Investigate gap

                <ArrowRight size={14} />

              </button>

            </div>
          );
        })}

      </div>

    </section>
  );
}