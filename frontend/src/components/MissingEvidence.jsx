import {
  AlertTriangle,
  Search,
  ArrowRight,
} from "lucide-react";

export default function MissingEvidence({ events = [] }) {

  if (events.length < 2) {
    return null;
  }

  const sortedEvents = [...events].sort(
    (a, b) =>
      new Date(a.timestamp) -
      new Date(b.timestamp)
  );

  const gaps = [];

  for (let i = 0; i < sortedEvents.length - 1; i++) {

    const current =
      new Date(sortedEvents[i].timestamp);

    const next =
      new Date(sortedEvents[i + 1].timestamp);

    const minutes =
      Math.round(
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

  return (
    <section className="missing-evidence">

      <div className="missing-header">

        <div className="missing-icon">
          <AlertTriangle size={18} />
        </div>

        <div>
          <p className="eyebrow">
            TEMPORAL ANOMALY
          </p>

          <h2>
            Missing evidence detected
          </h2>

          <p>
            ChronoGraph found unexplained gaps
            in the current event sequence.
          </p>
        </div>

      </div>


      {gaps.map((gap, index) => (

        <div
          className="evidence-gap"
          key={index}
        >

          <div className="gap-events">

            <div>
              <span>
                {gap.from.source}
              </span>

              <strong>
                {gap.from.title}
              </strong>

              <small>
                {new Date(
                  gap.from.timestamp
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </small>
            </div>


            <div className="gap-indicator">

              <span>
                {gap.minutes} MIN GAP
              </span>

              <div />

            </div>


            <div>
              <span>
                {gap.to.source}
              </span>

              <strong>
                {gap.to.title}
              </strong>

              <small>
                {new Date(
                  gap.to.timestamp
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </small>
            </div>

          </div>


          <div className="gap-warning">

            <Search size={15} />

            <span>
              No supporting event currently explains
              this transition.
            </span>

          </div>


          <button className="gap-action">
            Investigate gap
            <ArrowRight size={14} />
          </button>

        </div>

      ))}

    </section>
  );
}