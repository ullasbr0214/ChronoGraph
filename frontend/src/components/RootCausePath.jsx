import {
  MessageSquare,
  GitBranch,
  Mail,
  ArrowDown,
  Brain,
  ShieldCheck,
  Server,
  Network,
} from "lucide-react";

const icons = {
  slack: MessageSquare,
  github: GitBranch,
  email: Mail,
  "system log": Server,
  "security log": ShieldCheck,
  "network log": Network,
  "application log": Server,
};

function getEventId(event) {
  return event?.id || event?.event_id || "UNKNOWN";
}

function getEventTitle(event) {
  return event?.title || event?.name || "Untitled Event";
}

function getEventSource(event) {
  return event?.source || "System";
}

function getValidDate(timestamp) {
  if (!timestamp) {
    return null;
  }

  const date = new Date(timestamp);

  return Number.isNaN(date.getTime())
    ? null
    : date;
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

export default function RootCausePath({ events = [] }) {
  if (!Array.isArray(events) || events.length === 0) {
    return null;
  }

  const sortedEvents = [...events]
    .filter((event) => getValidDate(event?.timestamp))
    .sort(
      (a, b) =>
        getValidDate(a.timestamp) -
        getValidDate(b.timestamp)
    );

  if (sortedEvents.length === 0) {
    return null;
  }

  const stages = [
    {
      label: "TRIGGER",
      description: "Initial signal",
    },
    {
      label: "CHANGE",
      description: "Operational change",
    },
    {
      label: "CONFIRMATION",
      description: "Supporting evidence",
    },
  ];

  const visibleEvents = sortedEvents.slice(0, 3);

  return (
    <section className="root-cause-panel">

      {/* =========================
          HEADER
      ========================= */}

      <div className="root-cause-header">

        <div>

          <p className="eyebrow">
            ROOT CAUSE PATH
          </p>

          <h2>
            How the sequence unfolded
          </h2>

          <p>
            Chronological evidence path reconstructed
            from the available events.
          </p>

        </div>

        <div className="root-score">

          <span>
            PATH SCORE
          </span>

          <strong>
            87%
          </strong>

        </div>

      </div>


      {/* =========================
          CAUSE PATH
      ========================= */}

      <div className="cause-path">

        {visibleEvents.map((event, index) => {

          const source =
            getEventSource(event);

          const Icon =
            icons[source.toLowerCase()] ||
            GitBranch;

          const stage =
            stages[index] || stages[2];

          const eventId =
            getEventId(event);

          const eventTitle =
            getEventTitle(event);

          return (
            <div
              className="cause-step"
              key={`${eventId}-${index}`}
            >

              {/* STAGE */}

              <div className="cause-stage">
                {stage.label}
              </div>


              {/* NODE */}

              <div className="cause-node">
                <Icon size={18} />
              </div>


              {/* CONTENT */}

              <div className="cause-content">

                <span>
                  {source} · {eventId}
                </span>

                <h3>
                  {eventTitle}
                </h3>

                <p>
                  {stage.description}
                </p>

                <small>
                  {formatTime(event.timestamp)}
                </small>

              </div>


              {/* CONNECTOR */}

              {index < visibleEvents.length - 1 && (
                <div className="cause-connector">
                  <ArrowDown size={15} />
                </div>
              )}

            </div>
          );
        })}


        {/* =========================
            AI CONCLUSION
        ========================= */}

        <div className="cause-conclusion">

          <div className="conclusion-icon">
            <Brain size={18} />
          </div>

          <div>

            <span className="eyebrow">
              AI RECONSTRUCTION
            </span>

            <h3>
              Probable migration sequence identified.
            </h3>

            <p>
              The available evidence suggests that
              the infrastructure migration discussion
              was followed by a configuration change
              and subsequent confirmation.
            </p>

          </div>

          <strong>
            87%
          </strong>

        </div>

      </div>

    </section>
  );
}