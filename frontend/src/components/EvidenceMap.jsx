import {
  Clock3,
  GitBranch,
  MessageSquare,
  Mail,
} from "lucide-react";

const sourceIcons = {
  Slack: MessageSquare,
  GitHub: GitBranch,
  Email: Mail,
};

export default function EvidenceMap({
  events = [],
  gap,
  candidates = [],
}) {
  if (!gap) {
    return null;
  }

  const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const getIcon = (source) =>
    sourceIcons[source] || GitBranch;

  return (
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
            ChronoGraph maps the events surrounding the
            unexplained transition and highlights possible
            supporting evidence.
          </p>
        </div>

        <div className="evidence-map-count">
          <strong>{candidates.length}</strong>
          <span>RELATED</span>
        </div>
      </div>

      <div className="evidence-map-track">

        {/* FROM EVENT */}

        <div className="map-event">

          <div className="map-event-marker">
            {(() => {
              const Icon = getIcon(gap.from.source);
              return <Icon size={17} />;
            })()}
          </div>

          <div className="map-event-content">

            <span className="map-event-meta">
              {gap.from.source} ·{" "}
              {formatTime(gap.from.timestamp)}
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

        <div className="map-gap">

          <div className="map-gap-line">
            <span />
          </div>

          <div className="map-gap-content">

            <Clock3 size={15} />

            <strong>
              {gap.minutes} MINUTES
            </strong>

            <span>
              UNEXPLAINED TRANSITION
            </span>

          </div>

        </div>


        {/* CANDIDATE EVENTS */}

        {candidates.map((event) => {

          const Icon = getIcon(event.source);

          return (
            <div
              className="map-candidate"
              key={event.event_id}
            >

              <div className="map-candidate-marker">
                <Icon size={16} />
              </div>

              <div className="map-candidate-content">

                <div className="map-candidate-top">

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
                  {event.event_id}
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

            </div>
          );
        })}


        {/* TO EVENT */}

        <div className="map-event">

          <div className="map-event-marker">
            {(() => {
              const Icon = getIcon(gap.to.source);
              return <Icon size={17} />;
            })()}
          </div>

          <div className="map-event-content">

            <span className="map-event-meta">
              {gap.to.source} ·{" "}
              {formatTime(gap.to.timestamp)}
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

      <div className="evidence-map-footer">

        <span>
          TEMPORAL ENGINE
        </span>

        <span>
          {events.length} EVENTS ANALYZED
        </span>

      </div>

    </section>
  );
}