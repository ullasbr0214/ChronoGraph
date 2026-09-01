import { events } from "../data/events";

export default function TimelinePage() {
  return (
    <main className="page">

      {/* HEADER */}
      <section className="page-header">

        <div>
          <p className="eyebrow">
            TEMPORAL SEQUENCE
          </p>

          <h1>
            Event Timeline
          </h1>

          <p className="page-description">
            Follow the sequence of events across systems,
            sources and time.
          </p>
        </div>

        <div className="case-status">
          <span className="status-dot" />
          TIMELINE READY
        </div>

      </section>


      {/* TIMELINE */}
      <section className="timeline-container">

        <div className="timeline-line" />

        {events.map((event, index) => (

          <div
            className={`timeline-event ${
              index % 2 === 0 ? "left" : "right"
            }`}
            key={event.event_id}
          >

            {/* CONNECTION DOT */}
            <div className="timeline-dot" />


            {/* EVENT CARD */}
            <div className="timeline-card">

              <div className="timeline-card-header">

                <span className="event-source">
                  {event.source}
                </span>

                <span className="event-time">
                  {event.timestamp}
                </span>

              </div>


              <h3>
                {event.title}
              </h3>


              <p>
                {event.description}
              </p>


              <div className="timeline-footer">

                <span>
                  {event.event_id}
                </span>

                <span className="event-type">
                  {event.event_type}
                </span>

              </div>

            </div>

          </div>

        ))}

      </section>

    </main>
  );
}