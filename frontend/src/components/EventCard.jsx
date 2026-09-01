import {
  MessageSquare,
  GitBranch,
  Mail,
  Calendar,
} from "lucide-react";

const icons = {
  slack: MessageSquare,
  github: GitBranch,
  email: Mail,
  meeting: Calendar,
};

export default function EventCard({ event }) {
  const Icon = icons[event.source?.toLowerCase()] || Calendar;

  return (
    <article className="event-card">
      <div className="event-icon">
        <Icon size={18} />
      </div>

      <div className="event-content">
        <div className="event-meta">
          <span>{event.source}</span>
          <time>{event.timestamp}</time>
        </div>

        <h3>{event.title}</h3>

        <p>{event.description}</p>
      </div>

      <span className="event-type">
        {event.event_type}
      </span>
    </article>
  );
}