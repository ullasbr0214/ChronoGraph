import {
  MessageSquare,
  GitBranch,
  Mail,
  Calendar,
  ShieldCheck,
  Network,
  Server,
  Clock3,
} from "lucide-react";

const icons = {
  slack: MessageSquare,
  github: GitBranch,
  email: Mail,
  meeting: Calendar,
  "system log": Server,
  "security log": ShieldCheck,
  "network log": Network,
  "application log": Server,
};

function formatTime(timestamp) {
  if (!timestamp) {
    return "--:--";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return String(timestamp);
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDate(timestamp) {
  if (!timestamp) {
    return "";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function EventCard({ event }) {
  if (!event) {
    return null;
  }

  // ---------------------------------------------------------
  // Normalize backend event data
  // ---------------------------------------------------------

  const source =
    event.source || "System";

  const normalizedSource =
    String(source).toLowerCase();

  const Icon =
    icons[normalizedSource] || Server;

  const eventId =
    event.id ||
    event.event_id ||
    "UNKNOWN";

  const title =
    event.title ||
    event.name ||
    "Untitled Event";

  const description =
    event.description ||
    "No description available.";

  const eventType =
    event.event_type ||
    "Evidence Event";

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------

  return (
    <article className="event-card">

      {/* =====================================================
          EVENT ICON
      ===================================================== */}

      <div className="event-icon">
        <Icon size={18} />
      </div>


      {/* =====================================================
          EVENT CONTENT
      ===================================================== */}

      <div className="event-content">

        <div className="event-meta">

          <span>
            {source}
          </span>

          <time
            dateTime={
              event.timestamp || undefined
            }
            title={
              event.timestamp
                ? formatDate(event.timestamp)
                : undefined
            }
          >

            <Clock3 size={12} />

            {formatTime(event.timestamp)}

          </time>

        </div>


        <h3>
          {title}
        </h3>


        <p>
          {description}
        </p>


        {/* EVENT FOOTER */}

        <div className="event-footer">

          <span className="event-id">
            {eventId}
          </span>

          <span className="event-date">
            {formatDate(event.timestamp)}
          </span>

        </div>

      </div>


      {/* =====================================================
          EVENT TYPE
      ===================================================== */}

      <span className="event-type">
        {eventType}
      </span>

    </article>
  );
}