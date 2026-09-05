import {
  MessageSquare,
  GitBranch,
  Mail,
  ArrowDown,
  Brain,
} from "lucide-react";

const icons = {
  Slack: MessageSquare,
  GitHub: GitBranch,
  Email: Mail,
};

export default function RootCausePath({ events = [] }) {
  if (!events.length) return null;

  const sortedEvents = [...events].sort(
    (a, b) =>
      new Date(a.timestamp) - new Date(b.timestamp)
  );

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

  return (
    <section className="root-cause-panel">

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
          <span>PATH SCORE</span>
          <strong>87%</strong>
        </div>

      </div>


      <div className="cause-path">

        {sortedEvents.slice(0, 3).map(
          (event, index) => {

            const Icon =
              icons[event.source] || GitBranch;

            const stage =
              stages[index] || stages[2];

            return (
              <div
                className="cause-step"
                key={event.event_id}
              >

                <div className="cause-stage">
                  {stage.label}
                </div>


                <div className="cause-node">
                  <Icon size={18} />
                </div>


                <div className="cause-content">

                  <span>
                    {event.source} · {event.event_id}
                  </span>

                  <h3>
                    {event.title}
                  </h3>

                  <p>
                    {stage.description}
                  </p>

                  <small>
                    {new Date(
                      event.timestamp
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </small>

                </div>


                {index <
                  Math.min(sortedEvents.length, 3) - 1 && (
                  <div className="cause-connector">
                    <ArrowDown size={15} />
                  </div>
                )}

              </div>
            )
          }
        )}


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