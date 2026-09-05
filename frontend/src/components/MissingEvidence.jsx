import {
  AlertTriangle,
  Search,
  ArrowRight,
  Clock3,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

export default function MissingEvidence({ events = [] }) {
  const navigate = useNavigate();

  if (events.length < 2) {
    return null;
  }

  const sortedEvents = [...events].sort(
    (a, b) =>
      new Date(a.timestamp) - new Date(b.timestamp)
  );

  const gaps = [];

  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const current = new Date(
      sortedEvents[i].timestamp
    );

    const next = new Date(
      sortedEvents[i + 1].timestamp
    );

    const minutes = Math.round(
      (next - current) / 60000
    );

    if (minutes >= 30) {
      gaps.push({
        from: sortedEvents[i],
        to: sortedEvents[i + 1],
        minutes,
      });
    }
  }

  if (gaps.length === 0) {
    return null;
  }

  const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const investigateGap = (gap) => {
    navigate("/investigation", {
      state: {
        gap,
      },
    });
  };

  return (
    <section className="missing-evidence">

      {/* HEADER */}

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
          {gaps.length} GAP{gaps.length > 1 ? "S" : ""}
        </span>

      </div>


      {/* GAP LIST */}

      <div className="evidence-gap-list">

        {gaps.map((gap, index) => (

          <div
            className="evidence-gap"
            key={`${gap.from.event_id}-${gap.to.event_id}`}
          >

            {/* GAP HEADER */}

            <div className="evidence-gap-top">

              <span className="gap-number">
                GAP {String(index + 1).padStart(2, "0")}
              </span>

              <span className="evidence-gap-duration">
                <Clock3 size={13} />
                {gap.minutes} MIN GAP
              </span>

            </div>


            {/* EVENT TRANSITION */}

            <div className="gap-events">

              {/* FROM EVENT */}

              <div className="gap-event">

                <div className="gap-event-meta">
                  <span className="event-source">
                    {gap.from.source}
                  </span>

                  <span className="event-time">
                    {formatTime(gap.from.timestamp)}
                  </span>
                </div>

                <strong>
                  {gap.from.title}
                </strong>

                <small>
                  {gap.from.event_id}
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
                    {gap.to.source}
                  </span>

                  <span className="event-time">
                    {formatTime(gap.to.timestamp)}
                  </span>
                </div>

                <strong>
                  {gap.to.title}
                </strong>

                <small>
                  {gap.to.event_id}
                </small>

              </div>

            </div>


            {/* WARNING */}

            <div className="gap-warning">

              <Search size={15} />

              <span>
                No supporting event currently explains
                this transition.
              </span>

            </div>


            {/* ACTION */}

            <button
              className="gap-action"
              onClick={() => investigateGap(gap)}
            >
              Investigate gap
              <ArrowRight size={14} />
            </button>

          </div>

        ))}

      </div>

    </section>
  );
}