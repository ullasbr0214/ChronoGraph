import { useEffect, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Clock3,
} from "lucide-react";

export default function IncidentReplay({ events = [] }) {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing || events.length === 0) return;

    if (currentIndex >= events.length - 1) {
      setPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentIndex((index) => index + 1);
    }, 1800);

    return () => clearTimeout(timer);
  }, [playing, currentIndex, events.length]);

  const startReplay = () => {
    setCurrentIndex(0);
    setPlaying(true);
  };

  const resetReplay = () => {
    setPlaying(false);
    setCurrentIndex(-1);
  };

  const nextEvent = () => {
    if (currentIndex < events.length - 1) {
      setCurrentIndex((index) => index + 1);
    }
  };

  const activeEvent =
    currentIndex >= 0 ? events[currentIndex] : null;

  return (
    <section className="replay-panel">

      <div className="replay-header">

        <div>
          <p className="eyebrow">
            INCIDENT TIME MACHINE
          </p>

          <h2>
            Replay the incident
          </h2>

          <p>
            Watch the evidence unfold in temporal order.
          </p>
        </div>

        <div className="replay-clock">
          <Clock3 size={15} />

          {activeEvent
            ? new Date(activeEvent.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "--:--"}
        </div>

      </div>


      <div className="replay-track">

        <div className="replay-line" />

        {events.map((event, index) => {

          const active = index === currentIndex;
          const completed =
            currentIndex >= index;

          return (
            <div
              key={event.event_id}
              className={`replay-event ${
                active ? "active" : ""
              } ${completed ? "completed" : ""}`}
            >

              <div className="replay-node">
                <span />
              </div>

              <div className="replay-event-info">

                <span>
                  {new Date(
                    event.timestamp
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>

                <strong>
                  {event.title}
                </strong>

                <small>
                  {event.source}
                </small>

              </div>

            </div>
          );
        })}

      </div>


      {activeEvent && (
        <div className="replay-observation">

          <span className="eyebrow">
            CURRENT EVIDENCE
          </span>

          <h3>
            {activeEvent.title}
          </h3>

          <p>
            {activeEvent.description}
          </p>

          <div className="replay-meta">

            <span>
              {activeEvent.source}
            </span>

            <span>
              {activeEvent.event_type}
            </span>

            <span>
              {activeEvent.event_id}
            </span>

          </div>

        </div>
      )}


      <div className="replay-controls">

        <button
          onClick={resetReplay}
          title="Reset"
        >
          <RotateCcw size={15} />
          Reset
        </button>

        <button
          className="replay-primary"
          onClick={() => {
            if (currentIndex === -1) {
              startReplay();
            } else {
              setPlaying((value) => !value);
            }
          }}
        >
          {playing ? (
            <>
              <Pause size={15} />
              Pause
            </>
          ) : (
            <>
              <Play size={15} />
              {currentIndex === -1
                ? "Play incident"
                : "Resume"}
            </>
          )}
        </button>

        <button
          onClick={nextEvent}
          disabled={
            currentIndex >= events.length - 1
          }
        >
          <SkipForward size={15} />
          Next
        </button>

      </div>

    </section>
  );
}