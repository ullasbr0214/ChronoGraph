import EventCard from "../components/EventCard";
import { events } from "../data/events";

export default function Dashboard() {
  return (
    <div className="page-shell">

      {/* =========================
          HERO
      ========================= */}

      <section className="hero-section">

        <div>
          <p className="eyebrow">
            TEMPORAL GRAPH ANALYSIS
          </p>

          <h1>
            Reconstruct what happened.
            <br />
            <span>Understand why.</span>
          </h1>

          <p className="hero-description">
            ChronoGraph connects events across time,
            systems and evidence to reconstruct how
            an incident unfolded.
          </p>
        </div>

        <div className="case-status">
          <span className="status-dot" />
          ANALYSIS READY
        </div>

      </section>


      {/* =========================
          CASE METRICS
      ========================= */}

      <section className="metrics">

        <div className="metric-card">
          <span>TOTAL EVENTS</span>
          <strong>128</strong>
          <small>Across 4 sources</small>
        </div>

        <div className="metric-card">
          <span>RELATIONSHIPS</span>
          <strong>47</strong>
          <small>Connected graph nodes</small>
        </div>

        <div className="metric-card">
          <span>TIME WINDOW</span>
          <strong>14h</strong>
          <small>26 Aug 2026</small>
        </div>

        <div className="metric-card accent">
          <span>SEQUENCE SCORE</span>
          <strong>87%</strong>
          <small>Evidence correlation</small>
        </div>

      </section>


      {/* =========================
          INVESTIGATION AREA
      ========================= */}

      <section className="dashboard-grid">

        {/* EVENT STREAM */}

        <div className="panel">

          <div className="panel-header">

            <div>
              <p className="eyebrow">
                TEMPORAL SEQUENCE
              </p>

              <h2>
                Recent Activity
              </h2>
            </div>

            <button>
              Explore timeline →
            </button>

          </div>


          <div className="event-list">

            {events.map((event) => (
              <EventCard
                key={event.event_id}
                event={event}
              />
            ))}

          </div>

        </div>


        {/* AI RECONSTRUCTION */}

        <aside className="panel insight-panel">

          <p className="eyebrow">
            AI RECONSTRUCTION
          </p>

          <div className="insight-symbol">
            ◈
          </div>

          <h2>
            A connected
            <br />
            sequence emerged.
          </h2>

          <p>
            Four events across independent sources
            appear to form one operational sequence.
          </p>


          <div className="confidence">

            <div>
              <span>SEQUENCE CONFIDENCE</span>

              <strong>
                87%
              </strong>
            </div>

            <div className="confidence-bar">
              <div style={{ width: "87%" }} />
            </div>

          </div>


          <button className="investigate-button">
            Investigate sequence →
          </button>

        </aside>

      </section>

    </div>
  );
}