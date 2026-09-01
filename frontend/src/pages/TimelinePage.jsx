import {
  MessageSquare,
  GitBranch,
  Mail,
  Calendar,
  ArrowDown,
} from "lucide-react";

const timelineEvents = [
  {
    time: "10:30",
    source: "SLACK",
    type: "DISCUSSION",
    title: "Migration strategy discussed",
    description:
      "Engineering team discussed moving infrastructure from AWS to GCP.",
    icon: MessageSquare,
  },
  {
    time: "11:15",
    source: "GITHUB",
    type: "CHANGE",
    title: "Infrastructure configuration changed",
    description:
      "Deployment configuration was modified shortly after the migration discussion.",
    icon: GitBranch,
  },
  {
    time: "12:05",
    source: "EMAIL",
    type: "EVIDENCE",
    title: "Migration approval received",
    description:
      "An approval message was sent to the engineering team.",
    icon: Mail,
  },
  {
    time: "13:30",
    source: "MEETING",
    type: "REVIEW",
    title: "Infrastructure review scheduled",
    description:
      "The infrastructure changes were reviewed by the technical team.",
    icon: Calendar,
  },
];

export default function Timeline() {
  return (
    <div className="page-shell">

      <div className="page-title-row">

        <div>
          <p className="eyebrow">
            TEMPORAL RECONSTRUCTION
          </p>

          <h1>Event Timeline</h1>

          <p className="page-description">
            Follow the sequence of events across connected
            systems and identify how the investigation unfolded.
          </p>
        </div>

        <div className="case-status">
          ● CASE CG-2026-001
        </div>

      </div>

      <div className="timeline-layout">

        <section className="timeline-panel">

          <div className="timeline-header">
            <div>
              <p className="eyebrow">
                CHRONOLOGICAL ORDER
              </p>

              <h2>26 AUG 2026</h2>
            </div>

            <span>
              4 EVENTS
            </span>
          </div>

          <div className="timeline">

            {timelineEvents.map((event, index) => {
              const Icon = event.icon;

              return (
                <div className="timeline-event" key={event.time}>

                  <div className="timeline-time">
                    {event.time}
                  </div>

                  <div className="timeline-line">

                    <div className="timeline-node">
                      <Icon size={15} />
                    </div>

                    {index !== timelineEvents.length - 1 && (
                      <div className="timeline-connector" />
                    )}

                  </div>

                  <div className="timeline-content">

                    <div className="timeline-meta">
                      <span>{event.source}</span>
                      <span>{event.type}</span>
                    </div>

                    <h3>
                      {event.title}
                    </h3>

                    <p>
                      {event.description}
                    </p>

                    <button>
                      View evidence →
                    </button>

                  </div>

                </div>
              );
            })}

          </div>

        </section>

        <aside className="sequence-panel">

          <p className="eyebrow">
            SEQUENCE ANALYSIS
          </p>

          <div className="sequence-score">
            <strong>87</strong>
            <span>%</span>
          </div>

          <h2>
            Strong temporal
            <br />
            correlation
          </h2>

          <p>
            Events occur within a narrow operational
            window and share related infrastructure context.
          </p>

          <div className="sequence-flow">

            <div>
              <span>01</span>
              Discussion
            </div>

            <ArrowDown size={14} />

            <div>
              <span>02</span>
              Configuration
            </div>

            <ArrowDown size={14} />

            <div>
              <span>03</span>
              Approval
            </div>

            <ArrowDown size={14} />

            <div>
              <span>04</span>
              Review
            </div>

          </div>

        </aside>

      </div>

    </div>
  );
}